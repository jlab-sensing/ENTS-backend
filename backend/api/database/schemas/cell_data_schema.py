from ....api import ma


class CellDataSchema(ma.SQLAlchemySchema):
    ts = ma.DateTime()
    vwc = ma.Float()
    temp = ma.Float()
    ec = ma.Float()
    v = ma.Float()
    i = ma.Float()
    p = ma.Float()
