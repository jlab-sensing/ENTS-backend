from api.models.user import User
from api.models.oauth_token import OAuthToken


def test_set_token(init_database):
    """
    GIVEN an access token and refresh_token
    WHEN a user doesn't have an either token
    THEN it should create an new OauthToken entity with the given tokens
    thats tied by the user's id
    """
    new_user = User(
        first_name="Aaron", last_name="Wu", email="example@email.com", password=""
    )
    new_user.save()
    user = User.query.filter_by(email="example@email.com").first()
    assert user.first_name == "Aaron"
    assert user.last_name == "Wu"
    user.set_token("random123", "random234")
    oauth = OAuthToken.query.filter(OAuthToken.user_id == user.id).first()
    assert oauth.access_token == "random123"
    assert oauth.refresh_token == "random234"
