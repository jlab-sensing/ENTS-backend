from . import ma
from marshmallow import validate


class GetCellDataSchema(ma.SQLAlchemySchema):
    """validates get request for cell data"""

    cellIds = ma.Str()
    resample = ma.Str(
        required=False,
        validate=validate.OneOf(
            [
                "none",
                "second",
                "minute",
                "hour",
                "day",
                "week",
                "month",
                "quarter",
                "year",
            ]
        ),
        load_default="hour",
    )
    startTime = ma.DateTime("rfc", required=False)
    endTime = ma.DateTime("rfc", required=False)
    stream = ma.Bool(required=False)
