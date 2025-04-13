from api.models.cell import Cell as CellModel


def test_delete_cell(test_client):
    """
    GIVEN a Cell ID
    WHEN a DELETE request is made to /api/cell/<id>
    THEN check the cell is deleted
    """
    CellModel("test_cell", "", 1, 1, False, None).save()
    cell = CellModel.get_by_name("test_cell")
    
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
    assert b"Cell not found" in response.data
