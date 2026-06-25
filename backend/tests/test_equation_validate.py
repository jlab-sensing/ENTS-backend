"""Tests for POST /api/equations/validate."""

import pytest

from api.equation.validate import EquationValidationError, validate_expression


def test_validate_expression_accepts_valid_expr():
    result = validate_expression("1:vwc / 1:temp")
    assert result["ok"] is True
    assert set(result["refs"]) == {"1:vwc", "1:temp"}


def test_validate_expression_rejects_bare_names():
    with pytest.raises(EquationValidationError, match="cell:stream"):
        validate_expression("vwc / temp")


def test_validate_expression_rejects_unknown_stream():
    with pytest.raises(EquationValidationError, match="Unknown sensor stream"):
        validate_expression("1:not_a_stream + 2")


def test_validate_expression_enforces_selected_cells():
    with pytest.raises(EquationValidationError, match="not selected"):
        validate_expression("2:vwc / 2:temp", selected_cell_ids=[1])


def test_equations_validate_endpoint_ok(test_client, init_database):
    response = test_client.post(
        "/api/equations/validate",
        json={"expression": "1:vwc / 1:temp", "cell_ids": [1]},
    )
    assert response.status_code == 200
    payload = response.get_json()
    assert payload["ok"] is True
    assert "1:vwc" in payload["refs"]


def test_equations_validate_endpoint_rejects_invalid(test_client, init_database):
    response = test_client.post(
        "/api/equations/validate",
        json={"expression": "eval(1)", "cell_ids": [1]},
    )
    assert response.status_code == 400
    assert "error" in response.get_json()


def test_equations_validate_endpoint_rejects_unselected_cell(test_client, init_database):
    response = test_client.post(
        "/api/equations/validate",
        json={"expression": "2:vwc / 2:temp", "cell_ids": [1]},
    )
    assert response.status_code == 400
    assert "not selected" in response.get_json()["error"]
