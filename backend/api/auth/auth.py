# const usersDB = {
#     users: require('../model/users.json'),
#     setUsers: function (data) { this.users = data }
# }
# const bcrypt = require('bcrypt');

# const jwt = require('jsonwebtoken');
# require('dotenv').config();
# const fsPromises = require('fs').promises;
# const path = require('path');

# const handleLogin = async (req, res) => {
#     const { user, pwd } = req.body;
#     if (!user || !pwd) return res.status(400).json({ 'message': 'Username and password are required.' });
#     const foundUser = usersDB.users.find(person => person.username === user);
#     if (!foundUser) return res.sendStatus(401); //Unauthorized
#     // evaluate password
#     const match = await bcrypt.compare(pwd, foundUser.password);
#     if (match) {
#         // create JWTs
#         const accessToken = jwt.sign(
#             { "username": foundUser.username },
#             process.env.ACCESS_TOKEN_SECRET,
#             { expiresIn: '30s' }
#         );
#         const refreshToken = jwt.sign(
#             { "username": foundUser.username },
#             process.env.REFRESH_TOKEN_SECRET,
#             { expiresIn: '1d' }
#         );
#         // Saving refreshToken with current user
#         const otherUsers = usersDB.users.filter(person => person.username !== foundUser.username);
#         const currentUser = { ...foundUser, refreshToken };
#         usersDB.setUsers([...otherUsers, currentUser]);
#         await fsPromises.writeFile(
#             path.join(__dirname, '..', 'model', 'users.json'),
#             JSON.stringify(usersDB.users)
#         );
#         res.cookie('jwt', refreshToken, { httpOnly: true, sameSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });
#         res.json({ accessToken });
#     } else {
#         res.sendStatus(401);
#     }
# }

# module.exports = { handleLogin };

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
    )
    refresh_token = jwt.endcode(
        {
            "uid": user.id,
            "exp": datetime.utcnow() + timedelta(days=1),
        },
        config["refreshToken"],
        algorithm="HS256",
    )
    oauth_token = OAuthToken(
        user_id=user.id, access_token=access_token, refresh_token=refresh_token
    )
    oauth_token.save()
    resp = make_response(access_token, 201)
    resp.set_cookie("token", refresh_token)
    return resp


# const handleRefreshToken = (req, res) => {
#     const cookies = req.cookies;
#     if (!cookies?.jwt) return res.sendStatus(401);
#     const refreshToken = cookies.jwt;


#     const foundUser = usersDB.users.find(person => person.refreshToken === refreshToken);
#     if (!foundUser) return res.sendStatus(403); //Forbidden
#     // evaluate jwt
#     jwt.verify(
#         refreshToken,
#         process.env.REFRESH_TOKEN_SECRET,
#         (err, decoded) => {
#             if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
#             const accessToken = jwt.sign(
#                 { "username": decoded.username },
#                 process.env.ACCESS_TOKEN_SECRET,
#                 { expiresIn: '30s' }
#             );
#             res.json({ accessToken })
#         }


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
