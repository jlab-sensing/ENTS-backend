import os
from flask import request, jsonify, make_response
from ...api import db
from ..database.models.user import User
from ..database.models.oauth_token import OAuthToken
from functools import wraps
from datetime import datetime, timedelta, timezone
import jwt
from .json_encoder import UUIDSerializer
from flask_restful import abort
from uuid import UUID

config = {
    "clientId": os.getenv("GOOGLE_CLIENT_ID"),
    "clientSecret": os.getenv("GOOGLE_CLIENT_SECRET"),
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "redirectUrl": os.getenv("OAUTH_REDIRECT_URI"),
    "clientUrl": os.getenv("CLIENT_URL"),
    "accessToken": os.getenv("ACCESS_TOKEN_SECRET"),
    "refreshToken": os.getenv("REFRESH_TOKEN_SECRET"),
    "tokenExpiration": 36000,
}

UTC = timezone.utc

 
def authenticate(f):
    """Decorator for protecting resources from invalid/missing jwt tokens"""

    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            token = request.headers["Authorization"]
            # remove bearer

            token = token.split(" ")[1]

            if token is None:
                return jsonify({"loggedIn": False}, None), 200
            data = jwt.decode(token, config["accessToken"], algorithms=["HS256"])
            user = User.query.get(UUID(data["uid"]))
            if user is None:
                return abort(500)
            return f(user, *args, **kwargs)

        except Exception as e:
            print(e, flush=True)
            return abort(403)

    return wrapper


def handle_login(user: User):
    access_token = jwt.encode(
        {
            "uid": user.id,
            "exp": datetime.now(UTC) + timedelta(minutes=15),
        },
        config["accessToken"],
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    refresh_token = jwt.encode(
        {
            "uid": user.id,
            "exp": datetime.now(UTC) + timedelta(days=1),
        },
        config["refreshToken"],
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    user.set_refresh_token(refresh_token)
    resp = make_response(access_token, 201)
    resp.set_cookie(
        "refresh-token",
        refresh_token,
        secure=True,
        httponly=True,
        samesite="None",
        expires=datetime.now(UTC) + timedelta(days=1),
    )
    return resp


def handle_refresh_token(refresh_token):
    # try:
    print(refresh_token, flush=True)
    found_user = (
        db.session.query(User)
        .join(OAuthToken, OAuthToken.user_id == User.id)
        .filter(OAuthToken.refresh_token == refresh_token)
        .first()
    )
    print("----FOUND USER!---", found_user, flush=True)
    data = jwt.decode(refresh_token, config["refreshToken"], algorithms="HS256")
    user = User.query.get(UUID(data["uid"]))
    if user.id != found_user.id:
        return make_response(jsonify({"msg": "Unauthorized user"}), 403)
    access_token = jwt.encode(
        {
            "uid": user.id,
            "exp": datetime.now(UTC) + timedelta(minutes=15),
        },
        config["accessToken"],
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    refresh_token = jwt.encode(
        {
            "uid": user.id,
            "exp": datetime.now(UTC) + timedelta(days=1),
        },
        config["refreshToken"],
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    user.set_refresh_token(refresh_token)
    resp = make_response(access_token, 201)
    resp.set_cookie(
        "refresh-token",
        refresh_token,
        secure=True,
        httponly=True,
        samesite="None",
        expires=datetime.now(UTC) + timedelta(days=1),
    )
    return resp
    # except jwt.exceptions.InvalidTokenError as e:
    #     print(repr(e), flush=True)
    #     return make_response(jsonify({"msg": "Invalid token"}), 403)
    # except Exception as e:
    #     print("WARNING NORMAL EXCEPTION CAUGHT")
    #     print(repr(e), flush=True)
        
    #     # NOTE: for some reason if this is a 403, it returns the refresh token as a result, 
    #     # but if it's 500, it doesn't return teh refresh token
    #     return jsonify({"msg": "Unauthorized user"}), 500


def handle_logout(refresh_token):
    if refresh_token is None:
        return jsonify({"msg": "No content"}), 204
    found_user = (
        User.query.join(OAuthToken).filter(User.id == OAuthToken.user_id).first()
    )

    # clear old refresh token
    if not found_user:
        resp = make_response(jsonify({"msg": "No content"}), 204)
        resp.set_cookie(
            "refresh-token", "", secure=True, httponly=True, samesite="None", expires=0
        )
        return resp

    # delete refresh token
    found_user.clear_refresh_token()

    resp = make_response(jsonify({"msg": "No content"}), 204)
    resp.set_cookie(
        "refresh-token", "", secure=True, httponly=True, samesite="None", expires=0
    )
    return resp
