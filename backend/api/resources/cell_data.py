import csv
from datetime import datetime
from io import StringIO

from flask import Response, request, stream_with_context
from flask_restful import Resource
from sqlalchemy import func
from dateutil.relativedelta import relativedelta

from ..models import db
from ..models.cell import Cell
from ..models.data import Data
from ..models.power_data import PowerData
from ..models.sensor import Sensor
from ..models.teros_data import TEROSData
from ..schemas.get_cell_data_schema import GetCellDataSchema

get_cell_data = GetCellDataSchema()

CSV_HEADERS = [
    "cell_id",
    "cell_name",
    "timestamp",
    "vwc",
    "temp",
    "ec",
    "raw_vwc",
    "v",
    "i",
    "p",
    "data",
    "measurement",
    "unit",
    "type",
]

VOID = "void"

def _serialize_timestamp(timestamp):
    if timestamp is None:
        return VOID
    if isinstance(timestamp, datetime):
        return timestamp.isoformat(sep=" ")
    return str(timestamp)


def _cell_filename():
    stamp = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    return f"cell-data-{stamp}.csv"


def _normalize_time_range(start_time, end_time):
    if start_time is None:
        start_time = datetime.now() - relativedelta(months=1)
    if end_time is None:
        end_time = datetime.now()
    return start_time, end_time


def _iter_teros_rows(cell_id, resample, start_time, end_time):
    if resample == "none":
        stmt = (
            db.select(
                TEROSData.ts.label("timestamp"),
                TEROSData.vwc.label("vwc"),
                TEROSData.temp.label("temp"),
                TEROSData.ec.label("ec"),
                TEROSData.raw_vwc.label("raw_vwc"),
            )
            .where(
                (TEROSData.cell_id == cell_id)
                & (TEROSData.ts.between(start_time, end_time))
            )
            .order_by(TEROSData.ts)
        )
    else:
        date_trunc = func.date_trunc(resample, TEROSData.ts).label("timestamp")
        normalized_vwc = TEROSData._to_percent_if_fraction_expr(TEROSData.vwc)
        stmt = (
            db.select(
                date_trunc,
                func.avg(normalized_vwc).label("vwc"),
                func.avg(TEROSData.temp).label("temp"),
                func.avg(TEROSData.ec).label("ec"),
                func.avg(TEROSData.raw_vwc).label("raw_vwc"),
            )
            .where(
                (TEROSData.cell_id == cell_id)
                & (TEROSData.ts.between(start_time, end_time))
            )
            .group_by(date_trunc)
            .order_by(date_trunc)
        )

    # Ensure large exports don't get fully buffered in memory by the DB driver.
    result = db.session.execute(stmt.execution_options(stream_results=True)).yield_per(
        1000
    )
    for row in result:
        yield {
            "timestamp": row.timestamp,
            "vwc": TEROSData._to_percent_if_fraction(row.vwc),
            "temp": row.temp,
            "ec": int(row.ec) if row.ec is not None else None,
            "raw_vwc": row.raw_vwc,
        }


def _iter_power_rows(cell_id, resample, start_time, end_time):
    if resample == "none":
        stmt = (
            db.select(
                PowerData.ts.label("timestamp"),
                (PowerData.voltage * 1e3).label("v"),
                (PowerData.current * 1e6).label("i"),
                (PowerData.voltage * PowerData.current * 1e6).label("p"),
            )
            .where(
                (PowerData.cell_id == cell_id)
                & (PowerData.ts.between(start_time, end_time))
            )
            .order_by(PowerData.ts)
        )
    else:
        date_trunc = func.date_trunc(resample, PowerData.ts).label("timestamp")
        stmt = (
            db.select(
                date_trunc,
                func.avg(PowerData.voltage * 1e3).label("v"),
                func.avg(PowerData.current * 1e6).label("i"),
                func.avg(PowerData.voltage * PowerData.current * 1e6).label("p"),
            )
            .where(
                (PowerData.cell_id == cell_id)
                & (PowerData.ts.between(start_time, end_time))
            )
            .group_by(date_trunc)
            .order_by(date_trunc)
        )

    result = db.session.execute(stmt.execution_options(stream_results=True)).yield_per(
        1000
    )
    for row in result:
        yield {
            "timestamp": row.timestamp,
            "v": row.v,
            "i": row.i,
            "p": row.p,
        }


def _sensor_value_column(data_type):
    if data_type == "float":
        return Data.float_val
    if data_type == "int":
        return Data.int_val
    if data_type == "text":
        return Data.text_val
    return None


