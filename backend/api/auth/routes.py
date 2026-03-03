import os
from flask import Blueprint, request, jsonify
from ..models.user import User
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
import jwt

from .auth import handle_refresh_token, handle_login, handle_logout
from uuid import UUID
from ..rate_limit import rate_limit

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


def query_string(params):
    return [k + "=" + v for k, v in params.items()]


@auth.route("/auth/token")
@rate_limit("auth_token")
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
        first_name = idinfo["given_name"]
        last_name = idinfo["family_name"]
        user = User.query.filter_by(email=email).first()

        # Add user to DB if new user
        if not user:
            print("creating new user", flush=True)
            user = User(
                first_name=first_name, last_name=last_name, email=email, password=""
            )
            user.save()

        # Handle login
        return handle_login(user)

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
@rate_limit("auth_general")
def auth_url():
    """Returns redirect to Google auth"""
    return jsonify(
        {
            "url": config["authUrl"] + "?" + "&".join(query_string(authParams)),
        }
    )


@auth.route("/auth/logged_in")
@rate_limit("auth_general")
def check_logged_in():
    """Checks if session is active"""
    token = request.headers["Authorization"]
    try:
        token = request.headers["Authorization"]
        if not token:
            return jsonify({"loggedIn": False}, None), 200
        data = jwt.decode(token, config["tokenSecret"], algorithms=["HS256"])
        user = User.query.get(UUID(data["uid"]))
        return jsonify({"loggedIn": True}, user), 200
    except Exception as e:
        print(e, flush=True)
        return jsonify({"loggedIn": False}, None), 401


@auth.route("/auth/logout")
@rate_limit("auth_general")
def logout():
    # """Deletes active tokens"""
    refresh_token = request.cookies.get("refresh-token")
    return handle_logout(refresh_token)


@auth.route("/auth/refresh")
@rate_limit("auth_general")
def refresh():
    refresh_token = request.cookies.get("refresh-token")
    return handle_refresh_token(refresh_token)
