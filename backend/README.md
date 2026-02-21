# ENTS Backend API

## Introduction

The ENTS backend API is built using the [Flask](https://flask.palletsprojects.com/en/3.0.x/) factory app pattern. All modules revolve around the running Flask context.

## API Reference

The ENTS API is organized around [REST](https://en.wikipedia.org/wiki/REST). The API uses predictable resource-oriented URLs, accepts [form-encoded](<https://en.wikipedia.org/wiki/POST_(HTTP)#Use_for_submitting_web_forms>) request bodies, returns JSON-encoded responses, and uses standard HTTP response codes, authentication, and verbs.

The ENTS backend API doesn’t support bulk updates. You can work on only one object per request. I.e., one data point can be updated per request.

## Authentication

The ENTS API handles users authentication using a [refresh token flow](https://cloudentity.com/developers/basics/oauth-grant-types/refresh-token-flow/). Users are given an access token to the API and a refresh token to designate access time. Currently, still under construction

For external devices ENTS backend plans utilize API Keys to authenticate requests

The authentication module is located under `auth`

### Protecting Endpoints

To add user authentication to endpoints, add an authentication decorator like so (based on Flask-RESTful syntax)

**Example:**

```Python
from auth import authenticate

class User_Data(Resource):
    method_decorators = [‘get’: authenticate]

    def get(self, user):
        user = User.get_user(user.id)
        return user_schema.dump(user)
```

## Resources

ENTS API utilizes [flaskRESTful](https://flask-restful.readthedocs.io/en/latest/) to abstract construction of a REST Api. Endpoints are imported into the app when the app is created and are stored under the `resources` folder

Resource authentication is handled by utilzing a [resource decorator](https://marshmallow.readthedocs.io/en/stable/quickstart.html#declaring-schemas) to control access to an endpoint

## Validation

For validatiaon, ENTS API utilizes [marshmallow](https://marshmallow.readthedocs.io/en/stable/index.html) to check if the request is formmated correctly and with the correct types. [Schemas](https://marshmallow.readthedocs.io/en/stable/quickstart.html#declaring-schemas) are created under the `schemas` folder and imported into various resources as needed.

## Async Workers

To handle long running tasks, ENTS API uses [Celery](https://docs.celeryq.dev/en/stable/getting-started/introduction.html) as a task queue and [Valkey](https://valkey.io/) as a message broker. A Celery worker configuration is handled under `backend/__init__.py` and is built under a seperate flag in the dockerfile named, prodworker and devworker.

## Rate Limiting

ENTS API uses a token-bucket limiter backed by Valkey/Redis. Limits are configured with environment variables in `.env` (see `.env.example`) and support per-endpoint rules such as:

- `heavy_read` for chart/query endpoints
- `ingest` for sensor ingestion endpoints
- `export_start` and `poll` for async CSV export flow
- `auth_token` and `auth_general` for auth endpoints

Core environment variables:

- `RATE_LIMIT_ENABLED`
- `RATE_LIMIT_STORAGE_URI`
- `RATE_LIMIT_TRUSTED_PROXY_COUNT`
- `RATE_LIMIT_<RULE>_CAPACITY`
- `RATE_LIMIT_<RULE>_REFILL_RATE`

`RATE_LIMIT_TRUSTED_PROXY_COUNT` controls how many proxy hops are trusted for client IP extraction. Keep it at `0` unless the app is behind known reverse proxies.

When a limit is exceeded the API returns `429` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Rule` headers.

## Testing

Testing is conducted using [pytest](https://github.com/pytest-dev/pytest) and [testing fixtures](https://flask.palletsprojects.com/en/3.0.x/testing/) are spun up within the factory app pattern. Flask uses the testing configuration as defined under `api/config.py`. The testing fixtures are defined under `tests/conftest.py`.

## Linting

Files are to be linted using [ruff](https://docs.astral.sh/ruff/).

After installing ruff run below to lint

```console
ruff check ./backend
```

## Formatting

Files are to be formatted using [black](https://github.com/psf/black).

After installing ruff run below to format

```console
black ./backend
```

## Docker Builds

There are two targets for building the api, `development` and `production`. In the development target, hot reload is available as well as the running flask in development mode (Debug logs print to stderr). In the production target, gunicorn is ran in front of flask and the env is set to production env vars.

## Production

To support the demands of deployment, ENTS API utilizes [gunicorn](https://gunicorn.org/) as a WSGI HTTP server. The configuration is located at `gunicorn.conf.py`. Gunicorn workers at set to scale according to `CPU_COUNT * 2 + 1` as per [gunicorn docs](https://docs.gunicorn.org/en/latest/design.html#how-many-workers). Monkey patching is also done for performance, which is patched before gunicorn. **Note: additional libraries need monkey patching support or you may encounter unintended errors**

## API Endpoints Reference

### Base URL
All API endpoints are prefixed with `/api`

### Authentication Endpoints

#### OAuth URL
```
GET /api/oauth/url
```
Returns the Google OAuth redirect URL for user authentication.

**Response:**
```json
{
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

#### Exchange Token
```
GET /api/auth/token?code={authorization_code}
```
Exchanges Google OAuth authorization code for access and refresh tokens.

**Query Parameters:**
- `code` (required): Authorization code from Google OAuth callback

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Check Login Status
```
GET /api/auth/logged_in
```
Checks if the current session is active.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "logged_in": true
}
```

#### Refresh Token
```
GET /api/auth/refresh
```
Refreshes the access token using the refresh token stored in cookies.

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### Logout
```
GET /api/auth/logout
```
Logs out the user by deleting active tokens.

**Response:**
```json
{
  "msg": "logout successful"
}
```

### Cell Management Endpoints

#### List Cells
```
GET /api/cell/
GET /api/cell/?user=true
```
Retrieves all cells or cells for the authenticated user.

**Query Parameters:**
- `user` (optional): If "true", returns only cells owned by authenticated user

**Headers (when user=true):**
- `Authorization: Bearer {access_token}`

**Response:**
```json
[
  {
    "id": 1,
    "name": "Cell-001",
    "location": "Field A",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "archive": false,
    "owner": "user@example.com",
    "tags": ["outdoor", "solar"]
  }
]
```

#### Get Cell by ID
```
GET /api/cell/{cellId}
```
Retrieves a specific cell by its ID.

**Path Parameters:**
- `cellId` (required): The cell ID

**Response:**
```json
{
  "id": 1,
  "name": "Cell-001",
  "location": "Field A",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "archive": false,
  "owner": "user@example.com",
  "tags": ["outdoor", "solar"]
}
```

#### Create Cell
```
POST /api/cell/
```
Creates a new cell.

**Headers:**
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Cell-002",
  "location": "Field B",
  "latitude": 40.7260,
  "longitude": -73.9897,
  "archive": false,
  "owner": "user@example.com",
  "tags": ["indoor", "battery"]
}
```

**Response:** Created cell object

#### Update Cell
```
PUT /api/cell/{cellId}
```
Updates an existing cell.

**Path Parameters:**
- `cellId` (required): The cell ID

**Headers:**
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Request Body:** Same as create, partial updates supported

**Response:** Updated cell object

#### Delete Cell
```
DELETE /api/cell/{cellId}
```
Deletes a cell (cascades to related data).

**Path Parameters:**
- `cellId` (required): The cell ID

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "message": "Cell deleted successfully"
}
```

### Data Upload Endpoints

**Note:** All sensor data (including power and TEROS measurements) should be uploaded through the generic sensor endpoint below.

#### Upload Sensor Data
```
POST /api/sensor/
```
Uploads all types of sensor data including power, TEROS, and generic sensors. Supports both JSON and binary protobuf formats.

**Supported Measurement Types:**
- `power` - Power measurements (voltage, current)
- `teros12` - TEROS soil sensor data
- `phytos31` - Leaf wetness sensor
- `bme280` - Environmental sensor (pressure, temperature, humidity)
- `teros21` - Matric potential sensor
- `co2` - CO2 sensor

**For JSON:**
**Headers:**
- `Content-Type: application/json`

**Request Body (Direct format):**
```json
{
  "type": "power",
  "loggerId": "LOGGER-001",
  "cellId": "Cell-001",
  "ts": 1705317000,
  "data": {
    "voltage": 12.5,
    "current": 2.3
  }
}
```

**Request Body (TTN LoRaWAN format):**
```json
{
  "end_device_ids": {
    "device_id": "sensor-001"
  },
  "uplink_message": {
    "decoded_payload": {
      "type": "bme280",
      "cellId": "Cell-001",
      "data": {
        "temperature": 25.5,
        "humidity": 65,
        "pressure": 1013.25
      }
    },
    "received_at": "2024-01-15T10:30:00Z"
  }
}
```

**For Binary:**
**Headers:**
- `Content-Type: application/octet-stream`

**Body:** Binary protobuf encoded measurement data

**Response:**
```json
{
  "message": "Sensor data uploaded successfully"
}
```

### Data Retrieval Endpoints

#### Get Power Data
```
GET /api/power/?cellId={cellId}&startTime={startTime}&endTime={endTime}&resample={resample}
GET /api/power/{cell_id}?startTime={startTime}&endTime={endTime}&resample={resample}
```
Retrieves power data with optional filtering and aggregation.

**Query Parameters:**
- `cellId` or path `cell_id`: Cell ID to filter by
- `startTime` (optional): ISO 8601 timestamp for range start
- `endTime` (optional): ISO 8601 timestamp for range end
- `resample` (optional): Aggregation level - "hour", "day", or "none"
- `stream` (optional): If "true", uses server timestamps for real-time data

**Response:**
```json
[
  {
    "ts": "2024-01-15T10:00:00Z",
    "voltage": 12.5,
    "current": 2.3,
    "cell_id": 1,
    "logger_id": 1
  }
]
```

#### Get TEROS Data
```
GET /api/teros/?cellId={cellId}&startTime={startTime}&endTime={endTime}&resample={resample}
GET /api/teros/{cell_id}?startTime={startTime}&endTime={endTime}&resample={resample}
```
Retrieves TEROS sensor data with optional filtering and aggregation.

**Query Parameters:** Same as power data

**Response:**
```json
[
  {
    "ts": "2024-01-15T10:00:00Z",
    "vwc_1": 0.25,
    "vwc_2": 0.23,
    "temp_1": 22.5,
    "temp_2": 22.3,
    "ec_1": 0.15,
    "ec_2": 0.14,
    "water_pot_1": -50.2,
    "water_pot_2": -48.7,
    "cell_id": 1
  }
]
```

#### Get Sensor Data
```
GET /api/sensor/?name={sensorName}&measurement={measurement}&cellId={cellId}&startTime={startTime}&endTime={endTime}
```
Retrieves generic sensor data.

**Query Parameters:**
- `name` (required): Sensor name
- `measurement` (required): Measurement type
- `cellId` (optional): Cell ID to filter by
- `startTime` (optional): ISO 8601 timestamp for range start
- `endTime` (optional): ISO 8601 timestamp for range end

**Response:**
```json
[
  {
    "ts": "2024-01-15T10:00:00Z",
    "value": 25.5,
    "sensor_id": 1,
    "measurement": "temperature",
    "unit": "C"
  }
]
```

#### Get Data Availability
```
GET /api/data-availability/?cellId={cellId}
```
Returns information about available data ranges for intelligent date selection.

**Query Parameters:**
- `cellId` (optional): Filter by specific cell

**Response:**
```json
{
  "power": {
    "earliest": "2023-01-01T00:00:00Z",
    "latest": "2024-01-15T12:00:00Z",
    "count": 150000
  },
  "teros": {
    "earliest": "2023-06-01T00:00:00Z",
    "latest": "2024-01-15T12:00:00Z",
    "count": 75000
  },
  "sensors": {
    "temperature": {
      "earliest": "2023-03-01T00:00:00Z",
      "latest": "2024-01-15T12:00:00Z",
      "count": 120000
    }
  }
}
```

### Export Endpoints

#### Export Cell Data as CSV
```
GET /api/cell/datas?cell_ids={cellIds}&startTime={startTime}&endTime={endTime}
```
Initiates an asynchronous CSV export of all data for specified cells.

**Query Parameters:**
- `cell_ids` (required): Comma-separated list of cell IDs
- `startTime` (optional): ISO 8601 timestamp for range start
- `endTime` (optional): ISO 8601 timestamp for range end

**Response:**
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### Check Export Status
```
GET /api/status/{task_id}
```
Checks the status of an asynchronous task.

**Path Parameters:**
- `task_id` (required): Task ID from export endpoint

**Response (Pending):**
```json
{
  "state": "PENDING",
  "current": 0,
  "total": 1,
  "status": "Pending..."
}
```

**Response (Success):**
```json
{
  "state": "SUCCESS",
  "current": 1,
  "total": 1,
  "status": "Task completed!",
  "result": "timestamp,cell_name,voltage,current,vwc_1,...\n2024-01-15 10:00:00,Cell-001,12.5,2.3,0.25,..."
}
```

### User Endpoints

#### Get User Profile
```
GET /api/user
```
Retrieves the authenticated user's profile.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "given_name": "John",
  "family_name": "Doe",
  "picture": "https://example.com/photo.jpg"
}
```

#### Update User Profile
```
PUT /api/user
```
Updates the authenticated user's profile.

**Headers:**
- `Authorization: Bearer {access_token}`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Jane Doe"
}
```

**Response:** Updated user object

### System Endpoints

#### Health Check
```
GET /api/
```
Basic health check endpoint.

**Response:**
```json
{
  "message": "I'm alive and healthy!"
}
```

#### Get Session Info
```
GET /api/session
```
Retrieves current session information.

**Headers:**
- `Authorization: Bearer {access_token}`

**Response:**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "expires_at": "2024-01-15T11:00:00Z"
}
```

## API Architecture and Data Flow

### Authentication Flow
1. Client requests OAuth URL from `/api/oauth/url`
2. User authenticates with Google
3. Google redirects with authorization code
4. Client exchanges code for tokens at `/api/auth/token`
5. Access token (15 min) used for API requests
6. Refresh token (1 day) stored as httpOnly cookie
7. Client refreshes access token via `/api/auth/refresh`

### Data Model Relationships
```
User ─┬─< Cell ─┬─< PowerData (via sensor endpoint type="power")
      │         ├─< TEROSData (via sensor endpoint type="teros12")
      │         └─< Sensor ─< Data (via sensor endpoint for other types)
      │
      └─< RefreshToken

Logger ─< PowerData

Cell >─< Tag (many-to-many)
```

**Data Storage by Measurement Type:**
- `power` measurements → PowerData table
- `teros12` measurements → TEROSData table  
- All other sensor types → Generic Sensor/Data tables

### Data Upload Flow
1. All IoT devices send data to the `/api/sensor/` endpoint
2. The endpoint processes different measurement types:
   - Power data → stored in PowerData table
   - TEROS data → stored in TEROSData table
   - Other sensors → stored in generic Sensor/Data tables
3. System creates Cell/Logger/Sensor entities if needed
4. Data stored with both measurement timestamp and server timestamp
5. Supports multiple formats:
   - JSON for direct uploads
   - TTN webhook format for LoRaWAN devices
   - Binary protobuf for efficient transmission

### Data Retrieval Flow
1. Clients query data with filters (time range, cell, aggregation)
2. System performs time-series queries with optional aggregation
3. Supports streaming mode for real-time data
4. Returns data in consistent JSON format

### Asynchronous Processing
1. Long-running tasks (e.g., CSV export) create Celery tasks
2. Tasks processed by Celery workers with Redis message broker
3. Clients poll task status via `/api/status/{task_id}`
4. Completed tasks return results in status response

### Error Handling
- Standard HTTP status codes used throughout
- 401 Unauthorized for authentication failures
- 404 Not Found for missing resources
- 400 Bad Request for validation errors
- 500 Internal Server Error for server issues

### CORS Configuration
- All origins allowed (configured for development)
- All methods supported (GET, POST, PUT, DELETE, OPTIONS)
- Credentials supported for cookie-based refresh tokens
