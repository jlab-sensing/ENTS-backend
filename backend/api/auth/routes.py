import time
import os
from flask import Blueprint, request, session, url_for, Response, redirect
from flask import render_template, redirect, jsonify
from werkzeug.security import gen_salt
from authlib.integrations.flask_oauth2 import current_token
from authlib.oauth2 import OAuth2Error
from authlib.integrations.flask_client import OAuth

# from .database.models.oauth import OAuth2Client
# from.database.models import db
from ...api import db
from ...api import oauth

# from ..api import db
from ..database.models.user import User

# from .oauth2 import config_oauth
# from .oauth2 import authorization, require_oauth
import requests
from google.oauth2 import id_token
from google.auth.transport import requests as g_requests
from functools import wraps
import jwt


bp = Blueprint("login", __name__)

# oauth = OAuth()
google = oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    clientSecret=os.getenv("GOOGLE_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid email profile",
        "state": "standard_oauth",
    },
    userinfo_endpoint="https://openidconnect.googleapis.com/v1/userinfo",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
)

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


# @bp.route("/auth/session")
# def auth(next):


@bp.route("/login")
def login():
    google = oauth.create_client("google")
    redirect_uri = url_for("login.get_token", _external=True)
    return google.authorize_redirect(redirect_uri)


@bp.route("/auth/token")
def get_token():
    code = request.args.get("code")
    # print(request.session)
    if not code:
        return jsonify({"msg": "Authorization code must be provided"}), 400
    # try:
    #  // Get all parameters needed to hit authorization server
    # const tokenParam = getTokenParams(code);
    # // Exchange authorization code for access token (id token is returned here too)
    # const { data: { id_token} } = await axios.post(`${config.tokenUrl}?${tokenParam}`);
    # if (!id_token) return res.status(400).json({ message: 'Auth error' });
    # // Get user info from id token
    # const { email, name, picture } = jwt.decode(id_token);
    # const user = { name, email, picture };
    # // Sign a new token
    # const token = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });
    # // Set cookies for user
    # res.cookie('token', token, { maxAge: config.tokenExpiration, httpOnly: true,  })
    # // You can choose to store user in a DB instead
    # res.json({
    #   user,
    # })
    tokenParams["code"] = code

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
        # req = requests.post(
        #     url=config["tokenUrl"] + "?" + "&".join(query_string(tokenParams)),
        #     # params={
        #     #     "client_id": config["clientId"],
        #     #     "client_secret": config["clientSecret"],
        #     #     "code": code,
        #     #     "grant_type": "authorization_code",
        #     #     "redirect_uri": config["redirectUrl"],
        #     # },
        # )
        print("response: ", req, flush=True)
        print("data: ", req.json(), flush=True)
        if req == None:
            return jsonify({"msg": "Auth error"}), 500
        token = req.json()["id_token"]

        # Specify the CLIENT_ID of the app that accesses the backend:
        idinfo = id_token.verify_oauth2_token(
            token, g_requests.Request(), config["clientId"]
        )
        userid = idinfo["sub"]
        # token = jwt.sign(
        #     {user}, config.tokenSecret, {"expiresIn": config.tokenExpiration}
        # )
        print(idinfo["email"], flush=True)
        email = idinfo["email"]
        user = db.session.query(User).filter_by(email=email).first()
        print("found", user, flush=True)

        # // Exchange authorization code for access token (id token is returned here too)
        # const { data: { id_token} } = await axios.post(`${config.tokenUrl}?${tokenParam}`);
        # if (!id_token) return res.status(400).json({ message: 'Auth error' });
        # // Get user info from id token
        # const { email, name, picture } = jwt.decode(id_token);
        # const user = { name, email, picture };
        # // Sign a new token
        # const token = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });
        # // Set cookies for user
        # res.cookie('token', token, { maxAge: config.tokenExpiration, httpOnly: true,  })

        if not user:
            print("creating new user", flush=True)
            user = User(email=email, password="")
            db.session.add(user)
            db.session.commit()
        session["id"] = user.id
        return jsonify({"msg": "Logged in"}), 200

        # add user to data base!!!!!
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

    # print(
    #     requests.post(
    #         url=config["tokenUrl"] + "?" + "&".join(query_string(tokenParams)),
    #         params={
    #             "client_id": config["clientId"],
    #             "client_secret": config["clientSecret"],
    #             "code": code,
    #             "grant_type": "authorization_code",
    #             "redirect_uri": config["redirectUrl"],
    #         },
    #     )
    # )

    # email, name, picture = jwt.decode(
    #     id_token, config["tokenSecret"], algorithms=["HS256"]
    # )

    # res.cookie('token', token, { maxAge: config.tokenExpiration, httpOnly: true,  })
    # google = oauth.create_client("google")
    # token =
    # user = google.userinfo(token=token)
    # # token = google.authorize_access_token()
    # print(token, flush=True)
    # email = token["email"]
    email = "t"
    username = "sfd"
    # user = User.query.filter_by(email=email).first()
    # if not user:
    #     user = User(email=email)
    #     db.session.add(user)
    #     db.session.commit()
    # session["id"] = user.id

    # except Exception as e:
    #     print("Error", e, flush=True)
    #     return jsonify({"msg": "Server Error"}), 500


