from ..schemas import ma


class CellDataSchema(ma.SQLAlchemySchema):
    """validates cell data"""
    ts = ma.DateTime()
    vwc = ma.Float()
    temp = ma.Float()
    ec = ma.Float()
    v = ma.Float()
    i = ma.Float()
    p = ma.Float()
