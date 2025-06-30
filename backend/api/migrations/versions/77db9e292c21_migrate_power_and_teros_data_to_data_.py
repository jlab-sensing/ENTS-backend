"""migrate_power_and_teros_data_to_data_table

Revision ID: 77db9e292c21
Revises: 596bac7fbbee
Create Date: 2025-05-14 12:01:11.182600

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "77db9e292c21"
down_revision = "596bac7fbbee"
branch_labels = None
depends_on = None


def upgrade():
    # Get a connection to perform SQL operations
    connection = op.get_bind()

    # Define all the table models we'll need
    power_data = sa.Table(
        "power_data",
        sa.MetaData(),
        sa.Column("id", sa.Integer),
        sa.Column("logger_id", sa.Integer),
        sa.Column("cell_id", sa.Integer),
        sa.Column("ts", sa.DateTime),
        sa.Column("ts_server", sa.DateTime),
        sa.Column("current", sa.Float),
        sa.Column("voltage", sa.Float),
    )

    teros_data = sa.Table(
        "teros_data",
        sa.MetaData(),
        sa.Column("id", sa.Integer),
        sa.Column("cell_id", sa.Integer),
        sa.Column("ts", sa.DateTime),
        sa.Column("ts_server", sa.DateTime),
        sa.Column("vwc", sa.Float),
        sa.Column("raw_vwc", sa.Float),
        sa.Column("temp", sa.Float),
        sa.Column("ec", sa.Integer),
        sa.Column("water_pot", sa.Float),
    )

    sensor = sa.Table(
        "sensor",
        sa.MetaData(),
        sa.Column("id", sa.Integer),
        sa.Column("cell_id", sa.Integer),
        sa.Column("measurement", sa.Text),
        sa.Column("data_type", sa.Text),
        sa.Column("unit", sa.Text),
        sa.Column("name", sa.Text),
        sa.Column("logger_id", sa.Integer),
    )

    data = sa.Table(
        "data",
        sa.MetaData(),
        sa.Column("id", sa.Integer),
        sa.Column("sensor_id", sa.Integer),
        sa.Column("ts", sa.DateTime),
        sa.Column("ts_server", sa.DateTime),
        sa.Column("float_val", sa.Float),
        sa.Column("int_val", sa.Integer),
        sa.Column("text_val", sa.Text),
    )

    # Part 1: Migrate power_data
    print("Starting migration of power_data to data table")

    # Get all unique cell_ids from power_data
    cell_ids_query = sa.select(sa.distinct(power_data.c.cell_id))
    cell_ids = [row[0] for row in connection.execute(cell_ids_query)]
    print(f"Found {len(cell_ids)} unique cells in power_data")

    # Process each cell_id
    for cell_id in cell_ids:
        print(f"Processing cell_id: {cell_id}")

        # 1. Create voltage sensor if it doesn't exist
        voltage_sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == "voltage",
                sensor.c.name == "power",
            )
        )
        voltage_sensor_id = connection.execute(voltage_sensor_query).scalar()

        if not voltage_sensor_id:
            # have no need for logger_id as it is not used in the sensor table
            # Insert voltage sensor
            voltage_sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement="voltage",
                data_type="float",
                unit="V",
                name="power",
            )
            result = connection.execute(
                voltage_sensor_insert.returning(sensor.c.id)
            )
            voltage_sensor_id = result.scalar()
            print(f"Created voltage sensor with ID {voltage_sensor_id}")

        # 2. Create current sensor if it doesn't exist
        current_sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == "current",
                sensor.c.name == "power",
            )
        )
        current_sensor_id = connection.execute(current_sensor_query).scalar()

        if not current_sensor_id:
            # have no need for logger_id as it is not used in the sensor table
            # Insert current sensor
            current_sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement="current",
                data_type="float",
                unit="A",
                name="power",
            )
            result = connection.execute(
                current_sensor_insert.returning(sensor.c.id)
            )
            current_sensor_id = result.scalar()
            print(f"Created current sensor with ID {current_sensor_id}")

        # 3. Migrate voltage data
        # Process in batches to avoid memory issues
        batch_size = 10000
        offset = 0

        while True:
            power_records_query = (
                sa.select(
                    power_data.c.ts, power_data.c.ts_server, power_data.c.voltage, power_data.c.current
                )
                .where(power_data.c.cell_id == cell_id)
                .order_by(power_data.c.id)
                .limit(batch_size)
                .offset(offset)
            )

            power_records = connection.execute(power_records_query).fetchall()

            if not power_records:
                break

            print(
                f"Migrating {len(power_records)} voltage records for cell_id {cell_id}"
            )

            # Prepare voltage data batch
            voltage_data_values = [
                {
                    "sensor_id": voltage_sensor_id,
                    "ts": record.ts,
                    "ts_server": record.ts_server,
                    "float_val": record.voltage,
                    "int_val": None,
                    "text_val": None,
                }
                for record in power_records
            ]

            print(f"Voltage data values: {voltage_data_values}")

            # Insert voltage data in chunks to avoid parameter limits
            chunk_size = 1000
            for i in range(0, len(voltage_data_values), chunk_size):
                chunk = voltage_data_values[i : i + chunk_size]
                connection.execute(data.insert(), chunk)

            print(f"Voltage data inserted")

            # 4. Migrate current data from the same batch
            current_data_values = [
                {
                    "sensor_id": current_sensor_id,
                    "ts": record.ts,
                    "ts_server": record.ts_server,
                    "float_val": record.current,
                    "int_val": None,
                    "text_val": None,
                }
                for record in power_records
            ]

            print(f"Current data values: {current_data_values}")

            # Insert current data in chunks
            for i in range(0, len(current_data_values), chunk_size):
                chunk = current_data_values[i : i + chunk_size]
                connection.execute(data.insert(), chunk)

            print(f"Current data inserted")

            offset += batch_size

    print("Finished migrating power_data to data table")

    # Part 2: Migrate teros_data
    print("Starting migration of teros_data to data table")

    # Get all unique cell_ids from teros_data
    cell_ids_query = sa.select(sa.distinct(teros_data.c.cell_id))
    cell_ids = [row[0] for row in connection.execute(cell_ids_query)]
    print(f"Found {len(cell_ids)} unique cells in teros_data")

    # Process each cell_id
    for cell_id in cell_ids:
        print(f"Processing cell_id: {cell_id}")

        # Create sensors for each teros measurement if they don't exist
        # 1. vwc sensor
        vwc_sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == "vwcAdj",
                sensor.c.name == "teros12",
            )
        )
        vwc_sensor_id = connection.execute(vwc_sensor_query).scalar()

        if not vwc_sensor_id:
            vwc_sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement="vwcAdj",
                data_type="float",
                unit="?",
                name="teros12",
            )
            result = connection.execute(
                vwc_sensor_insert.returning(sensor.c.id)
            )
            vwc_sensor_id = result.scalar()
            print(f"Created vwc sensor with ID {vwc_sensor_id}")

        # 2. raw_vwc sensor
        raw_vwc_sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == "vwcRaw",
                sensor.c.name == "teros12",
            )
        )
        raw_vwc_sensor_id = connection.execute(raw_vwc_sensor_query).scalar()

        if not raw_vwc_sensor_id:
            raw_vwc_sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement="vwcRaw",
                data_type="float",
                unit="V",
                name="teros12",
            )
            result = connection.execute(
                raw_vwc_sensor_insert.returning(sensor.c.id)
            )
            raw_vwc_sensor_id = result.scalar()
            print(f"Created raw_vwc sensor with ID {raw_vwc_sensor_id}")

        # 3. temp sensor
        temp_sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == "temp",
                sensor.c.name == "teros12",
            )
        )
        temp_sensor_id = connection.execute(temp_sensor_query).scalar()

        if not temp_sensor_id:
            temp_sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement="temp",
                data_type="float",
                unit="C",
                name="teros12",
            )
            result = connection.execute(
                temp_sensor_insert.returning(sensor.c.id)
            )
            temp_sensor_id = result.scalar()
            print(f"Created temp sensor with ID {temp_sensor_id}")

        # 4. ec sensor
        ec_sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == "ec",
                sensor.c.name == "teros12",
            )
        )
        ec_sensor_id = connection.execute(ec_sensor_query).scalar()

        if not ec_sensor_id:
            ec_sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement="ec",
                data_type="int",
                unit="µS/cm",
                name="teros12",
            )
            result = connection.execute(
                ec_sensor_insert.returning(sensor.c.id)
            )
            ec_sensor_id = result.scalar()
            print(f"Created ec sensor with ID {ec_sensor_id}")

        # Migrate teros data in batches
        batch_size = 10000
        offset = 0

        while True:
            teros_records_query = (
                sa.select(
                    teros_data.c.ts,
                    teros_data.c.ts_server,
                    teros_data.c.vwc,
                    teros_data.c.raw_vwc,
                    teros_data.c.temp,
                    teros_data.c.ec
                )
                .where(teros_data.c.cell_id == cell_id)
                .order_by(teros_data.c.id)
                .limit(batch_size)
                .offset(offset)
            )

            teros_records = connection.execute(teros_records_query).fetchall()

            if not teros_records:
                break

            print(f"Migrating {len(teros_records)} teros records for cell_id {cell_id}")

            # Prepare data batches for each measurement
            data_values = []

            # VWC data
            vwc_data_values = [
                {
                    "sensor_id": vwc_sensor_id,
                    "ts": record.ts,
                    "ts_server": record.ts_server,
                    "float_val": record.vwc,
                    "int_val": None,
                    "text_val": None,
                }
                for record in teros_records
            ]
            data_values.extend(vwc_data_values)

            # Raw VWC data
            raw_vwc_data_values = [
                {
                    "sensor_id": raw_vwc_sensor_id,
                    "ts": record.ts,
                    "ts_server": record.ts_server,
                    "float_val": record.raw_vwc,
                    "int_val": None,
                    "text_val": None,
                }
                for record in teros_records
            ]
            data_values.extend(raw_vwc_data_values)

            # Temperature data
            temp_data_values = [
                {
                    "sensor_id": temp_sensor_id,
                    "ts": record.ts,
                    "ts_server": record.ts_server,
                    "float_val": record.temp,
                    "int_val": None,
                    "text_val": None,
                }
                for record in teros_records
            ]
            data_values.extend(temp_data_values)

            # EC data
            ec_data_values = [
                {
                    "sensor_id": ec_sensor_id,
                    "ts": record.ts,
                    "ts_server": record.ts_server,
                    "float_val": None,
                    "int_val": record.ec,
                    "text_val": None,
                }
                for record in teros_records
            ]
            data_values.extend(ec_data_values)

            # Insert all teros data in chunks
            chunk_size = 1000
            for i in range(0, len(data_values), chunk_size):
                chunk = data_values[i : i + chunk_size]
                connection.execute(data.insert(), chunk)

            offset += batch_size

    print("Finished migrating teros_data to data table")

    # Optional: Add a comment to indicate that the migration is complete
    op.execute(
        """
    COMMENT ON TABLE data IS 'Power and TEROS data migrated from legacy tables on 2025-06-24'
    """
    )


def downgrade():
    # Since this is a data migration, downgrading would be complex and potentially lossy
    # It would require reconstructing the original tables from the data table
    # This is highly risky and generally not recommended
    print("Downgrade is not implemented for this migration as it would be lossy")
    pass
