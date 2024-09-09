from api.auth.json_encoder import UUIDSerializer
from uuid import uuid4
import jwt


def test_json_encoder_uuid():
    """
    GIVEN a payload with uuid
    WHEN jwt encodes with UUIDSerializer
    THEN UUIDs should be encoded in urn format
    """
    user_id = uuid4()
    key = "test"
    token = jwt.encode(
        {
            "uid": user_id,
        },
        key,
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    decoded_token = jwt.decode(token, key, algorithms=["HS256"])
    print(decoded_token)
    assert decoded_token["uid"] == user_id.urn


def test_json_encoder_non_uuid():
    """
    GIVEN a payload without uuid
    WHEN jwt encodes with UUIDSerializer
    THEN types should encode as usual
    """
    user_id = "idksomeid"
    key = "test"
    token = jwt.encode(
        {
            "uid": user_id,
        },
        key,
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    decoded_token = jwt.decode(token, key, algorithms=["HS256"])
    print(decoded_token)
    assert decoded_token["uid"] == "idksomeid"
