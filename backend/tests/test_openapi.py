import os
import re


def test_openapi_file_exists():
    # Resolve repo root relative to this test file
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    openapi_path = os.path.join(base_dir, "docs", "openapi.yaml")

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
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    openapi_path = os.path.join(base_dir, "docs", "openapi.yaml")
    init_path = os.path.join(base_dir, "backend", "api", "__init__.py")

    with open(openapi_path, "r", encoding="utf-8") as f:
        openapi_content = f.read()

    with open(init_path, "r", encoding="utf-8") as f:
        init_content = f.read()

    # Extract added resources / paths from api.add_resource calls in __init__.py
    resource_matches = re.findall(r"api\.add_resource\(([^)]+)\)", init_content)
    registered_paths = set()
    for match in resource_matches:
        parts = [p.strip().strip("'\"") for p in match.split(",")[1:]]
        for path in parts:
            if path.startswith("/"):
                # convert flask restful param <type:name> or <name> to OpenAPI format {name}
                openapi_style_path = re.sub(
                    r"<(?:\w+:)?(\w+)>", r"{\1}", path
                )
                registered_paths.add(openapi_style_path)

    for path in registered_paths:
        # Check that the path or path definition exists in openapi.yaml
        assert path in openapi_content or (path + ":") in openapi_content, (
            f"Endpoint path '{path}' registered in __init__.py is missing from openapi.yaml"
        )
