"""Allow-listed equation expression validation (mirrors frontend equationParser.js)."""

from __future__ import annotations

import re
from typing import Any

MAX_EXPRESSION_LENGTH = 500
MAX_STREAM_REFS = 10

# Mirrors frontend EQUATION_STREAMS keys (case-insensitive lookup).
EQUATION_STREAMS: dict[str, dict[str, str]] = {
    "vwc": {"source": "teros", "field": "vwc"},
    "temp": {"source": "teros", "field": "temp"},
    "ec": {"source": "teros", "field": "ec"},
    "voltage": {"source": "power", "field": "v"},
    "v": {"source": "power", "field": "v"},
    "current": {"source": "power", "field": "i"},
    "i": {"source": "power", "field": "i"},
    "power": {"source": "power", "field": "p"},
    "p": {"source": "power", "field": "p"},
    "co2": {"source": "sensor", "sensor_name": "co2", "measurement": "co2"},
    "bme280": {
        "source": "sensor",
        "sensor_name": "bme280",
        "measurement": "pressure",
    },
    "pressure": {
        "source": "sensor",
        "sensor_name": "bme280",
        "measurement": "pressure",
    },
    "humidity": {
        "source": "sensor",
        "sensor_name": "bme280",
        "measurement": "humidity",
    },
    "temperature": {
        "source": "sensor",
        "sensor_name": "bme280",
        "measurement": "temperature",
    },
    "soil_water_potential": {
        "source": "sensor",
        "sensor_name": "teros21",
        "measurement": "soil_water_potential",
    },
    "teros21": {
        "source": "sensor",
        "sensor_name": "teros21",
        "measurement": "soil_water_potential",
    },
    "flow": {"source": "sensor", "sensor_name": "yfs210c", "measurement": "flow"},
    "yfs210c": {"source": "sensor", "sensor_name": "yfs210c", "measurement": "flow"},
}

STREAM_REF_RE = re.compile(r"^(\d+):([a-zA-Z][a-zA-Z0-9_]*)$")


class EquationValidationError(ValueError):
    """Raised when an expression fails validation."""


def resolve_stream_spec(stream_key: str) -> dict[str, str] | None:
    if not stream_key:
        return None
    return EQUATION_STREAMS.get(stream_key.lower())


def _tokenize(input_text: str) -> list[dict[str, Any]]:
    tokens: list[dict[str, Any]] = []
    i = 0
    length = len(input_text)

    while i < length:
        ch = input_text[i]
        if ch.isspace():
            i += 1
            continue

        if ch.isdigit():
            cell_match = re.match(r"^(\d+):([a-zA-Z][a-zA-Z0-9_]*)", input_text[i:])
            if cell_match:
                ref = f"{cell_match.group(1)}:{cell_match.group(2)}"
                if resolve_stream_spec(cell_match.group(2)) is None:
                    raise EquationValidationError(
                        f'Unknown sensor stream "{cell_match.group(2)}"'
                    )
                tokens.append({"type": "stream", "ref": ref})
                i += len(ref)
                continue

            j = i
            while j < length and (input_text[j].isdigit() or input_text[j] == "."):
                j += 1
            num = input_text[i:j]
            try:
                value = float(num)
            except ValueError as exc:
                raise EquationValidationError(f'Invalid number "{num}"') from exc
            if value != value:  # NaN
                raise EquationValidationError(f'Invalid number "{num}"')
            tokens.append({"type": "number", "value": value})
            i = j
            continue

        if ch.isalpha():
            raise EquationValidationError(
                "Use cell:stream tokens like 1:vwc (not bare names)"
            )

        if ch in "()":
            tokens.append({"type": ch})
            i += 1
            continue

        if ch in "+-*/^":
            tokens.append({"type": "operator", "value": ch})
            i += 1
            continue

        raise EquationValidationError(f'Unexpected character "{ch}"')

    return tokens


