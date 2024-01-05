import os
from flask import Blueprint, request, session, redirect
from flask import redirect, jsonify
from ...api import db
from ..database.models.user import User
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
from functools import wraps


bp = Blueprint("login", __name__)


config = {
    "clientId": os.getenv("GOOGLE_CLIENT_ID"),
    "clientSecret": os.getenv("GOOGLE_CLIENT_SECRET"),
    "authUrl": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenUrl": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "redirectUrl": os.getenv("OAUTH_REDIRECT_URI"),
    "clientUrl": os.getenv("CLIENT_URL"),
    "tokenSecret": os.getenv("TOKEN_SECRET"),
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


def current_user():
    if "id" in session:
        uid = session["id"]
        return User.query.get(uid)
    return None


def query_string(params):
    print("query", params, flush=True)
    return [k + "=" + v for k, v in params.items()]


def split_by_crlf(s):
    return [v for v in s.splitlines() if v]


def logged_in():
    def decorator(func):
        @wraps(func)
        def authorize(*args, **kwargs):
            if current_user() == None:
                return jsonify({"msg": "Unauthorized"}), 401
            return func(*args, **kwargs)

        return authorize

    return decorator


# TODO: add user roles to protect routes
# @logged_in()
# def role_required(role_name):
#     def decorator(func):
#         @wraps(func)
#         def authorize(*args, **kwargs):
#             if not current_user()["role"]:
#                 return jsonify({"msg": "Unauthorized"}), 401
#             elif current_user()["role"] != role_name:
#                 return jsonify({"msg": "Unauthorized"}), 401
#             return func(*args, **kwargs)

#         return authorize

#     return decorator


@bp.route("/auth/token")
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
        print("response: ", req, flush=True)
        print("data: ", req.json(), flush=True)
        if req == None:
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
        session["id"] = user.id
        return jsonify({"msg": "Logged in"}), 200

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


@bp.route("/oauth/url", methods=["GET"])
def auth_url():
    """Returns redirect to Google auth"""
    return jsonify(
        {
            "url": config["authUrl"] + "?" + "&".join(query_string(authParams)),
        }
    )


@bp.route("/auth/logged_in")
def check_logged_in():
    """Checks if session is active"""
    try:
        user = current_user()
        if not user:
            return jsonify({"loggedIn": False}, None), 200
        session["id"] = user.id
        print(user, flush=True)
        return jsonify({"loggedIn": True}, user), 200
    except Exception as e:
        print(e)
        return jsonify({"loggedIn": False}, None), 500


@bp.route("/logout")
def logout():
    """Deletes active session"""
    del session["id"]
    return redirect("/")
