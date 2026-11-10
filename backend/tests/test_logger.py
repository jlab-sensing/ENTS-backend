import types

import pytest
from flask import Flask
from sqlalchemy.exc import IntegrityError

from api.resources.logger import Logger as LoggerResource


class StubLogger:
    def __init__(self, logger_id=123):
        self.id = logger_id
        self.deleted = False

    def delete(self):
        self.deleted = True


def _base_payload():
    return {
        "name": "test-logger",
        "type": "ents",
        "description": "desc",
        "userEmail": "test@example.com",
    }


def _setup_common(monkeypatch, stub_logger):
    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.find_by_name",
        lambda *_args, **_kwargs: None,
    )
    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.add_logger_by_user_email",
        lambda *_args, **_kwargs: stub_logger,
    )


def _make_test_app():
    app = Flask(__name__)
    app.config["TESTING"] = True
    return app


def test_ents_missing_lorawan_creates_logger_and_skips_ttn(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)

    payload = _base_payload()
    payload["device_eui"] = "0080E1150546D093"

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = LoggerResource().post(None)

    assert status == 201
    assert body["ttn_registered"] is False
    assert body["logger_id"] == stub_logger.id
    assert stub_logger.deleted is False


def test_ents_invalid_lorawan_creates_logger_and_skips_ttn(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)

    payload = _base_payload()
    payload.update(
        {
            "device_eui": "INVALID",
            "dev_eui": "ZZZZ",
        }
    )

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = LoggerResource().post(None)

    assert status == 201
    assert body["ttn_registered"] is False
    assert body["logger_id"] == stub_logger.id
    assert stub_logger.deleted is False


def test_ents_valid_lorawan_registers_with_ttn(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)
    monkeypatch.setenv("TTN_JOIN_EUI", "0101010101010101")
    monkeypatch.setenv("TTN_APP_KEY", "CEC24E6A258B2B20A5A7C05ABD2C1724")

    payload = _base_payload()
    payload.update(
        {
            "device_eui": "0080E1150546D093",
            "dev_eui": "0080E1150546D093",
        }
    )

    registered = []
    resource = LoggerResource()
    resource.ttn_api = types.SimpleNamespace(
        register_end_device=lambda ed: registered.append(ed) or {"ok": True}
    )

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = resource.post(None)

    assert status == 201
    assert body["ttn_registered"] is True
    assert body["logger_id"] == stub_logger.id
    assert stub_logger.deleted is False
    assert registered[0].data["ids"]["join_eui"] == "0101010101010101"
    assert (
        registered[0].data["root_keys"]["app_key"]["key"]
        == "CEC24E6A258B2B20A5A7C05ABD2C1724"
    )


def test_ents_skips_ttn_when_keys_missing_from_env(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)
    monkeypatch.delenv("TTN_JOIN_EUI", raising=False)
    monkeypatch.delenv("TTN_APP_KEY", raising=False)

    payload = _base_payload()
    payload.update(
        {
            "device_eui": "0080E1150546D093",
            "dev_eui": "0080E1150546D093",
            "join_eui": "0101010101010101",
            "app_key": "CEC24E6A258B2B20A5A7C05ABD2C1724",
        }
    )

    resource = LoggerResource()
    resource.ttn_api = types.SimpleNamespace(
        register_end_device=lambda _ed: {"ok": True}
    )

    app = _make_test_app()
    with app.test_request_context(json=payload):
        with pytest.warns(UserWarning, match="TTN_JOIN_EUI or TTN_APP_KEY"):
            body, status = resource.post(None)

    assert status == 201
    assert body["ttn_registered"] is False
    assert stub_logger.deleted is False


def test_device_eui_is_normalized_before_create(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)

    captured = {}

    def _add_logger(name, type_val, device_eui, description, user_email):
        captured["name"] = name
        captured["type"] = type_val
        captured["device_eui"] = device_eui
        captured["description"] = description
        captured["user_email"] = user_email
        return stub_logger

    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.add_logger_by_user_email",
        _add_logger,
    )

    payload = _base_payload()
    payload["device_eui"] = " 0080e1150546d093 "

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = LoggerResource().post(None)

    assert status == 201
    assert body["logger_id"] == stub_logger.id
    assert captured["device_eui"] == "0080E1150546D093"


def test_integrity_error_duplicate_name_returns_400(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)
    lookup_calls = {"name": 0}

    monkeypatch.setattr("api.resources.logger.db.session.rollback", lambda: None)

    def _find_by_name(*_args, **_kwargs):
        lookup_calls["name"] += 1
        if lookup_calls["name"] == 1:
            return None
        return object()

    monkeypatch.setattr("api.resources.logger.LoggerModel.find_by_name", _find_by_name)
    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.find_by_device_eui",
        lambda *_args, **_kwargs: None,
    )

    def _raise_integrity(*_args, **_kwargs):
        raise IntegrityError("insert", {}, Exception("duplicate key"))

    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.add_logger_by_user_email",
        _raise_integrity,
    )

    payload = _base_payload()
    payload["device_eui"] = "0080E1150546D093"

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = LoggerResource().post(None)

    assert status == 400
    assert body["message"] == "Duplicate logger name"
