from types import SimpleNamespace
from unittest.mock import Mock

import pytest
import requests
from flask import Flask
from flask_restful import Api

from api.resources import logger_downlink as downlink

LOGGER_ID = 42
VALID_BODY = {"payload": "AQID", "f_port": 1}


@pytest.fixture
def app():
    app = Flask(__name__)
    app.config["TESTING"] = True
    return app


@pytest.fixture
def deps(monkeypatch):
    lookup = Mock(return_value=SimpleNamespace(id=LOGGER_ID, type="ents"))
    send = Mock(return_value=True)
    device = Mock()

    monkeypatch.setattr(downlink.LoggerModel, "get", lookup)
    monkeypatch.setattr(downlink, "EndDevice", device)
    monkeypatch.setattr(
        downlink.LoggerDownlink,
        "ttn_api",
        SimpleNamespace(send_downlink=send),
    )

    return SimpleNamespace(lookup=lookup, send=send, device=device)


def call_post(app, **request_kwargs):
    with app.test_request_context(method="POST", **request_kwargs):
        return downlink.LoggerDownlink().post(
            user=None,
            logger_id=LOGGER_ID,
        )


@pytest.mark.parametrize("logger_type", ["ents", "ENTS", "EnTs"])
@pytest.mark.parametrize("f_port", [1, 223])
def test_valid_downlink_is_queued(app, deps, logger_type, f_port):
    deps.lookup.return_value.type = logger_type
    payload = {**VALID_BODY, "f_port": f_port}

    body, status = call_post(app, json=payload)

    assert status == 202
    assert body == {
        "logger_id": LOGGER_ID,
        "status": "queued",
        "f_port": f_port,
    }
    deps.lookup.assert_called_once_with(LOGGER_ID)
    deps.device.assert_called_once_with({"ids": {"device_id": f"dirtviz-{LOGGER_ID}"}})
    deps.send.assert_called_once_with(
        end_device=deps.device.return_value,
        payload="AQID",
        f_port=f_port,
    )


def test_missing_logger_returns_409(app, deps):
    deps.lookup.return_value = None

    body, status = call_post(app, json=VALID_BODY)

    assert status == 404
    assert body == {"message": "Logger not found"}
    deps.send.assert_not_called()


@pytest.mark.parametrize("logger_type", ["Other", "", None])
def test_unsupported_logger_returns_400(app, deps, logger_type):
    deps.lookup.return_value.type = logger_type

    body, status = call_post(app, json=VALID_BODY)

    assert status == 400
    assert body == {"message": "Logger does not support downlinks"}
    deps.send.assert_not_called()


@pytest.mark.parametrize(
    "content_type, raw_body, expected_status",
    [
        ("text/plain", "hello", 415),
        ("application/json", '{"payload":', 400),  # Malformed JSON
        ("application/json", "[]", 400),
        ("application/json", '"hello"', 400),
        ("application/json", "123", 400),
        ("application/json", "null", 400),
    ],
)
def test_invalid_request_body(app, deps, content_type, raw_body, expected_status):
    body, status = call_post(
        app,
        data=raw_body,
        content_type=content_type,
    )
    assert status == expected_status
    expected_message = (
        "content must be json"
        if expected_status == 415
        else "request body must be JSON object"
    )
    assert body == {"message": expected_message}
    deps.send.assert_not_called()


@pytest.mark.parametrize("field", ["payload", "f_port"])
def test_required_field_missing(app, deps, field):
    payload = VALID_BODY.copy()
    del payload[field]

    body, status = call_post(app, json=payload)
    assert status == 400
    assert field in body["message"]
    deps.send.assert_not_called()


@pytest.mark.parametrize("payload", [None, "", 123, False, [], {}])
def test_payload_must_be_nonempty_string(app, deps, payload):
    body, status = call_post(
        app,
        json={**VALID_BODY, "payload": payload},
    )

    assert status == 400
    assert "payload" in body["message"]
    deps.send.assert_not_called()


@pytest.mark.parametrize(
    "f_port",
    [None, -1, 0, 224, "1", 1.0, True, False, []],
)
def test_invalid_port_returns_400(app, deps, f_port):
    body, status = call_post(
        app,
        json={**VALID_BODY, "f_port": f_port},
    )

    assert status == 400
    assert body == {"message": "f_port must be an int from 1 to 223"}
    deps.send.assert_not_called()


@pytest.mark.parametrize(
    "result, expected_status, expected_message",
    [
        (False, 502, "TTN rejected downlink"),
        (requests.Timeout(), 504, "TTN request timed out"),
        (requests.ConnectionError(), 502, "TTN request failed"),
        (requests.HTTPError(), 502, "TTN request failed"),
    ],
)
def test_ttn_failure_response(app, deps, result, expected_status, expected_message):
    if isinstance(result, Exception):
        deps.send.side_effect = result
    else:
        deps.send.return_value = result

    body, status = call_post(app, json=VALID_BODY)
    assert status == expected_status
    assert body == {"message": expected_message}
    deps.send.assert_called_once()


def test_route_requires_authentication(app, deps):
    Api(app).add_resource(
        downlink.LoggerDownlink,
        "/api/logger/<int:logger_id>/downlink",
    )
    response = app.test_client().post(
        f"/api/logger/{LOGGER_ID}/downlink",
        json=VALID_BODY,
    )

    assert response.status_code == 401
    assert response.get_json() == {"msg": "No token or API key provided"}
    deps.lookup.assert_not_called()
    deps.send.assert_not_called()
