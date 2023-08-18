from flask import request, jsonify
from flask_restful import Resource

class Health_Check(Resource):
    def get(self):
        return {'hello': 'I\'m alive and healthy!'}