# app.get('/auth/logged_in', (req, res) => {
#   try {
#     // Get token from cookie
#     const token = req.cookies.token;
#     if (!token) return res.json({ loggedIn: false });
#     const { user } = jwt.verify(token, config.tokenSecret);
#     const newToken = jwt.sign({ user }, config.tokenSecret, { expiresIn: config.tokenExpiration });
#     // Reset token in cookie
#     res.cookie('token', newToken, { maxAge: config.tokenExpiration, httpOnly: true,  })
#     res.json({ loggedIn: true, user });
#   } catch (err) {
#     res.json({ loggedIn: false });
#   }
# })
@bp.route("/auth/logged_in")
def check_logged_in():
    try:
        user = current_user()
        if not user:
            return jsonify({"loggedIn": False}), 200
        session["id"] = user.id
        print(user, flush=True)
        return jsonify({"loggedIn": True}, user), 200
    except Exception as e:
        print(e)
        return jsonify({"loggedIn": False}), 500


# @bp.route("/authorize")
# def authorize():
#     token = oauth.google.authorize_access_token()
#     print(token, flush=True)
#     email = token["email"]
#     username = "sfd"
#     user = User.query.filter_by(email=email).first()
#     if not user:
#         user = User(email=email)
#         db.session.add(user)
#         db.session.commit()
#     session["user"] = token["userinfo"]
#     # do something with the token and profile
#     return redirect(authParams["redirect_uri"])


# @bp.route("/login", methods=("GET", "POST"))
# def login():
#     if request.method == "POST":
#         username = request.args.get("username")
#         user = User.query.filter_by(username=username).first()
#         if not user:
#             user = User(username=username)
#             db.session.add(user)
#             db.session.commit()
#         session["id"] = user.id
#         # # if user is not just to log in, but need to head back to the auth page, then go for it
#         # next_page = request.args.get("next")
#         # if next_page:
#         #     return redirect(next_page)
#         # return redirect("/login")
#     user = current_user()
#     return


@bp.route("/logout")
def logout():
    del session["id"]
    return redirect("/")


@bp.route("/create_client", methods=("GET", "POST"))
def create_client():
    user = current_user()
    if not user:
        return redirect("/")
    if request.method == "GET":
        return render_template("create_client.html")

    client_id = gen_salt(24)
    client_id_issued_at = int(time.time())
    client = OAuth2Client(
        client_id=client_id,
        client_id_issued_at=client_id_issued_at,
        user_id=user.id,
    )

    form = request.form
    client_metadata = {
        "client_name": form["client_name"],
        "client_uri": form["client_uri"],
        "grant_types": split_by_crlf(form["grant_type"]),
        "redirect_uris": split_by_crlf(form["redirect_uri"]),
        "response_types": split_by_crlf(form["response_type"]),
        "scope": form["scope"],
        "token_endpoint_auth_method": form["token_endpoint_auth_method"],
    }
    client.set_client_metadata(client_metadata)

    if form["token_endpoint_auth_method"] == "none":
        client.client_secret = ""
    else:
        client.client_secret = gen_salt(48)

    db.session.add(client)
    db.session.commit()
    return redirect("/login")


# @bp.route("/oauth/authorize", methods=["GET", "POST"])
# def authorize():
#     user = current_user()
#     # if user log status is not true (Auth server), then to log it in
#     if not user:
#         return jsonify({"logged_in": False})
#     if request.method == "GET":
#         try:
#             grant = authorization.get_consent_grant(end_user=user)
#         except OAuth2Error as error:
#             return error.error
#         return jsonify({"logged_in": True, "user": user, "grant": grant})
#     if not user and "username" in request.form:
#         username = request.form.get("username")
#         user = User.query.filter_by(username=username).first()
#     if request.form["confirm"]:
#         grant_user = user
#     else:
#         grant_user = None
#     return authorization.create_authorization_response(grant_user=grant_user)


# @bp.route("/oauth/token", methods=["POST"])
# def issue_token():
#     print("args", request.args, flush=True)
#     return authorization.create_token_response()


# @bp.route("/oauth/revoke", methods=["POST"])
# def revoke_token():
#     return authorization.create_endpoint_response("revocation")


@bp.route("/oauth/url", methods=["GET"])
def auth_url():
    # return authorization.create_endpoint_response("revocation")
    # print(authParams.items(), flush=True)
    # redirect_uri = url_for("login", _external=True)
    # oauth.google.authorize_redirect(redirect_uri)
    # username = request.form.get("username")
    # user = User.query.filter_by(username=username).first()
    # if not user:
    #     user = User(username=username)
    #     db.session.add(user)
    #     db.session.commit()
    # session["id"] = user.id
    # redirect_uri = url_for("login.authorize", _external=True)
    # google = oauth.create_client("google")
    # return jsonify({"url": google.authorize_redirect(REDIRECT_URI)})
    return jsonify(
        {
            "url": config["authUrl"] + "?" + "&".join(query_string(authParams)),
        }
    )


# @bp.route("/auth/logged_in", methods=["GET"])
# def logged_in():
#     # return authorization.create_endpoint_response("revocation")
#     return jsonify(
#         {
#             "url": config.authUrl + "?" + authParams,
#         }
#     )


# @bp.route("/api/me")
# @require_oauth("profile")
# def api_me():
#     user = current_token.user
#     return jsonify(id=user.id, username=user.username)
