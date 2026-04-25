from datetime import datetime

from api import db
from api.models.cell import Cell
from api.models.data import Data
from api.models.logger import Logger
from api.models.power_data import PowerData
from api.models.sensor import Sensor
from api.models.teros_data import TEROSData


def test_cell_data_streams_csv(init_database):
    cell1 = Cell("cell_csv_1", "", 1, 1, False, None)
    cell2 = Cell("cell_csv_2", "", 1, 1, False, None)
    logger = Logger("logger_csv_1")
    db.session.add_all([cell1, cell2, logger])
    db.session.commit()

    ts = datetime(2024, 1, 1, 12, 0)
    ts2 = datetime(2024, 1, 1, 12, 30)

    db.session.add(
        TEROSData(
            cell_id=cell1.id,
            ts=ts,
            vwc=0.42,
            raw_vwc=420.0,
            temp=21.5,
            ec=120,
            water_pot=0.0,
        )
    )
    # Second cell has only TEROS data so we can validate void-filling.
    db.session.add(
        TEROSData(
            cell_id=cell2.id,
            ts=ts,
            vwc=0.5,  # fractional should normalize to 50.0
            raw_vwc=500.0,
            temp=20.0,
            ec=100,
            water_pot=0.0,
        )
    )
    db.session.add(
        PowerData(
            logger_id=logger.id,
            cell_id=cell1.id,
            ts=ts,
            voltage=1.5,
            current=0.002,
        )
    )
    sensor = Sensor(
        cell_id=cell1.id,
        measurement="voltage",
        data_type="float",
        unit="V",
        name="phytos31",
    )
    db.session.add(sensor)
    db.session.commit()
    db.session.add(Data(sensor_id=sensor.id, ts=ts, float_val=3.14))
    # Add a second TEROS point within the same hour to validate resample=hour averaging.
    db.session.add(
        TEROSData(
            cell_id=cell1.id,
            ts=ts2,
            vwc=50.0,  # already percent; should not double scale
            raw_vwc=500.0,
            temp=22.5,
            ec=130,
            water_pot=0.0,
        )
    )
    db.session.commit()

    response = init_database.get(
        "/api/cell/datas",
        query_string={
            "cellIds": f"{cell1.id},{cell2.id}",
            "resample": "none",
            "startTime": "Mon, 01 Jan 2024 00:00:00 GMT",
            "endTime": "Tue, 02 Jan 2024 00:00:00 GMT",
        },
    )

    assert response.status_code == 200
    assert response.mimetype == "text/csv"
    assert "attachment;" in response.headers["Content-Disposition"]
    assert response.is_streamed

    body = response.get_data(as_text=True)
    lines = body.strip().splitlines()

    expected_header = (
        "cell_id,cell_name,timestamp,vwc,temp,ec,raw_vwc,v,i,p,data,"
        "measurement,unit,type"
    )
    assert lines[0] == expected_header
    expected_line1 = (
        f"{cell1.id},{cell1.name},2024-01-01 12:00:00,42.0,21.5,120,420.0,"
        "1500.0,2000.0,3000.0,3.14,voltage,V,float"
    )
    assert expected_line1 in lines
    # Validate missing power/sensor columns become "void" for the second cell.
    expected_line2 = (
        f"{cell2.id},{cell2.name},2024-01-01 12:00:00,50.0,20.0,100,500.0,"
        "void,void,void,void,void,void,void"
    )
    assert expected_line2 in lines

    # Resample=hour should average normalized VWC values (0.42->42 and 50 stays 50).
    response_resampled = init_database.get(
        "/api/cell/datas",
        query_string={
            "cellIds": str(cell1.id),
            "resample": "hour",
            "startTime": "Mon, 01 Jan 2024 00:00:00 GMT",
            "endTime": "Tue, 02 Jan 2024 00:00:00 GMT",
        },
    )
    assert response_resampled.status_code == 200
    body2 = response_resampled.get_data(as_text=True)
    # Expected average: (42 + 50) / 2 = 46.0
    assert f"{cell1.id},{cell1.name},2024-01-01 12:00:00,46.0" in body2
