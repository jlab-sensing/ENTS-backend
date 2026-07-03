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


def test_protected_tag_endpoint_accepts_apikey(init_database):
    user = make_user(
        email="apikey-only-user@tag.com",
        api_key="valid-apikey-for-tag_test",
    )

    response = init_database.post(
        "/api/tag/",
        json={
            "name": "API Key Test Tag",
            "description": "Created with API key auth",
        },
        headers={"X-API-Key": user.api_key},
        content_type="application/json",
    )
    assert response.status_code == 201
    data = response.get_json()
    assert data["message"] == "Tag created successfully"


def test_protected_tag_endpoint_rejects_invalid_apikey(init_database):
    response = init_database.post(
        "/api/tag/",
        json={
            "name": "Bad API Key Tag",
            "description": "Should not be created",
        },
        headers={"X-API-Key": "not-real-key"},
        content_type="application/json",
    )
    assert response.status_code in (401, 403)
