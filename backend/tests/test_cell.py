from api.models.cell import Cell
from .test_apikey_auth import make_user, make_jwt_header


def test_cell_search_by_name(setup_cells):
    """
    GIVEN cells exist in the database
    WHEN searching cells by name pattern
    THEN only cells whose names match the pattern are returned
    """
    results = Cell.search_by_name("cell")
    assert len(results) == 2

    results = Cell.search_by_name("cell_1")
    assert len(results) == 1
    assert results[0].name == "cell_1"

    results = Cell.search_by_name("nonexistent")
    assert len(results) == 0


# def test_cell_post_returns_id_and_name(init_database):
#     """
#     GIVEN a user exists in the database
#     WHEN posting to /api/cell/ to create a new cell
#     THEN the response should contain the new cell's id and corresponding name
#     """
#     user = User(
#         first_name="Test", last_name="User", email="celltest@example.com", password=""
#     )
#     user.save()

#     response = init_database.post(
#         "/api/cell/",
#         json={
#             "name": "Test Cell",
#             "location": "Test Location",
#             "latitude": 1.0,
#             "longitude": 2.0,
#             "userEmail": "celltest@example.com",
#             "archive": False,
#         },
#         content_type="application/json",
#     )

#     assert response.status_code == 200
#     data = response.get_json()
#     assert data["message"] == "Successfully added cell"
#     assert "id" in data
#     assert "name" in data
#     assert data["name"] == "Test Cell"


def _create_cell_payload(name, email, **extra):
    return {
        "name": name,
        "location": "Test Location",
        "latitude": 1.0,
        "longitude": 2.0,
        "userEmail": email,
        "archive": False,
        **extra,
    }


def test_cell_post_is_public_defaults_true(test_client, init_database):
    """
    GIVEN a user exists
    WHEN posting a cell without is_public
    THEN the cell is public
    """
    user = make_user(email="cell-pub-default@x.com", api_key="cell-pub-default-key")
    response = test_client.post(
        "/api/cell/", json=_create_cell_payload("pub_default_cell", user.email)
    )
    assert response.status_code == 200
    assert Cell.find_by_name("pub_default_cell").is_public is True


def test_cell_post_is_public_false(test_client, init_database):
    """
    GIVEN a user exists
    WHEN posting a cell with is_public=False
    THEN the cell is stored as private
    """
    user = make_user(email="cell-priv-post@x.com", api_key="cell-priv-post-key")
    response = test_client.post(
        "/api/cell/",
        json=_create_cell_payload("priv_post_cell", user.email, is_public=False),
    )
    assert response.status_code == 200
    assert Cell.find_by_name("priv_post_cell").is_public is False


def test_cell_put_toggles_is_public(test_client, init_database):
    """
    GIVEN a cell created by a user
    WHEN the owner PUTs is_public
    THEN the visibility changes
    """
    user = make_user(email="cell-put-owner@x.com", api_key="cell-put-owner-key")
    headers = make_jwt_header(user)
    test_client.post(
        "/api/cell/", json=_create_cell_payload("put_toggle_cell", user.email)
    )
    cell = Cell.find_by_name("put_toggle_cell")

    response = test_client.put(
        f"/api/cell/{cell.id}", json={"is_public": False}, headers=headers
    )
    assert response.status_code == 200
    assert Cell.get(cell.id).is_public is False


def test_cell_put_is_public_requires_boolean(test_client, init_database):
    """
    GIVEN an existing cell
    WHEN PUTting a non-boolean is_public
    THEN a 400 is returned and the cell is unchanged
    """
    user = make_user(email="cell-put-bad@x.com", api_key="cell-put-bad-key")
    headers = make_jwt_header(user)
    test_client.post(
        "/api/cell/", json=_create_cell_payload("put_badtype_cell", user.email)
    )
    cell = Cell.find_by_name("put_badtype_cell")

    response = test_client.put(
        f"/api/cell/{cell.id}", json={"is_public": "no"}, headers=headers
    )
    assert response.status_code == 400
    assert Cell.get(cell.id).is_public is True


def test_cell_put_is_public_rejects_non_owner(test_client, init_database):
    """
    GIVEN a cell owned by one user
    WHEN a different user tries to change its visibility
    THEN a 403 is returned and the cell is unchanged
    """
    owner = make_user(email="cell-own@x.com", api_key="cell-own-key")
    other = make_user(email="cell-other@x.com", api_key="cell-other-key")
    test_client.post(
        "/api/cell/", json=_create_cell_payload("put_nonowner_cell", owner.email)
    )
    cell = Cell.find_by_name("put_nonowner_cell")

    response = test_client.put(
        f"/api/cell/{cell.id}",
        json={"is_public": False},
        headers=make_jwt_header(other),
    )
    assert response.status_code == 403
    assert Cell.get(cell.id).is_public is True
