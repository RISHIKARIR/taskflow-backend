# TaskFlow Backend

A multi-tenant project management API — organizations, projects, tasks,
task assignments, and asynchronous email notifications on assignment.

## Tech Stack

- **Language:** Node.js / Express
- **Database:** PostgreSQL (via Sequelize ORM + Sequelize CLI migrations)
- **Job Queue:** Redis + BullMQ
- **Containers:** Docker Compose (API, Worker, PostgreSQL, Redis)
- **Auth:** JWT (access + refresh tokens), bcrypt password hashing
- **Testing:** Jest + Supertest
- **API Docs:** OpenAPI 3.0 (Swagger UI)

## Setup Instructions

### 1. Clone the repo
```bash
git clone <repo-url>
cd taskflow-backend
```

### 2. Environment variables

Create a `.env` file in the project root with:

```
DB_USER=taskflow
DB_PASSWORD=<your_db_password>
DB_NAME=taskflow_db
DB_HOST=postgres
DB_PORT=5432
REDIS_URL=redis://redis:6379
JWT_SECRET=<your_jwt_secret>
JWT_REFRESH_SECRET=<your_jwt_refresh_secret>
PORT=3000
```

> Do not commit `.env` — it is gitignored. No real secrets are committed
> to this repository.

### 3. Start all services

```bash
docker compose up -d --build
```

This starts 4 containers: `api`, `worker`, `postgres`, `redis`.

### 4. Run migrations and seed data

```bash
docker compose exec api npx sequelize-cli db:migrate
docker compose exec api npx sequelize-cli db:seed:all
```

### 5. Access the app

- API base URL: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`

### 6. Seeded test users

All seeded users share the password `Password123!`:

| Email | Role | Organization |
|---|---|---|
| alice@taskflow.dev | org_admin | Acme Corp |
| bob@taskflow.dev | member | Acme Corp |
| charlie@taskflow.dev | member | Acme Corp & Globex Inc |
| diana@taskflow.dev | member | Globex Inc |
| ethan@taskflow.dev | member | Globex Inc |
## API Documentation

- OpenAPI 3.0 spec: `openapi.js`
- Interactive Swagger UI: `http://localhost:3000/api-docs`
- Postman collection: `postman_collection.json` (import directly, no
  manual edits needed — set the `Authorization` header per request
  after logging in)

## Security Notes

- Passwords are hashed with bcrypt at a cost factor of 12.
- JWTs are signed with secrets provided via environment variables, not
  committed to the repo.
- Refresh tokens are stored hashed (SHA-256) in the database, with a
  `revoked` flag for logout support.
- Auth endpoints (`/auth/register`, `/auth/login`, `/auth/refresh`,
  `/auth/logout`) are rate-limited to 10 requests/minute/IP.
- No `.env` file, credentials, or secrets are committed to this
  repository.

## Known Limitations (time-boxed submission)

The following bonus/optional items were not completed given the
assignment's time constraints:

- Soft delete (`deleted_at`) on projects/tasks — the current schema
  uses hard deletes instead.
- PostgreSQL full-text search on task title/description.
- Refresh token rotation and "logout all devices" bonus flows.
- Assignment deduplication window and global email rate limiting
  bonuses.
- Automated test coverage report generation.

Everything in the core (non-bonus) requirements across Tasks 01–05 is
implemented and manually verified end-to-end via Postman and the test
suite described above.
