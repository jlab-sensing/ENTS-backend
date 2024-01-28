from json import JSONEncoder
from uuid import UUID


class UUIDSerializer(JSONEncoder):
    def default(self, value: any) -> str:
        """JSON serialization conversion function."""

        # If it's an IP, which is not normally
        # serializable, convert to string.
        if isinstance(value, UUID):
            print(value.urn, type(value.urn), flush=True)
            return str(value.urn)
        # Here you can have other handling for your
        # UUIDs, or datetimes, or whatever else you
        # have.

        # Otherwise, default to super
        return super(UUIDSerializer, self).default(value)
