import pytest

from api import db
from api.models.logger import Logger, Logger_User
from api.models.user import User


def make_user(email):
    user = User(first_name="Share", last_name="Test", email=email, password="pw")
    user.api_key = f"key-{email}"
    user.save()
    return user


def auth(user):
    return {"X-API-Key": user.api_key}


@pytest.fixture
def share_setup(init_database):
    owner = make_user("logger-owner@example.com")
    friend = make_user("logger-friend@example.com")
    stranger = make_user("logger-stranger@example.com")
    logger = Logger(name="shared_logger", type="rocketlogger", user_id=owner.id)
    logger.save()
    Logger(name="stranger_logger", type="rocketlogger", user_id=stranger.id).save()

    yield init_database, owner, friend, stranger, logger

    db.session.rollback()
    db.session.query(Logger_User).delete()
    db.session.query(Logger).delete()
    db.session.query(User).filter(User.email.like("logger-%@example.com")).delete(
        synchronize_session=False
    )
    db.session.commit()


def share(client, user, logger_id, body):
    return client.post(f"/api/logger/{logger_id}/share", json=body, headers=auth(user))


def logger_ids_for(client, user):
    response = client.get("/api/logger/?user=True", headers=auth(user))
    assert response.status_code == 200
    return [logger["id"] for logger in response.get_json()]


def test_owner_shares_logger_and_friend_sees_it(share_setup):
    client, owner, friend, _, logger = share_setup
    assert logger_ids_for(client, friend) == []

    response = share(client, owner, logger.id, {"email": friend.email})

    assert response.status_code == 200
    body = response.get_json()
    assert body["message"] == "Logger shared successfully"
    assert body["user"]["email"] == friend.email
    assert logger_ids_for(client, friend) == [logger.id]
    assert logger_ids_for(client, owner) == [logger.id]


def test_shared_user_can_share_further(share_setup):
    client, owner, friend, stranger, logger = share_setup
    share(client, owner, logger.id, {"email": friend.email})

    response = share(client, friend, logger.id, {"email": stranger.email})

    assert response.status_code == 200
    stranger_logger = Logger.find_by_name("stranger_logger")
    assert sorted(logger_ids_for(client, stranger)) == sorted(
        [stranger_logger.id, logger.id]
    )


def test_user_without_access_cannot_share(share_setup):
    client, _, friend, stranger, logger = share_setup

    response = share(client, stranger, logger.id, {"email": friend.email})

    assert response.status_code == 403
    assert response.get_json() == {"message": "You do not have access to this logger"}
    assert logger_ids_for(client, friend) == []


def test_share_requires_authentication(share_setup):
    client, _, friend, _, logger = share_setup

    response = client.post(
        f"/api/logger/{logger.id}/share", json={"email": friend.email}
    )

    assert response.status_code == 401


def test_share_unknown_logger(share_setup):
    client, owner, friend, _, _ = share_setup

    response = share(client, owner, 999999, {"email": friend.email})

    assert response.status_code == 404
    assert response.get_json() == {"message": "Logger not found"}


@pytest.mark.parametrize(
    "body, message",
    [({}, "email is required"), ({"email": ""}, "email cannot be empty")],
)
def test_share_requires_email(share_setup, body, message):
    client, owner, _, _, logger = share_setup

    response = share(client, owner, logger.id, body)

    assert response.status_code == 400
    assert response.get_json() == {"message": message}


def test_share_with_unknown_email(share_setup):
    client, owner, _, _, logger = share_setup

    response = share(client, owner, logger.id, {"email": "nobody@example.com"})

    assert response.status_code == 404
    assert response.get_json() == {
        "message": "User with email nobody@example.com not found"
    }


def test_share_with_user_who_already_has_access(share_setup):
    client, owner, friend, _, logger = share_setup
    share(client, owner, logger.id, {"email": friend.email})

    again = share(client, owner, logger.id, {"email": friend.email})
    with_owner = share(client, owner, logger.id, {"email": owner.email})

    for response in (again, with_owner):
        assert response.status_code == 400
        assert response.get_json() == {
            "message": "User already has access to this logger"
        }


def test_deleting_a_shared_logger_removes_its_shares(share_setup):
    client, owner, friend, _, logger = share_setup
    share(client, owner, logger.id, {"email": friend.email})

    response = client.delete(f"/api/logger/{logger.id}", headers=auth(owner))

    assert response.status_code == 200
    assert db.session.query(Logger_User).count() == 0
    assert logger_ids_for(client, friend) == []
