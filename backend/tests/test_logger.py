import types

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
        "api.resources.logger.LoggerModel.find_by_device_eui",
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
            "join_eui": "short",
            "app_key": "bad",
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
        body, status = resource.post(None)

    assert status == 201
    assert body["ttn_registered"] is True
    assert body["logger_id"] == stub_logger.id
    assert stub_logger.deleted is False


def test_duplicate_device_eui_returns_400(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)

    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.find_by_device_eui",
        lambda *_args, **_kwargs: object(),
    )

    add_called = {"value": False}

    def _add_logger(*_args, **_kwargs):
        add_called["value"] = True
        return stub_logger

    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.add_logger_by_user_email",
        _add_logger,
    )

    payload = _base_payload()
    payload["device_eui"] = "0080E1150546D093"

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = LoggerResource().post(None)

    assert status == 400
    assert body["message"] == "There already exists a logger id with that device id."
    assert add_called["value"] is False


def test_duplicate_device_eui_check_is_case_insensitive(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)

    seen = {}

    def _find_by_device_eui(device_eui):
        seen["value"] = device_eui
        return object()

    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.find_by_device_eui",
        _find_by_device_eui,
    )

    payload = _base_payload()
    payload["device_eui"] = "0080e1150546d093"

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = LoggerResource().post(None)

    assert status == 400
    assert body["message"] == "There already exists a logger id with that device id."
    assert seen["value"] == "0080E1150546D093"


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


def test_integrity_error_duplicate_device_eui_returns_400(monkeypatch):
    stub_logger = StubLogger()
    _setup_common(monkeypatch, stub_logger)

    rollback_called = {"value": False}
    lookup_calls = {"device_eui": 0}

    def _rollback():
        rollback_called["value"] = True

    monkeypatch.setattr("api.resources.logger.db.session.rollback", _rollback)
    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.find_by_name",
        lambda *_args, **_kwargs: None,
    )

    def _find_by_device_eui(*_args, **_kwargs):
        lookup_calls["device_eui"] += 1
        if lookup_calls["device_eui"] == 1:
            return None
        return object()

    monkeypatch.setattr(
        "api.resources.logger.LoggerModel.find_by_device_eui",
        _find_by_device_eui,
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
    assert body["message"] == "There already exists a logger id with that device id."
    assert rollback_called["value"] is True


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
