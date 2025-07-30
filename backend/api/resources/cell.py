from flask_restful import Resource
from flask import request, jsonify
from ..auth.auth import authenticate
from ..schemas.cell_schema import CellSchema

# from ..conn import engine
from ..models.cell import Cell as CellModel, Tag as TagModel
from ..schemas.add_cell_schema import AddCellSchema

cells_schema = CellSchema(many=True)
add_cell_schema = AddCellSchema()

# pt 2: use flask restful to add a decorator for the get endpoint


class Cell(Resource):
    method_decorators = {"get": [authenticate]}

    def get(self, user):
        json_data = request.args
        userCells = json_data.get("user")
        tag_ids = json_data.get("tags")  # Comma-separated tag IDs: "1,2,3"
        category = json_data.get("category")  # Filter by tag category

        # Base query
        if userCells:
            cells = CellModel.get_cells_by_user_id(user.id)
        else:
            cells = CellModel.get_all()

        # Apply tag filtering if specified
        if tag_ids:
            try:
                tag_id_list = [int(id.strip()) for id in tag_ids.split(",")]
                # Filter cells that have ANY of the specified tags
                cells = [cell for cell in cells if any(tag.id in tag_id_list for tag in cell.tags)]
            except ValueError:
                return {"message": "Invalid tag IDs format"}, 400

        # Apply category filtering if specified
        if category:
            cells = [cell for cell in cells if any(tag.category == category for tag in cell.tags)]

        return cells_schema.dump(cells)

    def post(self):
        json_data = request.json
        cell_data = add_cell_schema.load(json_data)
        cell_name = cell_data["name"]
        location = cell_data["location"]
        lat = cell_data["latitude"]
        long = cell_data["longitude"]
        userEmail = cell_data["userEmail"]
        tag_ids = cell_data.get("tag_ids", [])
        
        # FIXME:
        # migrate user email to include authenticated user
        # if userEmail["userEmail"] is None:
        #     userEmail = cell_data["userEmail"]
        if cell_data["archive"] is None:
            archive = False
        else:
            archive = cell_data["archive"]
            
        if CellModel.find_by_name(cell_name):
            return {"message": "Duplicate cell name"}, 400
            
        try:
            new_cell = CellModel.add_cell_by_user_email(
                cell_name, location, lat, long, archive, userEmail
            )
            
            if new_cell and tag_ids:
                # Assign tags to the new cell
                tags = []
                for tag_id in tag_ids:
                    tag = TagModel.get(tag_id)
                    if tag:
                        tags.append(tag)
                    else:
                        return {"message": f"Tag with ID {tag_id} not found"}, 404
                
                new_cell.tags = tags
                new_cell.save()
            
            if new_cell:
                return {"message": "Successfully added cell"}
            return {"message": "Error adding cell"}, 400
        except Exception as e:
            return {"message": "Error adding cell", "error": str(e)}, 500

    def put(self, cellId):
        json_data = request.json
        cell = CellModel.get(cellId)

        if not cell:
            return jsonify({"message": "Cell not found"}), 404

        try:
            # Update basic cell fields
            if "name" in json_data:
                cell.name = json_data.get("name")
            if "location" in json_data:
                cell.location = json_data.get("location")
            if "lat" in json_data:
                cell.latitude = json_data.get("lat")
            if "long" in json_data:
                cell.longitude = json_data.get("long")
            if "archive" in json_data:
                cell.archive = json_data.get("archive")

            # Handle tag assignment
            if "tag_ids" in json_data:
                tag_ids = json_data.get("tag_ids", [])
                if isinstance(tag_ids, list):
                    # Get tags by IDs
                    tags = []
                    for tag_id in tag_ids:
                        tag = TagModel.get(tag_id)
                        if tag:
                            tags.append(tag)
                        else:
                            return {"message": f"Tag with ID {tag_id} not found"}, 404
                    
                    # Replace current tags with new ones
                    cell.tags = tags
                else:
                    return {"message": "tag_ids must be a list"}, 400

            cell.save()
            return {"message": "Successfully updated cell"}
        except Exception as e:
            return {"message": "Error updating cell", "error": str(e)}, 500

    def delete(self, cellId):
        cell = CellModel.get(cellId)
        if not cell:
            return jsonify({"message": "Cell not found"}), 404
        cell.delete()

        return {"message": "Cell deleted successfully"}
