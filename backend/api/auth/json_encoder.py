from json import JSONEncoder
from uuid import UUID


class UUIDSerializer(JSONEncoder):
    def default(self, value: any) -> str:
        """UUID serialization: turns UUID into urn string representation"""

        # check type is UUID and stringify urn representation
        if isinstance(value, UUID):
            print(value.urn, type(value.urn), flush=True)
            return str(value.urn)

        return super(UUIDSerializer, self).default(value)
