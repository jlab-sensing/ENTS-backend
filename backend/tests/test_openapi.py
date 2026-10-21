import os
import re


def _get_repo_root():
    # Attempt to locate repo root via docs/openapi.yaml
    cur = os.path.dirname(os.path.abspath(__file__))
    while cur and cur != os.path.dirname(cur):
        if os.path.exists(os.path.join(cur, "docs", "openapi.yaml")):
            return cur
        cur = os.path.dirname(cur)
    # Fallback to parent of parent of this file
    return os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


def test_openapi_file_exists():
    repo_root = _get_repo_root()
    openapi_path = os.path.join(repo_root, "docs", "openapi.yaml")

    assert os.path.exists(openapi_path), f"File not found at {openapi_path}"

    with open(openapi_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "openapi: 3.0.3" in content
    assert "title: ENTS Backend API" in content
    assert "/sensor/:" in content
    assert "/sensor_json/:" in content
    assert "/cell/:" in content
    assert "/logger/:" in content


def test_openapi_documents_endpoints():
    repo_root = _get_repo_root()
    openapi_path = os.path.join(repo_root, "docs", "openapi.yaml")
    init_path = os.path.join(repo_root, "backend", "api", "__init__.py")

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
