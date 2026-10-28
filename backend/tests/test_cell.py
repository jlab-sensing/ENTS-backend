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


def _make_cell(name, owner=None, shared_with=(), is_public=True):
    cell = Cell(
        name, "loc", 1, 1, False, owner.id if owner else None, is_public=is_public
    )
    cell.save()
    for member in shared_with:
        cell.users.append(member)
    cell.save()
    return cell


def _names(response):
    return {c["name"] for c in response.get_json()}


def test_cell_id_hides_private_cells_from_anonymous(test_client, init_database):
    """
    GIVEN a public cell and a private cell
    WHEN an anonymous caller lists cells via /api/cell/id (dashboard dropdown)
    THEN only the public cell is returned
    """
    owner = make_user(email="cid-owner@x.com", api_key="cid-owner-key")
    _make_cell("cid_public", owner, is_public=True)
    _make_cell("cid_private", owner, is_public=False)

    names = _names(test_client.get("/api/cell/id"))
    assert "cid_public" in names
    assert "cid_private" not in names


def test_cell_id_shows_private_cells_to_owner_and_member(test_client, init_database):
    """
    GIVEN a private cell shared with a member
    WHEN the owner, the member and a stranger list cells via /api/cell/id
    THEN owner and member see it, the stranger does not
    """
    owner = make_user(email="cid2-owner@x.com", api_key="cid2-owner-key")
    member = make_user(email="cid2-member@x.com", api_key="cid2-member-key")
    stranger = make_user(email="cid2-stranger@x.com", api_key="cid2-stranger-key")
    _make_cell("cid2_private", owner, shared_with=[member], is_public=False)

    for user, visible in ((owner, True), (member, True), (stranger, False)):
        response = test_client.get("/api/cell/id", headers=make_jwt_header(user))
        assert ("cid2_private" in _names(response)) is visible


def test_cell_list_excludes_other_users_private_cells(test_client, init_database):
    """
    GIVEN public and private cells owned by another user
    WHEN listing and searching cells
    THEN the private cell is excluded from both while public stays visible
    """
    owner = make_user(email="list-owner@x.com", api_key="list-owner-key")
    other = make_user(email="list-other@x.com", api_key="list-other-key")
    _make_cell("list_public_cell", owner, is_public=True)
    _make_cell("list_private_cell", owner, is_public=False)
    headers = make_jwt_header(other)

    listed = _names(test_client.get("/api/cell/", headers=headers))
    assert "list_public_cell" in listed
    assert "list_private_cell" not in listed

    searched = _names(test_client.get("/api/cell/?name=list_p", headers=headers))
    assert "list_public_cell" in searched
    assert "list_private_cell" not in searched

    owner_listed = _names(test_client.get("/api/cell/", headers=make_jwt_header(owner)))
    assert "list_private_cell" in owner_listed


def test_cell_put_and_delete_forbidden_for_non_members(test_client, init_database):
    """
    GIVEN a cell owned by another user
    WHEN a stranger updates its name, changes its visibility, or deletes it
    THEN each request returns 403 and the cell is unchanged
    """
    owner = make_user(email="mut-owner@x.com", api_key="mut-owner-key")
    stranger = make_user(email="mut-stranger@x.com", api_key="mut-stranger-key")
    cell = _make_cell("mut_cell", owner, is_public=True)
    headers = make_jwt_header(stranger)

    assert (
        test_client.put(
            f"/api/cell/{cell.id}", json={"name": "hijacked"}, headers=headers
        ).status_code
        == 403
    )
    assert (
        test_client.put(
            f"/api/cell/{cell.id}", json={"is_public": False}, headers=headers
        ).status_code
        == 403
    )
    assert (
        test_client.delete(f"/api/cell/{cell.id}", headers=headers).status_code == 403
    )

    unchanged = Cell.get(cell.id)
    assert unchanged.name == "mut_cell"
    assert unchanged.is_public is True


def test_cell_owner_can_update_and_delete(test_client, init_database):
    """
    GIVEN a cell owner
    WHEN they rename then delete the cell
    THEN both requests succeed
    """
    owner = make_user(email="own-ud@x.com", api_key="own-ud-key")
    cell = _make_cell("own_ud_cell", owner)
    headers = make_jwt_header(owner)

    response = test_client.put(
        f"/api/cell/{cell.id}", json={"name": "own_ud_renamed"}, headers=headers
    )
    assert response.status_code == 200
    assert Cell.get(cell.id).name == "own_ud_renamed"

    assert (
        test_client.delete(f"/api/cell/{cell.id}", headers=headers).status_code == 200
    )
    assert Cell.get(cell.id) is None


def test_cell_defaults_to_public(test_client, init_database):
    """
    GIVEN a cell created without an explicit visibility
    THEN it is public
    """
    cell = Cell("default_public_cell", "", 1, 1, False, None)
    cell.save()
    assert Cell.get(cell.id).is_public is True


def test_cell_post_private_persists_owner(test_client, init_database):
    """
    GIVEN a user
    WHEN creating a private cell
    THEN the owner and visibility are persisted
    """
    user = make_user(email="cell-priv-owner@x.com", api_key="cell-priv-owner-key")
    response = test_client.post(
        "/api/cell/",
        json=_create_cell_payload("priv_owner_cell", user.email, is_public=False),
    )
    assert response.status_code == 200
    cell = Cell.find_by_name("priv_owner_cell")
    assert cell.is_public is False
    assert cell.user_id == user.id
