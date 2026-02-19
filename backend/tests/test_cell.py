from api.models.user import User


def test_cell_post_returns_id_and_name(init_database):
    """
    GIVEN a user exists in the database
    WHEN posting to /api/cell/ to create a new cell
    THEN the response should contain the new cell's id and name
    """
    user = User(
        first_name="Test", last_name="User", email="celltest@example.com", password=""
    )
    user.save()

    response = init_database.post(
        "/api/cell/",
        json={
            "name": "Test Cell",
            "location": "Test Location",
            "latitude": 1.0,
            "longitude": 2.0,
            "userEmail": "celltest@example.com",
            "archive": False,
        },
        content_type="application/json",
    )

    assert response.status_code == 200
    data = response.get_json()
    assert data["message"] == "Successfully added cell"
    assert "id" in data
    assert "name" in data
    assert data["name"] == "Test Cell"