def _iter_sensor_rows(cell_id, resample, start_time, end_time):
    sensor = Sensor.query.filter_by(
        name="phytos31",
        measurement="voltage",
        cell_id=cell_id,
    ).first()

    if sensor is None:
        return

    value_column = _sensor_value_column(sensor.data_type)
    if value_column is None:
        return

    # Text values can't be averaged; safest behavior is to disable resampling
    # rather than raising a 500 during export.
    if resample != "none" and sensor.data_type == "text":
        resample = "none"

    if resample == "none":
        stmt = (
            db.select(
                Data.ts.label("timestamp"),
                value_column.label("data"),
            )
            .where(Data.sensor_id == sensor.id)
            .filter(Data.ts.between(start_time, end_time))
            .order_by(Data.ts)
        )
    else:
        date_trunc = func.date_trunc(resample, Data.ts).label("timestamp")
        stmt = (
            db.select(
                date_trunc,
                func.avg(value_column).label("data"),
            )
            .where(Data.sensor_id == sensor.id)
            .filter(Data.ts.between(start_time, end_time))
            .group_by(date_trunc)
            .order_by(date_trunc)
        )

    result = db.session.execute(stmt.execution_options(stream_results=True)).yield_per(
        1000
    )
    for row in result:
        yield {
            "timestamp": row.timestamp,
            "data": row.data,
            "measurement": sensor.measurement,
            "unit": sensor.unit,
            "type": sensor.data_type,
        }


def _next_or_none(iterator):
    try:
        return next(iterator)
    except StopIteration:
        return None


def _merge_cell_rows(cell):
    teros_rows = _iter_teros_rows(
        cell["id"],
        cell["resample"],
        cell["start_time"],
        cell["end_time"],
    )
    power_rows = _iter_power_rows(
        cell["id"],
        cell["resample"],
        cell["start_time"],
        cell["end_time"],
    )
    sensor_rows = _iter_sensor_rows(
        cell["id"],
        cell["resample"],
        cell["start_time"],
        cell["end_time"],
    )

    sources = [
        {"iterator": iter(teros_rows), "current": None},
        {"iterator": iter(power_rows), "current": None},
        {"iterator": iter(sensor_rows or ()), "current": None},
    ]

    for source in sources:
        source["current"] = _next_or_none(source["iterator"])

    while any(source["current"] is not None for source in sources):
        current_timestamp = min(
            source["current"]["timestamp"]
            for source in sources
            if source["current"] is not None
        )
        row = {
            "cell_id": cell["id"],
            "cell_name": cell["name"],
            "timestamp": _serialize_timestamp(current_timestamp),
            "vwc": VOID,
            "temp": VOID,
            "ec": VOID,
            "raw_vwc": VOID,
            "v": VOID,
            "i": VOID,
            "p": VOID,
            "data": VOID,
            "measurement": VOID,
            "unit": VOID,
            "type": VOID,
        }

        for source in sources:
            while (
                source["current"] is not None
                and source["current"]["timestamp"] == current_timestamp
            ):
                for key, value in source["current"].items():
                    if key != "timestamp" and value is not None:
                        row[key] = value
                source["current"] = _next_or_none(source["iterator"])

        yield row


def _stream_csv_rows(cells, resample, start_time, end_time):
    line_buffer = StringIO()
    writer = csv.DictWriter(line_buffer, fieldnames=CSV_HEADERS)
    writer.writeheader()
    yield line_buffer.getvalue()
    line_buffer.seek(0)
    line_buffer.truncate(0)

    for cell in cells:
        cell["resample"] = resample
        cell["start_time"] = start_time
        cell["end_time"] = end_time
        for row in _merge_cell_rows(cell):
            writer.writerow(row)
            yield line_buffer.getvalue()
            line_buffer.seek(0)
            line_buffer.truncate(0)


class Cell_Data(Resource):
    def get(self):
        v_args = get_cell_data.load(dict(request.args))
        start_time, end_time = _normalize_time_range(
            v_args.get("startTime"),
            v_args.get("endTime"),
        )
        cell_ids = [
            int(cell_id.strip())
            for cell_id in v_args["cellIds"].split(",")
            if cell_id.strip()
        ]
        cells = (
            Cell.query.with_entities(Cell.id, Cell.name)
            .filter(Cell.id.in_(cell_ids))
            .order_by(Cell.id)
            .all()
        )
        cell_rows = [{"id": cell.id, "name": cell.name} for cell in cells]

        response = Response(
            stream_with_context(
                _stream_csv_rows(
                    cell_rows,
                    v_args["resample"],
                    start_time,
                    end_time,
                )
            ),
            mimetype="text/csv",
        )
        response.headers["Content-Disposition"] = (
            f'attachment; filename="{_cell_filename()}"'
        )
        return response

    def post(self):
        pass
