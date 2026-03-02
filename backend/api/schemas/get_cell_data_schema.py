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
    # @validates('time_created')
    # def is_not_in_future(value):
    #     """'value' is the datetime parsed from time_created by marshmallow"""
    #     now = datetime.now()
    #     if value > now:
    #         raise ValidationError("Can't create notes in the future!")
