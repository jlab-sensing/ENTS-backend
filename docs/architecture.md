## Architecture

### System

ENTS backend's client is built with React and is located under the `frontend` folder. ENTS backend's API is built with Flask and located under the `backend` folder. Check out the [frontend readme](frontend/README.md) and the [backend readme](backend/README.md) for more information.

### Local Development and Production Environments

To compile for with development configurations (eg. hot reload and logs), in `docker-compose.yml` set `target: development`. To test containers in with production configuration use `target: production`.
