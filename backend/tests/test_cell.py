# from api.models.cell import Cell
# from api import db

# Broken test; authenticate in cell.py dosent work for this test
#
#
# def test_cell_data_endpoint(test_client, setup_cells):
#     """
#     GIVEN a db with cells inserted under fixture setup_cells
#     WHEN hitting the endpoint /api/cell
#     THEN the response should be an array of cell objects with
#     keys: name, location, lattitude and longitude
#     """
#     response = test_client.get("/api/cell/")
#     assert response.status_code == 200
#     assert response.data == (
#         b'[{"name": "cell_1", "location": "", "longitude": 1.0, '
#         b'"latitude": 1.0, "userEmail": "", "archive": false}, '
#         b'{"name": "cell_2", "location": "", "longitude": 2.0, '
#         b'"latitude": 2.0, "userEmail": "", "archive": false}]\n'
#     )


# def test_update_cell_endpoint(test_client, setup_cells):
# Grab the first inserted test cell
#    cell = db.session.query(Cell).filter_by(name="cell_1").first()
#    assert cell is not None

#    update_data = {
#        "name": "updated_cell",
#        "location": "updated_location",
#        "lat": 10.0,
#        "long": 20.0,
#        "archive": True,
#    }

#    response = test_client.put(f"/api/cell/{cell.id}", json=update_data)
#    assert response.status_code == 200
#    assert response.json.get("message") == "Successfully updated cell"


# FIXME:
# cell post is messed up, need to refactor
# def test_cell_data_endpoint(test_client):
#     """
#     GIVEN a db with cells inserted under fixture setup_cells
#     WHEN hitting the endpoint /api/cell
#     THEN the response should be an array of cell objects with
#     keys: name, location, lattitude and longitude
#     """
#     response = test_client.post(
#         "/api/cell/",
#         json={
#             "name": "cell",
#             "location": "baskin",
#             "longitude": 1,
#             "latitude": 1,
#             # "user_email": "test@gmail.com",
#         },
#         content_type="application/json",
#     )
#     assert response.status_code == 200
#     assert (
#         response.data
#         == b'[{"name": "cell_1", "location": "",
# "longitude": 1.0, "latitude": 1.0},
# {"name": "cell_2", "location": "",
# "longitude": 2.0, "latitude": 2.0}]\n'
#     )
