from .. import db as db

# Import every model module so all mappers are registered before SQLAlchemy
# configures relationships. Schema modules (e.g. cell_schema) trigger mapper
# configuration at import time, and string references like Cell.users ->
# "User" fail if the target model was never imported. Previously this worked
# only because resources/cell_data.py happened to import models early.
from . import cell as cell  # noqa: E402,F401
from . import data as data  # noqa: E402,F401
from . import logger as logger  # noqa: E402,F401
from . import oauth_token as oauth_token  # noqa: E402,F401
from . import power_data as power_data  # noqa: E402,F401
from . import sensor as sensor  # noqa: E402,F401
from . import teros_data as teros_data  # noqa: E402,F401
from . import user as user  # noqa: E402,F401
