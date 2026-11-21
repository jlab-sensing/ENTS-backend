import os
import re
import pytest


def _find_openapi_path():
    # Candidates for openapi.yaml path
    cur = os.path.dirname(os.path.abspath(__file__))
    # 1. Repo root /docs/openapi.yaml
    while cur and cur != os.path.dirname(cur):
        candidate = os.path.join(cur, "docs", "openapi.yaml")
        if os.path.exists(candidate):
            return candidate, os.path.join(cur, "backend", "api", "__init__.py")
        cur = os.path.dirname(cur)

    # 2. Relative to current working dir
    cwd_candidate = os.path.join(os.getcwd(), "docs", "openapi.yaml")
    if os.path.exists(cwd_candidate):
        return cwd_candidate, os.path.join(os.getcwd(), "backend", "api", "__init__.py")

    return None, None


def test_openapi_file_exists():
    openapi_path, _ = _find_openapi_path()
    if not openapi_path:
        pytest.skip("docs/openapi.yaml not accessible in test environment")

    assert os.path.exists(openapi_path)

    with open(openapi_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "openapi: 3.0.3" in content
    assert "title: ENTS Backend API" in content
    assert "/sensor/:" in content
    assert "/sensor_json/:" in content
    assert "/cell/:" in content
    assert "/logger/:" in content


def test_openapi_documents_endpoints():
    openapi_path, init_path = _find_openapi_path()
    if not openapi_path or not os.path.exists(init_path):
        pytest.skip(
            "docs/openapi.yaml or __init__.py not accessible in test environment"
        )

    with open(openapi_path, "r", encoding="utf-8") as f:
        openapi_content = f.read()

    with open(init_path, "r", encoding="utf-8") as f:
        init_content = f.read()

    # Extract added resources / paths from api.add_resource calls
    resource_matches = re.findall(r"api\.add_resource\(([^)]+)\)", init_content)
    registered_paths = set()
    for match in resource_matches:
        parts = [p.strip().strip("'\"") for p in match.split(",")[1:]]
        for path in parts:
            if path.startswith("/"):
                # convert <type:name> or <name> to OpenAPI format {name}
                openapi_style_path = re.sub(
                    r"<(?:\w+:)?(\w+)>",
                    r"{\1}",
                    path,
                )
                registered_paths.add(openapi_style_path)

    for path in registered_paths:
        # Check that path or path definition exists in openapi.yaml
        err_msg = (
            f"Endpoint path '{path}' registered in __init__.py "
            "is missing from openapi.yaml"
        )
        assert path in openapi_content or (path + ":") in openapi_content, err_msg
