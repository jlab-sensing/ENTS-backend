from . import ma


class GetCellStatisticsSchema(ma.Schema):
    """validates get request for cell statistics"""

    startTime = ma.DateTime("rfc", required=False)
    endTime = ma.DateTime("rfc", required=False)
