# TaskFlow — Architecture Document

## Overview

TaskFlow is a multi-tenant project management backend where users belong
to organizations, create projects, manage tasks, assign work to
teammates, and receive asynchronous email notifications when a task is
assigned to them.

## Components

| Component | Technology | Responsibility |
|---|---|---|
| API server | Node.js / Express | HTTP layer — auth, CRUD, validation, org-scoped access control |
| Worker | Node.js (BullMQ worker) | Consumes queued jobs, sends (mocked) assignment emails asynchronously |
| Database | PostgreSQL (Sequelize ORM) | Persistent storage — users, organizations, projects, tasks, assignments, comments, refresh tokens |
| Queue | Redis + BullMQ | Job queue connecting the API (producer) and Worker (consumer) |
| Containers | Docker Compose | Orchestrates all 4 services together for local/dev deployment |

## System Diagram

```
                         ┌─────────────────────┐
                         │       Client         │
                         │ (Postman / Frontend) │
                         └──────────┬───────────┘
                                    │ HTTP + JWT
                                    ▼
                         ┌─────────────────────┐
                         │     API Server       │
                         │ Route → Controller → │
                         │  Service → Model     │
                         └───┬──────────────┬───┘
                              │              │
                     Sequelize│              │BullMQ .add()
                              ▼              ▼
                    ┌──────────────┐  ┌─────────────┐
                    │  PostgreSQL  │  │    Redis     │
                    │  (data store)│  │ (job queue)  │
                    └──────────────┘  └──────┬──────┘
                                              │ job consumed
                                              ▼
                                     ┌─────────────────┐
                                     │  Worker process  │
                                     │ (separate         │
                                     │  container)       │
                                     │ sends mock email   │
                                     └─────────────────┘
```

## Data Flow — Task Assignment (core async flow)

1. Client sends `POST /tasks/:id/assign` with a JWT and `{ userId }`.
2. JWT middleware verifies the token and attaches `{ id, orgId, role }`
   to the request — the client never supplies `orgId` directly.
3. The service layer:
   a. Confirms the task belongs to a project within the caller's
      organization (403 otherwise, without leaking task data).
   b. Confirms the assignee belongs to the same organization.
   c. Persists the `TaskAssignment` row in PostgreSQL.
   d. Enqueues an email job into BullMQ (Redis-backed).
4. The API immediately returns `201` — it does **not** wait for the
   email to actually be sent.
5. Independently, the Worker process picks the job off the queue,
   looks up the task/user, and "sends" the (mocked) email.
6. If the job fails, BullMQ retries it up to 3 times with exponential
   backoff (1s → 2s → 4s). After exhausting retries, the job remains in
   Redis in a `failed` state (acting as a dead-letter queue) instead of
   being discarded, and is queryable via `GET /jobs/:id`.

## Data Flow — Authenticated Request (multi-tenant isolation)

1. Every protected route runs through JWT auth middleware first.
2. The middleware decodes the token and looks up the user's
   organization membership and role, attaching `{ id, orgId, role }`
   to `req.user`.
3. Every service-layer query filters by `req.user.orgId` — this value
   comes only from the verified token, never from the request body,
   query string, or URL params.
4. If a requested resource exists but belongs to a different
   organization, the API returns `403 Forbidden` with no resource
   details in the response body (as opposed to `404`, which is
   reserved for resources that genuinely don't exist at all).
5. Role-gated routes (e.g. deleting a project, managing organization
   members) additionally require `role === "org_admin"`.

## Database Schema (summary)

- `users` — account credentials
- `organizations` — tenant boundary
- `org_members` — join table between `users` and `organizations`,
  carries the `role` enum (`org_admin` | `member`)
- `Projects` — belongs to an `organization`
- `Tasks` — belongs to a `Project` (organization is derived through the
  project, not duplicated on the task)
- `TaskAssignments` — join table between `Tasks` and `users`
- `Comments` — belongs to both a `Task` and a `user` (author)
- `Refreshtokens` — hashed refresh tokens with `revoked` flag and
  expiry, for logout/revocation support

Foreign keys cascade on delete where child records are meaningless
without their parent (e.g. deleting an organization cascades its
memberships; deleting a task cascades its assignments and comments).

## Key Technical Decisions

- **Separate API and Worker processes** rather than processing emails
  inline: keeps request latency independent of email delivery time and
  allows the worker to be scaled or restarted independently.
- **Assignment-first, enqueue-second with no rollback on enqueue
  failure**: a valid assignment should not fail just because the
  notification queue is temporarily unavailable. The tradeoff is a
  possible missed notification in a rare failure window, which is
  preferable to blocking or failing legitimate writes.
- **Org ID always derived from the JWT, never from client input**:
  eliminates an entire class of tenant-isolation bugs where a client
  could pass another organization's ID directly.
- **403 vs 404 distinction on cross-tenant access**: returning 403
  (rather than a generic 404) is explicit about the reason for denial
  while still not revealing the resource's actual contents.
- **Dedicated test database + truncation** over per-test transactions:
  faster to implement correctly under time constraints while still
  giving each test a clean, deterministic starting state.
