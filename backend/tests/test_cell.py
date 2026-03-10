from api import db
from api.models.user import User
from api.models.cell import Cell


def test_cell_search_by_name(init_database):
    """
    GIVEN cells exist in the database
    WHEN searching cells by name pattern
    THEN only cells whose names match the pattern are returned
    """
    cell1 = Cell("search_cell_alpha", "", 1, 1, False, None)
    cell2 = Cell("search_cell_beta", "", 2, 2, False, None)
    db.session.add(cell1)
    db.session.add(cell2)
    db.session.commit()

    results = Cell.search_by_name("search_cell")
    assert len(results) == 2

    results = Cell.search_by_name("alpha")
    assert len(results) == 1
    assert results[0].name == "search_cell_alpha"

    results = Cell.search_by_name("nonexistent")
    assert len(results) == 0

    db.session.remove()


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
