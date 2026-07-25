# Lead Platform — API

Express + MongoDB JSON API for a small sales team's lead lifecycle: capture, assign, status pipeline, notes, and activity trail.

## Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT Bearer auth
- Zod validation
- Jest + Supertest

## Quick start

```bash
cp .env.example .env
# set MONGODB_URI and JWT_SECRET

npm install
npm run seed
npm run dev
```

API defaults to `http://localhost:5000`.

### Demo users (from seed)

| Role   | Email                     | Password    |
|--------|---------------------------|-------------|
| Admin  | admin@leadplatform.com    | Admin123!   |
| Member | member@leadplatform.com   | Member123!  |

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `npm run dev`  | Start with `--watch`       |
| `npm start`    | Production start           |
| `npm test`     | Auth + core flow tests     |
| `npm run seed` | Upsert demo admin/member   |

## Roles and permissions

| Capability                         | Admin | Member        |
|------------------------------------|-------|---------------|
| Login / `GET /api/auth/me`         | yes   | yes           |
| List leads                         | all   | assigned only |
| Create lead (authenticated)        | yes   | yes           |
| Public capture                     | open (rate-limited) | |
| Update lead fields / status        | any   | assigned only |
| Assign / reassign                  | yes   | no            |
| Delete lead                        | yes   | no            |
| Notes / activities                 | any   | assigned only |
| List users                         | yes   | no            |

## Lead statuses

`new` → `contacted` → `qualified` → `won` | `lost`

## Error shape

```json
{
  "message": "Human-readable error",
  "errors": [{ "path": "email", "message": "Invalid email" }]
}
```

Common status codes: `200`, `201`, `400`, `401`, `403`, `404`, `429`, `500`.

---

## API reference

Base URL: `/api`

### Health

#### `GET /health`

Unauthenticated. Returns `{ "status": "ok" }`.

---

### Auth

#### `POST /api/auth/login`

**Body**

```json
{ "email": "admin@leadplatform.com", "password": "Admin123!" }
```

**200**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "name": "Admin User",
    "email": "admin@leadplatform.com",
    "role": "admin"
  }
}
```

**401** Invalid credentials.

#### `GET /api/auth/me`

**Headers:** `Authorization: Bearer <token>`

**200** `{ "user": { ... } }`

**401** Missing/invalid token.

#### `PATCH /api/auth/me`

Any authenticated user (admin or member) can update their own profile.

**Body** (any subset)

```json
{
  "name": "Member User",
  "email": "member@leadplatform.com",
  "currentPassword": "Member123!",
  "password": "NewPassword123!"
}
```

- Role cannot be changed here.
- `currentPassword` is required when setting a new `password`.

**200** `{ "user": { ... } }`  
**400** Validation / incorrect current password / duplicate email.

---

### Public capture

#### `POST /api/public/leads`

No auth. Rate-limited.

**Body**

```json
{
  "name": "Jane Doe",
  "email": "jane@acme.com",
  "phone": "555-0100",
  "company": "Acme",
  "source": "website"
}
```

**201** `{ "data": <lead> }` — status `new`, activity `created`.

**400** Validation error. **429** Too many submissions.

---

### Leads (JWT required)

All routes below require `Authorization: Bearer <token>`.

#### `GET /api/leads/dashboard/stats`

**200**

```json
{
  "data": {
    "total": 12,
    "unassigned": 3,
    "statusCounts": {
      "new": 4,
      "contacted": 3,
      "qualified": 2,
      "won": 2,
      "lost": 1
    }
  }
}
```

Members only see counts for leads assigned to them (`unassigned` is `0`).

#### `GET /api/leads`

Query params:

| Param         | Description                                      |
|---------------|--------------------------------------------------|
| `page`        | Page number (default `1`)                        |
| `limit`       | Page size 1–100 (default `10`)                   |
| `status`      | One of lead statuses                             |
| `assignedTo`  | User id, or `unassigned` (admin only)            |
| `q`           | Case-insensitive search on name, email, company  |

**200**

```json
{
  "data": [ /* leads */ ],
  "page": 1,
  "limit": 10,
  "total": 25,
  "totalPages": 3
}
```

Members always receive only their assigned leads.

#### `POST /api/leads`

Authenticated create (source defaults to `manual`).

- **Members:** lead is auto-assigned to the creating member.
- **Admins:** optional body field `assignedTo` (user id); otherwise unassigned.

**201** `{ "data": <lead> }`

#### `GET /api/leads/:id`

**200** `{ "data": <lead> }`  
**403** Member accessing unassigned/other lead.  
**404** Missing lead.

#### `PATCH /api/leads/:id`

Partial update. Any of: `name`, `email`, `phone`, `company`, `source`, `status`, `assignedTo` (`string` id or `null`).

Assignment changes are **admin-only** (`403` for members).

Status and assignment changes append activity records.

**200** `{ "data": <lead> }`

#### `DELETE /api/leads/:id`

Admin only. Cascades notes and activities.

**200** `{ "message": "Lead deleted" }`  
**403** Non-admin.

#### `GET /api/leads/:id/notes`

**200** `{ "data": [ /* notes with author */ ] }`

#### `POST /api/leads/:id/notes`

**Body** `{ "body": "Called the prospect" }`

**201** `{ "data": <note> }` — also logs `note_added` activity.

#### `GET /api/leads/:id/activities`

**200** `{ "data": [ /* activities newest first */ ] }`

Activity `type` values: `created`, `status_changed`, `assigned`, `note_added`.

---

### Users

#### `GET /api/users`

Admin only. Used for assignment dropdowns.

**200** `{ "data": [ { "id", "name", "email", "role" } ] }`  
**403** Non-admin.

#### `POST /api/users`

Admin only. Create a team user for assignment.

**Body**

```json
{
  "name": "Sam Seller",
  "email": "sam@leadplatform.com",
  "password": "Member123!",
  "role": "member"
}
```

**201** `{ "data": { "id", "name", "email", "role" } }`  
**400** Duplicate email / validation error.  
**403** Non-admin.

#### `PATCH /api/users/:id`

Admin only. Update name, email, role, and optionally password.

**Body** (any subset)

```json
{
  "name": "Sam Seller",
  "email": "sam@leadplatform.com",
  "role": "member",
  "password": "NewPassword123!"
}
```

Omit `password` to leave it unchanged. Cannot demote the last admin.

**200** `{ "data": { "id", "name", "email", "role" } }`  
**400** Validation / last-admin demotion / duplicate email.  
**403** Non-admin.  
**404** User not found.

---

## Deployment (Render)

1. Create a MongoDB Atlas free cluster; copy the connection string.
2. New Render **Web Service** from this `Backend/` folder.
3. Build: `npm install` — Start: `npm start`
4. Env vars:
   - `NODE_ENV=production`
   - `MONGODB_URI=...`
   - `JWT_SECRET=<long random>`
   - `CORS_ORIGIN=https://your-frontend.vercel.app`
   - `PORT` is set by Render
5. After first deploy, run seed once (Render shell or locally against Atlas):

```bash
MONGODB_URI=... npm run seed
```

## Tests

Requires local MongoDB running.

```bash
npm test
```

Uses `mongodb://127.0.0.1:27017/lead-platform-test` (override with `TEST_MONGODB_URI`).

Coverage includes auth/RBAC rules and two core flows: public capture, and assign → status → note → filter.

Built for Digital Heroes Training Task
