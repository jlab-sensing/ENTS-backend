from api.models.cell import Cell as CellModel
from api.models.user import User


def test_delete_cell(test_client):
    """
    GIVEN a Cell ID
    WHEN a DELETE request is made to /api/cell/<id>
    THEN check the cell is deleted
    """
    test_user = User(
        first_name="Test", last_name="User", email="test@example.com", password=""
    )
    test_user.save()

    CellModel("test_cell", "", 1, 1, False, test_user.id).save()
    cell = CellModel.query.filter_by(name="test_cell").first()

    response = test_client.delete(f"/api/cell/{cell.id}")
    assert response.status_code == 200
    assert b"Successfully deleted cell" in response.data

    assert CellModel.get(cell.id) is None


def test_delete_nonexistent_cell(test_client):
    """
    GIVEN a non-existent Cell ID
    WHEN a DELETE request is made
    THEN check appropriate error is returned
    """
    response = test_client.delete("/api/cell/99999")
    assert response.status_code == 404
    assert response.json == {"error": "Cell not found"}
