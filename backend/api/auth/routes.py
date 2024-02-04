import os
from flask import Blueprint, request, session, redirect, jsonify, make_response
from ...api import db
from ..database.models.user import User
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
from functools import wraps
from datetime import datetime, timedelta
import jwt

from .auth import handle_refresh_token, handle_login, handle_logout
from uuid import UUID

auth = Blueprint("login", __name__)


config = {
    "clientId": os.getenv("GOOGLE_CLIENT_ID"),
    "clientSecret": os.getenv("GOOGLE_CLIENT_SECRET"),
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "redirectUrl": os.getenv("OAUTH_REDIRECT_URI"),
    "clientUrl": os.getenv("CLIENT_URL"),
    "accessToken": os.getenv("ACCESS_TOKEN_SECRET"),
    "tokenExpiration": 36000,
}


authParams = {
    "client_id": os.getenv("GOOGLE_CLIENT_ID"),
    "redirect_uri": os.getenv("OAUTH_REDIRECT_URI"),
    "response_type": "code",
    "scope": "openid email profile",
    "access_type": "offline",
    "state": "standard_oauth",
    "prompt": "consent",
}


tokenParams = {
    "client_id": config["clientId"],
    "client_secret": config["clientSecret"],
    "grant_type": "authorization_code",
    "redirect_uri": config["redirectUrl"],
}
REDIRECT_URI = os.getenv("OAUTH_REDIRECT_URI")


# def token_required(f):
#     """Decorator for protecting resources from invalid/missing jwt tokens"""

#     @wraps(f)
#     def decorated(*args, **kwargs):
#         try:
#             token = request.cookies.get("token")
#             if not token:
#                 return jsonify({"msg": "Unauthorized"}), 401
#             data = jwt.decode(token, config["tokenSecret"], algorithms=["HS256"])
#             current_user = User.query.get(data["uid"])
#             return f(current_user, *args, **kwargs)
#         except Exception as e:
#             print(e)
#             return jsonify({"msg": "Unauthorized"}), 401

#     return decorated


def current_user():
    if "id" in session:
        uid = session["id"]
        return User.query.get(uid)
    return None


def query_string(params):
    return [k + "=" + v for k, v in params.items()]


def split_by_crlf(s):
    return [v for v in s.splitlines() if v]


def logged_in():
    def decorator(func):
        @wraps(func)
        def authorize(*args, **kwargs):
            if current_user() is None:
                return jsonify({"msg": "Unauthorized"}), 401
            return func(*args, **kwargs)

        return authorize

    return decorator


@auth.route("/auth/token")
def get_token():
    """Trades in authorization code for access token from Google auth"""
    code = request.args.get("code")
    if not code:
        return jsonify({"msg": "Authorization code must be provided"}), 400
    tokenParams["code"] = code

    # Request to Google for user data
    try:
        req = requests.post(
            url=config["tokenUrl"],
            params={
                "client_id": config["clientId"],
                "client_secret": config["clientSecret"],
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": config["redirectUrl"],
            },
        )
        if req is None:
            return jsonify({"msg": "Auth error"}), 500
        token = req.json()["id_token"]

        # Specify the CLIENT_ID of the app that requests data
        idinfo = id_token.verify_oauth2_token(
            token, g_requests.Request(), config["clientId"]
        )
        email = idinfo["email"]
        user = db.session.query(User).filter_by(email=email).first()

        # Add user to DB if new user
        if not user:
            print("creating new user", flush=True)
            user = User(email=email, password="")
            db.session.add(user)
            db.session.commit()

        # Handle login
        return handle_login(user)

        # jwt_token = jwt.encode(
        #     {
        #         "uid": user.id,
        #         "exp": datetime.utcnow() + timedelta(seconds=5),
        #     },
        #     config["tokenSecret"],
        #     algorithm="HS256",
        # )
        # session["id"] = user.id
        # resp = make_response("Logged In", 201)
        # resp.set_cookie("token", jwt_token)

    except ValueError:
        return jsonify({"msg": "Authentication Error"}), 500
    except requests.exceptions.ConnectionError as errc:
        return jsonify({"error": "Connection Error"}, errc), 500
    except requests.exceptions.HTTPError as errh:
        return jsonify({"Http Error:", errh}), 500
    except requests.exceptions.Timeout as errt:
        return jsonify({"Timeout Error:", errt}), 500
    except requests.exceptions.RequestException as err:
        return jsonify({"Other error:", err}), 500


@auth.route("/oauth/url", methods=["GET"])
def auth_url():
    """Returns redirect to Google auth"""
    return jsonify(
        {
            "url": config["authUrl"] + "?" + "&".join(query_string(authParams)),
        }
    )


@auth.route("/auth/logged_in")
def check_logged_in():
    """Checks if session is active"""
    token = request.headers["Authorization"]
    print("loggedin", token, flush=True)
    try:
        token = request.headers["Authorization"]
        print("loggedin", token, flush=True)
        if not token:
            return jsonify({"loggedIn": False}, None), 200
        data = jwt.decode(token, config["tokenSecret"], algorithms=["HS256"])
        user = User.query.get(UUID(data["uid"]))
        return jsonify({"loggedIn": True}, user), 200
    except Exception as e:
        print(e, flush=True)
        return jsonify({"loggedIn": False}, None), 401
    # old cookie based approach
    # try:
    #     token = request.cookies.get("token")
    #     if not token:
    #         return jsonify({"loggedIn": False}, None), 200
    #     data = jwt.decode(token, config["tokenSecret"], algorithms=["HS256"])
    #     user = User.query.get(data["uid"])
    #     return jsonify({"loggedIn": True}, user), 200
    # except Exception as e:
    #     print(e, flush=True)
    #     return jsonify({"loggedIn": False}, None), 401

    # try:
    #     user = current_user()
    #     if not user:
    #         return jsonify({"loggedIn": False}, None), 200
    #     session["id"] = user.id
    #     print(user, flush=True)
    #     return jsonify({"loggedIn": True}, user), 200
    # except Exception as e:
    #     print(e)
    #     return jsonify({"loggedIn": False}, None), 500


@auth.route("/logout")
def logout():
    """Deletes active session"""
    del session["id"]
    return redirect("/")


@auth.route("/auth/refresh")
def refresh():
    refresh_token = request.cookies.get("refresh-token")
    return handle_refresh_token(refresh_token)
