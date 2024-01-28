import os
from flask import Blueprint, request, session, redirect, jsonify, make_response
from ...api import db
from ..database.models.user import User
from ..database.models.oauth_token import OAuthToken
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
from functools import wraps
from datetime import datetime, timedelta
import jwt
from .uuid_json_encoder import UUIDSerializer

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


def handle_login(user: User):
    access_token = jwt.encode(
        {
            "uid": user.id,
            "exp": datetime.utcnow() + timedelta(seconds=60),
        },
        config["accessToken"],
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    refresh_token = jwt.encode(
        {
            "uid": user.id,
            "exp": datetime.utcnow() + timedelta(days=1),
        },
        config["refreshToken"],
        algorithm="HS256",
        json_encoder=UUIDSerializer,
    )
    oauth_token = OAuthToken(
        user_id=user.id, access_token=access_token, refresh_token=refresh_token
    )
    oauth_token.save()
    resp = make_response(access_token, 201)
    resp.set_cookie("jwt", refresh_token)
    print("reponse", flush=True)
    print(resp, flush=True)
    return resp


def handle_refresh_token(refresh_token):
    found_user = (
        db.session.query(User)
        .join(OAuthToken, OAuthToken.user_id == User.id)
        .filter(OAuthToken.refresh_token == refresh_token)
    )
    try:
        data = jwt.decode(refresh_token, config["tokenSecret"], algorithms="HS256")
        user = User.query.get(data["uid"])
        if user.id != found_user.id:
            return make_response(jsonify({"msg": "Unauthorized user"}), 403)
        access_token = jwt.encode(
            {
                "uid": user.id,
                "exp": datetime.utcnow() + timedelta(seconds=60),
            },
            config["accessToken"],
            algorithm="HS256",
        )
        resp = make_response(access_token, 201)
        return resp
    except jwt.exceptions.InvalidTokenError as e:
        print(repr(e))
        return make_response(jsonify({"msg": "Invalid token"}), 403)
    except Exception as e:
        print("WARNING NORMAL EXCEPTION CAUGHT")
        print(repr(e))
        return jsonify({"msg": "Unauthorized user"}), 403
