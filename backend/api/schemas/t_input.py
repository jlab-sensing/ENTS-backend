from . import ma


class TInput(ma.SQLAlchemySchema):
    """validates teros input"""

    type = ma.String()
    cell = ma.String()
    ts = ma.TimeDelta(precision="microseconds")
    vwc = ma.Float()
    raw_vwc = ma.Float()
    temp = ma.Float()
    ec = ma.Float()
    water_pot = ma.Float(required=False, allow_none=True, load_default=None)
