# Files Manager

## Description

Files Manager is a summary project of the Back-End trimester at Holberton School, combining several core back-end concepts into a single platform: authentication, Node.js, MongoDB, Redis, pagination, and background processing.

The goal of the project is to build a simple platform to upload and view files, implementing the following features:

- User authentication via a token
- List all files
- Upload a new file
- Change permission of a file
- View a file
- Generate thumbnails for images

Each task builds on the previous one, progressively assembling a complete file management back-end.

## Learning Objectives

- How to create an API with Express
- How to authenticate a user
- How to store data in MongoDB
- How to store temporary data in Redis
- How to set up and use a background worker with Bull

## Technologies

- Node.js
- Express
- MongoDB (via the `mongodb` driver)
- Redis (via the `redis` package)
- Bull (job queue for background processing)
- image-thumbnail (thumbnail generation)
- mime-types (MIME type detection)

## Project Structure

```
.
├── controllers/
│   ├── AppController.js
│   ├── AuthController.js
│   ├── UsersController.js
│   └── FilesController.js
├── routes/
│   └── index.js
├── utils/
│   ├── redis.mjs
│   └── db.mjs
├── server.js
├── worker.js
├── package.json
└── .env
```

## Environment Variables

| Variable      | Description                          | Default            |
|---------------|---------------------------------------|---------------------|
| `PORT`        | Port the Express server listens on    | `5000`              |
| `DB_HOST`     | MongoDB host                          | `localhost`         |
| `DB_PORT`     | MongoDB port                          | `27017`             |
| `DB_DATABASE` | MongoDB database name                 | `files_manager`     |
| `FOLDER_PATH` | Local folder used to store files      | `/tmp/files_manager`|

## API Endpoints

### App status

- `GET /status` — returns whether Redis and the DB are alive
- `GET /stats` — returns the number of users and files in the DB

### Users

- `POST /users` — creates a new user (`email`, `password`)
- `GET /users/me` — retrieves the authenticated user

### Authentication

- `GET /connect` — signs in a user (Basic auth) and returns a token
- `GET /disconnect` — signs out a user based on the token

### Files

- `POST /files` — creates a new file (or folder) in DB and on disk
- `GET /files/:id` — retrieves a file document by ID
- `GET /files` — lists a user's files, filterable by `parentId`, paginated
- `PUT /files/:id/publish` — sets a file's `isPublic` to `true`
- `PUT /files/:id/unpublish` — sets a file's `isPublic` to `false`
- `GET /files/:id/data` — returns the content of a file (supports `size` query parameter for thumbnails: `100`, `250`, `500`)

## Background Processing

A `worker.js` process uses a Bull queue (`fileQueue`) to generate three thumbnails (widths 500, 250, and 100) whenever a new image file is uploaded, storing them alongside the original file.

## Authentication Flow

1. `GET /connect` with Basic auth (`Authorization: Basic <base64(email:password)>`) returns a token.
2. The token is stored in Redis as `auth_<token>` for 24 hours, mapped to the user ID.
3. Subsequent authenticated requests include the header `X-Token: <token>`.
4. `GET /disconnect` removes the token from Redis, ending the session.

## Usage

Start the server:

```bash
npm run start-server
```

Start the worker (for thumbnail generation):

```bash
npm run start-worker
```

## Author

Stan QUEUNIEZ - Holberton School — Files Manager project