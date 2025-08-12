from flask_restful import Resource
from flask import request
from ..models.cell import Cell as CellModel, Tag as TagModel
from ..schemas.tag_schema import TagSchema

# Initialize schemas
tags_schema = TagSchema(many=True)
tag_schema = TagSchema()


class CellTags(Resource):
    """Resource for managing tags associated with a specific cell"""

    # No authentication required - following Cell resource pattern

    def get(self, cell_id):
        """Get all tags for a specific cell"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        return tags_schema.dump(cell.tags)

    def post(self, cell_id):
        """Assign multiple tags to a cell (replaces existing tags)"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        json_data = request.json
        if not json_data or "tag_ids" not in json_data:
            return {"message": "tag_ids is required"}, 400

        tag_ids = json_data.get("tag_ids", [])
        if not isinstance(tag_ids, list):
            return {"message": "tag_ids must be a list"}, 400

        try:
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
            cell.save()

            return {
                "message": "Tags assigned successfully",
                "tags": tags_schema.dump(cell.tags),
            }
        except Exception as e:
            return {"message": "Error assigning tags", "error": str(e)}, 500


class CellTagDetail(Resource):
    """Resource for managing individual tag assignment to a cell"""

    # No authentication required - following Cell resource pattern

    def put(self, cell_id, tag_id):
        """Add a specific tag to a cell"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        tag = TagModel.get(tag_id)
        if not tag:
            return {"message": "Tag not found"}, 404

        try:
            # Check if tag is already assigned
            if tag in cell.tags:
                return {"message": "Tag already assigned to cell"}, 400

            # Add tag to cell
            cell.tags.append(tag)
            cell.save()

            return {
                "message": "Tag added to cell successfully",
                "tag": tag_schema.dump(tag),
            }
        except Exception as e:
            return {"message": "Error adding tag to cell", "error": str(e)}, 500

    def delete(self, cell_id, tag_id):
        """Remove a specific tag from a cell"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        tag = TagModel.get(tag_id)
        if not tag:
            return {"message": "Tag not found"}, 404

        try:
            # Check if tag is assigned to cell
            if tag not in cell.tags:
                return {"message": "Tag not assigned to this cell"}, 404

            # Remove tag from cell
            cell.tags.remove(tag)
            cell.save()

            return {"message": "Tag removed from cell successfully"}
        except Exception as e:
            return {"message": "Error removing tag from cell", "error": str(e)}, 500


class CellsByTag(Resource):
    """Resource for getting cells by tag"""

    # No authentication required - following Cell resource pattern

    def get(self, tag_id):
        """Get all cells that have a specific tag"""
        tag = TagModel.get(tag_id)
        if not tag:
            return {"message": "Tag not found"}, 404

        from ..schemas.cell_schema import CellSchema

        cells_schema = CellSchema(many=True)

        return {"tag": tag_schema.dump(tag), "cells": cells_schema.dump(tag.cells)}
