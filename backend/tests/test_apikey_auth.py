import jwt

from api.auth.auth import config
from api.models.user import User


def make_user(email="apikey-auth-test@x.com", api_key="test_apikey"):
    user = User(
        first_name="API",
        last_name="KeyTest",
        email=email,
        password="password",
    )
    user.api_key = api_key
    user.save()
    return user


def make_jwt_header(user):
    config["accessToken"] = "test_access_token_secret_32_characters"
    token = jwt.encode(
        {"uid": str(user.id)},
        config["accessToken"],
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}


def request_apikey_endpoint(client, method="get", headers=None):
    request_method = getattr(client, method)
    response = request_method("/api/apikey/", headers=headers)
    if response.status_code != 404:
        return response
    return request_method("/api/apikey", headers=headers)


def test_apikey_endpoint_rejects_apikey(init_database):
    user = make_user(
        email="apikey-only-user@x.com",
        api_key="valid-apikey-for-rejection_test",
    )
    response = request_apikey_endpoint(
        init_database,
        headers={"X-API-Key": user.api_key},
    )
    assert response.status_code in (401, 403)


def test_apikey_endpoint_accepts_jwt(init_database):
    user = make_user(
        email="apikey-user@x.com",
        api_key="jwt_user_apikey",
    )

    response = request_apikey_endpoint(
        init_database,
        headers=make_jwt_header(user),
    )
    assert response.status_code != 401
    assert response.status_code != 403
    assert response.status_code != 404


def test_protected_cell_endpoint_accepts_apikey(init_database):
    user = make_user(
        email="apikey-only-user@edx.com",
        api_key="valid-apikey-for-cell_test",
    )

    response = init_database.post(
        "/api/cell/",
        json={
            "name": "API Key Test Cell",
            "location": "Test Location",
            "latitude": 0,
            "longitude": 0,
            "userEmail": user.email,
            "archive": False,
        },
        headers={"X-API-Key": user.api_key},
        content_type="application/json",
    )
    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Successfully added cell"


def test_protected_cell_endpoint_rejects_invalid_apikey(init_database):
    response = init_database.post(
        "/api/cell/",
        json={
            "name": "Bad API Key Cell",
            "location": "Test Location",
            "latitude": 0,
            "longitude": 0,
            "userEmail": "missing@x.com",
            "archive": False,
        },
        headers={"X-API-Key": "not-real-key"},
        content_type="application/json",
    )
    assert response.status_code in (401, 403)
