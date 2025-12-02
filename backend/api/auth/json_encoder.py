from json import JSONEncoder
from uuid import UUID


class UUIDSerializer(JSONEncoder):
    def default(self, value: any) -> str:
        """UUID serialization: turns UUID into string representation"""

        # check type is UUID and stringify
        if isinstance(value, UUID):
            return value.urn

        return super(UUIDSerializer, self).default(value)
