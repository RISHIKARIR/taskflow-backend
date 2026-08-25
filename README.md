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

## Architecture

```
Client → Express Routes → Controllers → Services → Sequelize Models → PostgreSQL
                                             │
                                             └──> BullMQ Queue → Redis → Worker process → Mock email
```

- **Layered architecture:** Route → Controller → Service → Model, keeping
  HTTP concerns, business logic, and data access separated.
- **API service and Worker service run as separate processes** (separate
  Docker containers), sharing the same codebase and Redis connection.
  The API enqueues jobs; the worker consumes and processes them
  independently, so slow/failing email delivery never blocks API
  requests.
- **JWT-based authentication** — access tokens (15 min TTL) carry the
  user's id, email, `orgId`, and `role`; refresh tokens (7 days) are
  stored (hashed) in the database with revocation support.
- **Organization-scoped RBAC** — two roles, `org_admin` and `member`.
  Admins can delete projects and manage organization members.
- **Multi-tenant isolation** — every service-layer query is scoped by
  the `org_id` taken from the verified JWT, never from client input.
  Attempts to access a resource belonging to another organization
  return `403 Forbidden` without revealing whether the resource exists.

## Database Design

Tables: `users`, `organizations`, `org_members`, `Projects`, `Tasks`,
`TaskAssignments`, `Comments`, `Refreshtokens`.

- `org_members` links `users` ↔ `organizations` and carries the `role`
  enum (`org_admin` / `member`).
- `Projects.organization_id` → `organizations` (project ownership).
- `Tasks.project_id` → `Projects` (a task's organization is derived
  through its project, not stored redundantly on the task).
- `TaskAssignments` references both `Tasks` and `users` — this is the
  many-to-many join table for task assignees.
- `Comments` references both `Tasks` and `users` (author).
- Foreign keys use `CASCADE` on delete (e.g. deleting a task cascades
  its assignments/comments; deleting an organization cascades its
  memberships) since child rows are meaningless without their parent.
- `status` and `priority` on `Tasks` are native PostgreSQL enums
  (`todo/in_progress/review/done`, `low/medium/high/urgent`), enforced
  at the database level.
- Migrations are managed with Sequelize CLI (`up`/`down` supported);
  no hand-maintained `schema.sql`.

## Background Jobs — Task Assignment Notifications

When a task is assigned:

1. The `TaskAssignment` row is persisted in PostgreSQL first.
2. An email notification job is enqueued in BullMQ (Redis-backed).
3. The API responds immediately after step 1 and 2 — email delivery
   itself happens asynchronously in the separate worker process and
   never blocks the request.

**Consistency strategy:** the assignment write and the job enqueue are
two separate operations. If enqueueing fails (e.g. Redis is briefly
unavailable), the already-committed assignment is **not** rolled back
— it is a valid, correct database write on its own. The enqueue failure
is caught and logged instead. This was a deliberate tradeoff: failing a
correct assignment just because a notification could not be queued
would be worse than occasionally missing a notification, which can be
retried or reconciled separately.

**Retry behavior:**
- 3 attempts per job
- Exponential backoff: 1s → 2s → 4s
- After all retries are exhausted, the job is kept in the queue with
  `removeOnFail: false` instead of being discarded — this is the
  dead-letter behavior. `GET /jobs/:id` reports these as
  `status: "failed"` along with the failure reason.

## Testing

- **Unit tests** (no database required):
  - Pagination helper (`tests/unit/pagination.test.js`)
  - Task creation/assignment validation logic
    (`tests/unit/taskValidator.test.js`)
  - Auth logic — bcrypt hashing/comparison, JWT sign/verify/expiry
    (`tests/unit/authLogic.test.js`)
- **Integration tests:**
  - Login flow (`tests/integration/auth.test.js`)
  - Task CRUD, cross-tenant access → 403, validation error responses
    (`tests/integration/taskCrud.test.js`)
- **Test isolation strategy:** a dedicated test database
  (`taskflow_test_db`, separate from the dev database) is used, and all
  tables are truncated after every test (`tests/helpers/testDb.js`).
  This guarantees each test starts from a clean, known state without
  needing transaction-rollback plumbing through the whole request
  lifecycle.

Run tests:
```bash
npm test
```

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
