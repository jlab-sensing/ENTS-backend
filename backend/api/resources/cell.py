from flask_restful import Resource
from flask import request, jsonify
from ..auth.auth import authenticate
from ..schemas.cell_schema import CellSchema

# from ..conn import engine
from ..models.cell import Cell as CellModel
from ..schemas.add_cell_schema import AddCellSchema

cells_schema = CellSchema(many=True)
add_cell_schema = AddCellSchema()

# pt 2: use flask restful to add a decorator for the get endpoint


class Cell(Resource):
    method_decorators = {'get': [authenticate]}
    def get(self, user):
        json_data = request.args
        userCells = json_data.get("user")
        print('please work',userCells, flush=True)

        if(userCells):
            cells = CellModel.get_cells_by_user_id(user.id)
            print('if in cell.py resources', flush=True)
            return cells_schema.dump(cells)
        else:
            cells = CellModel.get_all()
            print('else in cell.py resources', flush=True)
            return cells_schema.dump(cells)

        # query parameteres -> react routing
        # allow you to specifcy what type of data you want from the frontend
        # (choose if you want to get publically avaliable cells or just the users cells)
        # dashboard -> call this endpoint twice to get publcially avaliable cells and user cells
        # profile -> call this endpoint with query parameters that state we only want user cells

        # `/api/cell/?user=True`

        # authenticate decordator -> user info
        # input to authenticate (email + tokens)

        # pt 3: querying portion -> model
        # model:
        # get_cells_with_user_id -> return cells specific to userid
        # get_cells_without_user_id -> return cells



        # Tackle this at the very end!
        # DON'T import db into cell.py
        # use the db in the respective model file and
        # create helper functions to reference


        #ex:
        # BAD way
        # in cell.py - resources
        # import db
        # cell = Cell(xyz)
        # db.add(cell)
        # db.commit()

        # Better way - more object oriented - abstracts certain libraries in different modules
        # in /modeles/cell.py
        # import db
        # def save(self):
            # db.add(self)
            # db.commit()
        # in /resources/cell.py
        # cell = Cell(xyz)
        # cell.save()

        # model == object
        # strictly code related
        # setters are use to mutate the object
        # getter get a representation of the object

        # GET and POST -> relative to the database, strictly http,
        # relationship between user and the database


        # app imports resources import models
        # app imports models
        # in models we need to create all teh functions that interact with the database


        # saving to db
        # db.session.add
        # db.sesioon.commit

        # whenever you create a new entity, using the model constuctor
        # use class method to save it
        #.save()

    def post(self):
        json_data = request.json
        cell_data = add_cell_schema.load(json_data)
        cell_name = cell_data["name"]
        location = cell_data["location"]
        lat = cell_data["latitude"]
        long = cell_data["longitude"]
        # FIXME:
        # migrate user email to include authenticated user
        # if userEmail["userEmail"] is None:
        #     userEmail = cell_data["userEmail"]
        if cell_data["archive"] is None:
            archive = False
        else:
            archive = cell_data["archive"]
        new_cell = CellModel.add_cell_by_user_emailcell(
            cell_name, location, lat, long, archive
        )
        return jsonify(new_cell)

    def put(self, cellId):
        json_data = request.json
        archive = json_data.get("archive")
        cell = CellModel.get(cellId)
        if cell:
            cell.archive = archive
            cell.save()
            return {"message": "Successfully updated cell"}
        return jsonify({"message": "Cell not found"}), 404
