from flask_restful import Resource
from flask import request
from ..auth.auth import authenticate
from ..models.cell import Cell as CellModel
from ..models.user import User as UserModel
from ..schemas.user_schema import UserSchema

# Initialize schemas
users_schema = UserSchema(many=True)
user_schema = UserSchema()


class CellUsers(Resource):
    """Resource for managing users associated with a specific cell"""

    method_decorators = {"post": [authenticate]}

    def get(self, cell_id):
        """Get all users for a specific cell"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        return users_schema.dump(cell.users)

    def post(self, user, cell_id):
        """Assign multiple users to a cell (replaces existing users)"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        json_data = request.json
        if not json_data or "user_ids" not in json_data:
            return {"message": "user_ids is required"}, 400

        user_ids = json_data.get("user_ids", [])
        if not isinstance(user_ids, list):
            return {"message": "user_ids must be a list"}, 400

        try:
            # Get users by IDs
            users = []
            for user_id in user_ids:
                user = UserModel.get(user_id)
                if user:
                    users.append(user)
                else:
                    return {"message": f"User with ID {user_id} not found"}, 404

            # Replace current users with new ones
            cell.users = users
            cell.save()

            return {
                "message": "Users assigned successfully",
                "users": users_schema.dump(cell.users),
            }
        except Exception as e:
            return {"message": "Error assigning users", "error": str(e)}, 500


class CellUserDetail(Resource):
    """Resource for managing individual user assignment to a cell"""

    method_decorators = {"put": [authenticate], "delete": [authenticate]}

    def put(self, cell_id, user_id):
        """Add a specific user to a cell"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        target_user = UserModel.get(user_id)
        if not target_user:
            return {"message": "User not found"}, 404

        try:
            # Check if user is already assigned
            if target_user in cell.users:
                return {"message": "User already assigned to cell"}, 400

            # Add user to cell
            cell.users.append(target_user)
            cell.save()

            return {
                "message": "User added to cell successfully",
                "user": user_schema.dump(target_user),
            }
        except Exception as e:
            return {"message": "Error adding user to cell", "error": str(e)}, 500

    def delete(self, cell_id, user_id):
        """Remove a specific user from a cell"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        target_user = UserModel.get(user_id)
        if not target_user:
            return {"message": "User not found"}, 404

        try:
            # Check if user is assigned to cell
            if target_user not in cell.users:
                return {"message": "User not assigned to this cell"}, 404

            # Remove user from cell
            cell.users.remove(target_user)
            cell.save()

            return {"message": "User removed from cell successfully"}
        except Exception as e:
            return {"message": "Error removing user from cell", "error": str(e)}, 500


class CellByUser(Resource):
    """Resource for getting cells by user"""

    # No authentication required - following Cell resource pattern

    def get(self, user_id):
        """Get all cells that have a specific user"""
        user = UserModel.get(user_id)
        if not user:
            return {"message": "User not found"}, 404

        from ..schemas.cell_schema import CellSchema

        cells_schema = CellSchema(many=True)

        return {"user": user_schema.dump(user), "cells": cells_schema.dump(user.cells)}


class CellShare(Resource):
    """Resource for sharing a cell with another user by email"""

    method_decorators = [authenticate]

    def post(self, authenticated_user, cell_id):
        """Share a cell with a user by their email"""
        cell = CellModel.get(cell_id)
        if not cell:
            return {"message": "Cell not found"}, 404

        json_data = request.json
        if not json_data or "email" not in json_data:
            return {"message": "email is required"}, 400

        email = json_data.get("email")
        if not email:
            return {"message": "email cannot be empty"}, 400

        try:
            # Find user by email
            target_user = UserModel.get_user_by_email(email)
            if not target_user:
                return {"message": f"User with email {email} not found"}, 404

            # Check if user is already assigned
            if target_user in cell.users:
                return {"message": "User already has access to this cell"}, 400

            # Add user to cell
            cell.users.append(target_user)
            cell.save()

            return {
                "message": "Cell shared successfully",
                "user": user_schema.dump(target_user),
            }
        except Exception as e:
            return {"message": "Error sharing cell", "error": str(e)}, 500
