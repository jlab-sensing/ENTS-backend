import os
import types

from flask import Flask

os.environ.setdefault("TTN_API_KEY", "test-key")
os.environ.setdefault("TTN_APP_ID", "test-app")

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
    resource.ttn_api = types.SimpleNamespace(register_end_device=lambda _ed: {"ok": True})

    app = _make_test_app()
    with app.test_request_context(json=payload):
        body, status = resource.post(None)

    assert status == 201
    assert body["ttn_registered"] is True
    assert body["logger_id"] == stub_logger.id
    assert stub_logger.deleted is False
