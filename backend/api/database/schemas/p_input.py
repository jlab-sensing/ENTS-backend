from . import *


class PInput(ma.SQLAlchemySchema):
    """validates power input"""
    type = ma.String()
    logger = ma.String()
    cell = ma.String()
    ts = ma.TimeDelta(precision="microseconds")
    v = ma.Float()
    i = ma.Float()
