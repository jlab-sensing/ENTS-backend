"""power_teros_data_migration

Revision ID: e2d5135289bc
Revises: 94004fb2d7c4
Create Date: 2026-01-14 19:53:11.356915

"""

from alembic import op
import sqlalchemy as sa
from datetime import datetime


# revision identifiers, used by Alembic.
revision = "e2d5135289bc"
down_revision = "94004fb2d7c4"
branch_labels = None
depends_on = None


def upgrade():
    # Get a connection to perform SQL operations
    connection = op.get_bind()

    # =========================================================================
    # STEP 1: Pre-flight checks
    # =========================================================================

    # Check if source tables exist
    table_check = sa.text("""
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('power_data', 'teros_data')
    """)
    existing_tables = {row[0] for row in connection.execute(table_check)}

    has_power_data = 'power_data' in existing_tables
    has_teros_data = 'teros_data' in existing_tables

    if not has_power_data and not has_teros_data:
        print("Neither power_data nor teros_data tables exist. Nothing to migrate.")
        return

    print(f"Found tables: power_data={has_power_data}, teros_data={has_teros_data}")

    # =========================================================================
    # STEP 2: Reset sequences using dynamic lookup (handles custom names)
    # =========================================================================

    # Reset sensor sequence
    connection.execute(
        sa.text("""
            SELECT setval(
                pg_get_serial_sequence('sensor', 'id'),
                COALESCE((SELECT MAX(id) FROM sensor), 0) + 1,
                false
            )
        """)
    )

    # Reset data sequence
    connection.execute(
        sa.text("""
            SELECT setval(
                pg_get_serial_sequence('data', 'id'),
                COALESCE((SELECT MAX(id) FROM data), 0) + 1,
                false
            )
        """)
    )
    print("Reset sequences to current max + 1")

    # =========================================================================
    # STEP 3: Validate foreign key constraints
    # =========================================================================

    # Get all valid cell_ids from the cell table
    valid_cell_ids_query = sa.text("SELECT id FROM cell")
    valid_cell_ids = {row[0] for row in connection.execute(valid_cell_ids_query)}
    print(f"Found {len(valid_cell_ids)} valid cells in cell table")

    if len(valid_cell_ids) == 0:
        print("WARNING: No cells found in cell table. Migration will skip all records.")

    # Check for orphaned cell_ids in power_data
    if has_power_data:
        orphan_check = sa.text("""
            SELECT DISTINCT cell_id FROM power_data
            WHERE cell_id IS NOT NULL
            AND cell_id NOT IN (SELECT id FROM cell)
        """)
        orphaned_power_cells = [row[0] for row in connection.execute(orphan_check)]
        if orphaned_power_cells:
            print(f"WARNING: power_data contains {len(orphaned_power_cells)} cell_ids not in cell table: {orphaned_power_cells[:10]}...")
            print("These records will be SKIPPED to avoid FK constraint violations.")

    # Check for orphaned cell_ids in teros_data
    if has_teros_data:
        orphan_check = sa.text("""
            SELECT DISTINCT cell_id FROM teros_data
            WHERE cell_id IS NOT NULL
            AND cell_id NOT IN (SELECT id FROM cell)
        """)
        orphaned_teros_cells = [row[0] for row in connection.execute(orphan_check)]
        if orphaned_teros_cells:
            print(f"WARNING: teros_data contains {len(orphaned_teros_cells)} cell_ids not in cell table: {orphaned_teros_cells[:10]}...")
            print("These records will be SKIPPED to avoid FK constraint violations.")

    # =========================================================================
    # STEP 4: Check existing data count
    # =========================================================================

    check_query = sa.text("SELECT COUNT(*) FROM data")
    existing_count = connection.execute(check_query).scalar()

    if existing_count > 0:
        print(f"Data table already contains {existing_count} records. Will check for duplicates during migration.")

    # =========================================================================
    # STEP 5: Define table models and helper functions
    # =========================================================================

    # Track migration progress
    migrated_count = 0
    skipped_count = 0
    skipped_orphan_count = 0

    # Define all the table models we'll need
    power_data = sa.Table(
        "power_data",
        sa.MetaData(),
        sa.Column("id", sa.Integer, primary_key=True),
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
        sa.Column("id", sa.Integer, primary_key=True),
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
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("cell_id", sa.Integer),
        sa.Column("measurement", sa.Text),
        sa.Column("data_type", sa.Text),
        sa.Column("unit", sa.Text),
        sa.Column("name", sa.Text),
    )

    data = sa.Table(
        "data",
        sa.MetaData(),
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("sensor_id", sa.Integer),
        sa.Column("ts", sa.DateTime),
        sa.Column("ts_server", sa.DateTime),
        sa.Column("float_val", sa.Float),
        sa.Column("int_val", sa.Integer),
        sa.Column("text_val", sa.Text),
    )

    # Cache for existing timestamps per sensor (to avoid repeated DB queries)
    existing_timestamps_cache = {}

    def get_existing_timestamps(sensor_id):
        """Get all existing timestamps for a given sensor (with caching)"""
        if sensor_id not in existing_timestamps_cache:
            query = sa.select(data.c.ts).where(data.c.sensor_id == sensor_id)
            result = connection.execute(query)
            existing_timestamps_cache[sensor_id] = set(row[0] for row in result)
        return existing_timestamps_cache[sensor_id]

    def update_timestamp_cache(sensor_id, new_timestamps):
        """Update cache with newly inserted timestamps"""
        if sensor_id in existing_timestamps_cache:
            existing_timestamps_cache[sensor_id].update(new_timestamps)
        else:
            existing_timestamps_cache[sensor_id] = set(new_timestamps)

    def get_or_create_sensor(cell_id, measurement, data_type, unit, name):
        """Get existing sensor or create new one"""
        sensor_query = sa.select(sensor.c.id).where(
            sa.and_(
                sensor.c.cell_id == cell_id,
                sensor.c.measurement == measurement,
                sensor.c.name == name,
            )
        )
        sensor_id = connection.execute(sensor_query).scalar()

        if not sensor_id:
            sensor_insert = sensor.insert().values(
                cell_id=cell_id,
                measurement=measurement,
                data_type=data_type,
                unit=unit,
                name=name,
            )
            result = connection.execute(sensor_insert.returning(sensor.c.id))
            sensor_id = result.scalar()
            print(f"  Created {name}/{measurement} sensor with ID {sensor_id}")

        return sensor_id

    def insert_data_batch(data_values, data_type=""):
        """Insert data values while checking for duplicates"""
        nonlocal migrated_count, skipped_count

        if not data_values:
            return

        # Group by sensor_id for efficient duplicate checking
        data_by_sensor = {}
        for value in data_values:
            sensor_id = value["sensor_id"]
            if sensor_id not in data_by_sensor:
                data_by_sensor[sensor_id] = []
            data_by_sensor[sensor_id].append(value)

        # Process each sensor's data
        new_data_values = []
        for sensor_id, sensor_data in data_by_sensor.items():
            # Get existing timestamps for this sensor (from cache)
            existing_timestamps = get_existing_timestamps(sensor_id)

            # Track timestamps we're about to insert (for within-batch deduplication)
            batch_timestamps = set()

            # Filter out duplicates (both existing and within-batch)
            for value in sensor_data:
                ts = value["ts"]
                if ts not in existing_timestamps and ts not in batch_timestamps:
                    new_data_values.append(value)
                    batch_timestamps.add(ts)
                else:
                    skipped_count += 1

            # Update cache with newly inserted timestamps
            update_timestamp_cache(sensor_id, batch_timestamps)

        # Insert non-duplicate data in chunks
        chunk_size = 1000
        for i in range(0, len(new_data_values), chunk_size):
            chunk = new_data_values[i : i + chunk_size]
            if chunk:
                connection.execute(data.insert(), chunk)
                migrated_count += len(chunk)

        if new_data_values:
            print(f"    Inserted {len(new_data_values)} new {data_type} records, skipped {len(data_values) - len(new_data_values)} duplicates")

    # =========================================================================
    # STEP 6: Migrate power_data
    # =========================================================================

    try:
        if has_power_data:
            print("\n" + "=" * 60)
            print("MIGRATING power_data TO data TABLE")
            print("=" * 60)

            # Get all unique cell_ids from power_data (excluding NULL and invalid cells)
            cell_ids_query = sa.text("""
                SELECT DISTINCT cell_id FROM power_data
                WHERE cell_id IS NOT NULL
                AND cell_id IN (SELECT id FROM cell)
                ORDER BY cell_id
            """)
            power_cell_ids = [row[0] for row in connection.execute(cell_ids_query)]
            print(f"Found {len(power_cell_ids)} valid unique cells in power_data")

            # Count skipped orphan records
            orphan_count_query = sa.text("""
                SELECT COUNT(*) FROM power_data
                WHERE cell_id IS NULL OR cell_id NOT IN (SELECT id FROM cell)
            """)
            orphan_power_count = connection.execute(orphan_count_query).scalar()
            if orphan_power_count > 0:
                print(f"Skipping {orphan_power_count} power_data records with invalid cell_id")
                skipped_orphan_count += orphan_power_count

            # Process each cell_id
            for cell_id in power_cell_ids:
                print(f"\nProcessing power_data for cell_id: {cell_id}")

                # Create/get voltage sensor
                voltage_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="voltage",
                    data_type="float",
                    unit="V",
                    name="power",
                )

                # Create/get current sensor
                current_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="current",
                    data_type="float",
                    unit="A",
                    name="power",
                )

                # Migrate data in batches
                batch_size = 10000
                offset = 0

                while True:
                    power_records_query = (
                        sa.select(
                            power_data.c.ts,
                            power_data.c.ts_server,
                            power_data.c.voltage,
                            power_data.c.current,
                        )
                        .where(power_data.c.cell_id == cell_id)
                        .order_by(power_data.c.id)
                        .limit(batch_size)
                        .offset(offset)
                    )

                    power_records = connection.execute(power_records_query).fetchall()

                    if not power_records:
                        break

                    print(f"  Processing batch of {len(power_records)} power records (offset {offset})")

                    # Prepare and insert voltage data
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
                        if record.voltage is not None
                    ]
                    insert_data_batch(voltage_data_values, "voltage")

                    # Prepare and insert current data
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
                        if record.current is not None
                    ]
                    insert_data_batch(current_data_values, "current")

                    offset += batch_size

            print("\nFinished migrating power_data")

        # =========================================================================
        # STEP 7: Migrate teros_data
        # =========================================================================

        if has_teros_data:
            print("\n" + "=" * 60)
            print("MIGRATING teros_data TO data TABLE")
            print("=" * 60)

            # Get all unique cell_ids from teros_data (excluding NULL and invalid cells)
            cell_ids_query = sa.text("""
                SELECT DISTINCT cell_id FROM teros_data
                WHERE cell_id IS NOT NULL
                AND cell_id IN (SELECT id FROM cell)
                ORDER BY cell_id
            """)
            teros_cell_ids = [row[0] for row in connection.execute(cell_ids_query)]
            print(f"Found {len(teros_cell_ids)} valid unique cells in teros_data")

            # Count skipped orphan records
            orphan_count_query = sa.text("""
                SELECT COUNT(*) FROM teros_data
                WHERE cell_id IS NULL OR cell_id NOT IN (SELECT id FROM cell)
            """)
            orphan_teros_count = connection.execute(orphan_count_query).scalar()
            if orphan_teros_count > 0:
                print(f"Skipping {orphan_teros_count} teros_data records with invalid cell_id")
                skipped_orphan_count += orphan_teros_count

            # Process each cell_id
            for cell_id in teros_cell_ids:
                print(f"\nProcessing teros_data for cell_id: {cell_id}")

                # Create/get all teros sensors
                vwc_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="vwcAdj",
                    data_type="float",
                    unit="%",
                    name="teros12",
                )

                raw_vwc_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="vwcRaw",
                    data_type="float",
                    unit="V",
                    name="teros12",
                )

                temp_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="temp",
                    data_type="float",
                    unit="C",
                    name="teros12",
                )

                ec_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="ec",
                    data_type="int",
                    unit="uS/cm",  # Using ASCII-safe version
                    name="teros12",
                )

                water_pot_sensor_id = get_or_create_sensor(
                    cell_id=cell_id,
                    measurement="waterPot",
                    data_type="float",
                    unit="kPa",
                    name="teros12",
                )

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
                            teros_data.c.ec,
                            teros_data.c.water_pot,
                        )
                        .where(teros_data.c.cell_id == cell_id)
                        .order_by(teros_data.c.id)
                        .limit(batch_size)
                        .offset(offset)
                    )

                    teros_records = connection.execute(teros_records_query).fetchall()

                    if not teros_records:
                        break

                    print(f"  Processing batch of {len(teros_records)} teros records (offset {offset})")

                    # Insert each measurement type separately for better deduplication
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
                        if record.vwc is not None
                    ]
                    insert_data_batch(vwc_data_values, "vwc")

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
                        if record.raw_vwc is not None
                    ]
                    insert_data_batch(raw_vwc_data_values, "raw_vwc")

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
                        if record.temp is not None
                    ]
                    insert_data_batch(temp_data_values, "temp")

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
                        if record.ec is not None
                    ]
                    insert_data_batch(ec_data_values, "ec")

                    # Water potential data
                    water_pot_data_values = [
                        {
                            "sensor_id": water_pot_sensor_id,
                            "ts": record.ts,
                            "ts_server": record.ts_server,
                            "float_val": record.water_pot,
                            "int_val": None,
                            "text_val": None,
                        }
                        for record in teros_records
                        if record.water_pot is not None
                    ]
                    insert_data_batch(water_pot_data_values, "water_pot")

                    offset += batch_size

            print("\nFinished migrating teros_data")

        # =========================================================================
        # STEP 8: Final summary and verification
        # =========================================================================

        print("\n" + "=" * 60)
        print("MIGRATION SUMMARY")
        print("=" * 60)

        final_count = connection.execute(sa.text("SELECT COUNT(*) FROM data")).scalar()
        sensor_count = connection.execute(sa.text("SELECT COUNT(*) FROM sensor")).scalar()

        print(f"  Records migrated: {migrated_count}")
        print(f"  Duplicate records skipped: {skipped_count}")
        print(f"  Orphan records skipped (invalid cell_id): {skipped_orphan_count}")
        print(f"  Sensors created/used: {sensor_count}")
        print(f"  Final data table count: {final_count}")

        # Add migration completion comment with actual date
        migration_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        op.execute(
            sa.text(f"""
            COMMENT ON TABLE data IS 'Power and TEROS data migrated from legacy tables on {migration_date}'
            """)
        )

        print(f"\nMigration completed successfully at {migration_date}")

    except Exception as e:
        # Alembic will handle the rollback automatically
        print(f"\nMIGRATION FAILED: {e}")
        print("Transaction will be rolled back automatically.")
        raise


def downgrade():
    # Since this is a data migration, downgrading would be complex and potentially lossy
    # It would require reconstructing the original tables from the data table
    # This is highly risky and generally not recommended
    print("Downgrade is not implemented for this migration as it would be lossy")
    print("To reverse this migration, restore from a database backup taken before the migration.")
    pass
