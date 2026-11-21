import pytest
from marshmallow import ValidationError
from api.models.cell import Cell
from api.schemas.cell_schema import CellSchema
from api.schemas.add_cell_schema import AddCellSchema


def test_cell_metadata_init():
    """
    GIVEN metadata is provided
    WHEN initializing a Cell instance
    THEN cell_metadata holds the metadata dict
    """
    cell = Cell(name="cell_meta", metadata={"sand": 0.4, "silt": 0.2})
    assert cell.cell_metadata == {"sand": 0.4, "silt": 0.2}

    cell2 = Cell(name="cell_meta2", cell_metadata={"clay": 0.1})
    assert cell2.cell_metadata == {"clay": 0.1}

    cell_default = Cell(name="cell_default")
    assert cell_default.cell_metadata == {}


def test_cell_schema_serializes_metadata():
    """
    GIVEN a Cell instance with metadata
    WHEN dumped via CellSchema
    THEN metadata key contains the dict and cell_metadata is excluded
    """
    cell = Cell(name="cell_meta", metadata={"sand": 0.4, "silt": 0.2})
    schema = CellSchema()
    dumped = schema.dump(cell)
    assert "metadata" in dumped
    assert dumped["metadata"] == {"sand": 0.4, "silt": 0.2}
    assert "cell_metadata" not in dumped


def test_add_cell_schema_loads_metadata():
    """
    GIVEN a payload with arbitrary metadata
    WHEN loaded via AddCellSchema
    THEN metadata is parsed properly
    """
    schema = AddCellSchema()
    loaded = schema.load(
        {
            "name": "cell_1",
            "location": "field",
            "latitude": 10.0,
            "longitude": 20.0,
            "userEmail": "test@example.com",
            "metadata": {"sand": 0.5, "ph": 6.8},
        }
    )
    assert loaded["metadata"] == {"sand": 0.5, "ph": 6.8}

    with pytest.raises(ValidationError):
        schema.load({"name": "cell_invalid", "metadata": "not-a-dict"})


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
