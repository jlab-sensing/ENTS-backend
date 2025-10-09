"""WSGI module

Deploys on gunicorn with Socket.IO support

"""

import api
import os

# Create the Flask app
app = api.create_app()
celery_app = app.extensions["celery"]

# Get the socketio instance that was initialized with the app
socketio = api.socketio

# For Gunicorn to properly serve Socket.IO, we need to use the app
# The socketio instance is already bound to the app via init_app()
# So we just need to export 'app' and make sure Gunicorn uses the right worker class
handler = app

# Production deployment: Use Gunicorn with eventlet/gevent worker for Socket.IO support
# This allows both Flask API and Socket.IO to work in the same process
if __name__ == "__main__":
    # Development mode
    socketio.run(app, host="0.0.0.0", port=8000, debug=True)
else:
    # Production mode: Gunicorn will serve 'handler' with eventlet worker
    # The socketio instance is already initialized and bound to the Flask app
    pass
