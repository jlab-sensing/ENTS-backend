from flask_restful import Resource
from flask import request, jsonify
from ..auth.auth import authenticate
from ..models.cell import Tag as TagModel
from ..schemas.tag_schema import TagSchema, CreateTagSchema, UpdateTagSchema, TagListSchema

# Initialize schemas
tags_schema = TagSchema(many=True)
tag_schema = TagSchema()
create_tag_schema = CreateTagSchema()
update_tag_schema = UpdateTagSchema()
tag_list_schema = TagListSchema(many=True)


class Tag(Resource):
    # No authentication required - following Cell resource pattern

    def get(self):
        """Get all tags or filter by category"""
        json_data = request.args
        category = json_data.get("category")
        search = json_data.get("search")

        if category:
            tags = TagModel.get_by_category(category)
        elif search:
            tags = TagModel.search_by_name(search)
        else:
            tags = TagModel.get_all()

        return tags_schema.dump(tags)

    def post(self):
        """Create a new tag"""
        json_data = request.json
        
        if not json_data:
            return {"message": "No data provided"}, 400

        # Validate input data
        try:
            tag_data = create_tag_schema.load(json_data)
        except Exception as e:
            return {"message": "Invalid data", "errors": str(e)}, 400

        name = tag_data["name"].strip()
        category = tag_data.get("category")
        description = tag_data.get("description")

        # Check if tag already exists
        existing_tag = TagModel.query.filter_by(name=name).first()
        if existing_tag:
            return {"message": "Tag with this name already exists"}, 400

        try:
            new_tag = TagModel(
                name=name,
                category=category,
                description=description,
                created_by=None  # No authentication, so no user ID
            )
            new_tag.save()
            
            return {
                "message": "Tag created successfully",
                "tag": tag_schema.dump(new_tag)
            }, 201
        except Exception as e:
            return {"message": "Error creating tag", "error": str(e)}, 500


class TagDetail(Resource):
    # No authentication required - following Cell resource pattern

    def get(self, tag_id):
        """Get specific tag by ID"""
        tag = TagModel.get(tag_id)
        if not tag:
            return {"message": "Tag not found"}, 404

        return tag_schema.dump(tag)

    def put(self, tag_id):
        """Update tag"""
        tag = TagModel.get(tag_id)
        if not tag:
            return {"message": "Tag not found"}, 404

        json_data = request.json
        if not json_data:
            return {"message": "No data provided"}, 400

        # Validate input data
        try:
            tag_data = update_tag_schema.load(json_data)
        except Exception as e:
            return {"message": "Invalid data", "errors": str(e)}, 400

        try:
            if "name" in tag_data:
                new_name = tag_data["name"].strip()
                if new_name != tag.name:
                    # Check if new name already exists
                    existing_tag = TagModel.query.filter_by(name=new_name).first()
                    if existing_tag:
                        return {"message": "Tag with this name already exists"}, 400
                    tag.name = new_name

            if "category" in tag_data:
                tag.category = tag_data["category"]

            if "description" in tag_data:
                tag.description = tag_data["description"]

            tag.save()

            return {
                "message": "Tag updated successfully",
                "tag": tag_schema.dump(tag)
            }
        except Exception as e:
            return {"message": "Error updating tag", "error": str(e)}, 500

    def delete(self, tag_id):
        """Delete tag"""
        tag = TagModel.get(tag_id)
        if not tag:
            return {"message": "Tag not found"}, 404

        try:
            tag.delete()
            return {"message": "Tag deleted successfully"}
        except Exception as e:
            return {"message": "Error deleting tag", "error": str(e)}, 500


class TagCategories(Resource):
    # No authentication required for reading categories

    def get(self):
        """Get all unique tag categories"""
        from ..models import db
        categories = db.session.query(TagModel.category).filter(TagModel.category.isnot(None)).distinct().all()
        category_list = [cat[0] for cat in categories if cat[0]]
        return {"categories": category_list}