def _parse_expression(tokens: list[dict[str, Any]]) -> dict[str, Any]:
    pos = 0

    def peek() -> dict[str, Any] | None:
        return tokens[pos] if pos < len(tokens) else None

    def consume(expected_type: str) -> dict[str, Any]:
        nonlocal pos
        token = peek()
        if token is None or token.get("type") != expected_type:
            raise EquationValidationError("Invalid expression syntax")
        pos += 1
        return token

    def parse_primary() -> dict[str, Any]:
        token = peek()
        if token is None:
            raise EquationValidationError("Unexpected end of expression")

        if token["type"] == "number":
            consume("number")
            return {"type": "number", "value": token["value"]}

        if token["type"] == "stream":
            consume("stream")
            return {"type": "stream", "ref": token["ref"]}

        if token["type"] == "(":
            consume("(")
            node = parse_add_sub()
            if peek() is None or peek()["type"] != ")":
                raise EquationValidationError("Missing closing parenthesis")
            consume(")")
            return node

        if token["type"] == "operator" and token["value"] == "-":
            consume("operator")
            return {"type": "unary", "op": "-", "arg": parse_primary()}

        raise EquationValidationError("Invalid expression syntax")

    def parse_power() -> dict[str, Any]:
        node = parse_primary()
        while (
            peek() is not None
            and peek()["type"] == "operator"
            and peek()["value"] == "^"
        ):
            consume("operator")
            node = {
                "type": "binary",
                "op": "^",
                "left": node,
                "right": parse_primary(),
            }
        return node

    def parse_mul_div() -> dict[str, Any]:
        node = parse_power()
        while (
            peek() is not None
            and peek()["type"] == "operator"
            and peek()["value"] in ("*", "/")
        ):
            op = consume("operator")["value"]
            node = {"type": "binary", "op": op, "left": node, "right": parse_power()}
        return node

    def parse_add_sub() -> dict[str, Any]:
        node = parse_mul_div()
        while (
            peek() is not None
            and peek()["type"] == "operator"
            and peek()["value"] in ("+", "-")
        ):
            op = consume("operator")["value"]
            node = {"type": "binary", "op": op, "left": node, "right": parse_mul_div()}
        return node

    ast = parse_add_sub()
    if pos != len(tokens):
        raise EquationValidationError("Invalid expression syntax")
    return ast


def extract_stream_refs(expression: str) -> list[str]:
    refs: set[str] = set()
    for match in re.finditer(r"(\d+):([a-zA-Z][a-zA-Z0-9_]*)", expression):
        ref = f"{match.group(1)}:{match.group(2)}"
        if resolve_stream_spec(match.group(2)) is None:
            raise EquationValidationError(
                f'Unknown sensor stream "{match.group(2)}" in {ref}'
            )
        refs.add(ref)
    return sorted(refs)


def validate_expression(
    expression: str, selected_cell_ids: list[int] | None = None
) -> dict[str, Any]:
    """
    Validate a dashboard equation expression.

    Returns {"ok": True, "refs": [...]} on success.
    Raises EquationValidationError on failure.
    """
    if expression is None or not str(expression).strip():
        raise EquationValidationError("Expression is required")

    trimmed = str(expression).strip()
    if len(trimmed) > MAX_EXPRESSION_LENGTH:
        raise EquationValidationError(
            f"Expression exceeds maximum length ({MAX_EXPRESSION_LENGTH})"
        )

    tokens = _tokenize(trimmed)
    _parse_expression(tokens)
    refs = extract_stream_refs(trimmed)

    if len(refs) > MAX_STREAM_REFS:
        raise EquationValidationError(
            f"Too many stream references (max {MAX_STREAM_REFS})"
        )

    if selected_cell_ids is not None:
        allowed = {int(cell_id) for cell_id in selected_cell_ids}
        for ref in refs:
            match = STREAM_REF_RE.match(ref)
            if not match:
                continue
            cell_id = int(match.group(1))
            if cell_id not in allowed:
                raise EquationValidationError(
                    f"Reference {ref} uses cell {cell_id} which is not selected"
                )

    return {"ok": True, "refs": refs, "expression": trimmed}
