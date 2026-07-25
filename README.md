# Lead Platform

A production-oriented lead management app for small sales teams — not just a form.

- **Public capture form** for inbound leads
- **Authenticated workspace** with **admin** and **member** roles (enforced on client and server)
- **Lead lifecycle**: status pipeline, assignment, timestamped notes, activity trail
- **JSON API** with pagination, filtering, and documented status codes
- **Automated tests** for auth rules and core flows
- Deployable on free tiers (MongoDB Atlas + Render + Vercel)

## Repository layout

```
Backend/    Node.js, Express, MongoDB API
Frontend/   Next.js (App Router) UI
```

## Demo credentials

| Role   | Email                     | Password    |
|--------|---------------------------|-------------|
| Admin  | `admin@leadplatform.com`  | `Admin123!` |
| Member | `member@leadplatform.com` | `Member123!` |

Created by `npm run seed` in `Backend/`.

## Local development

### Prerequisites

- Node.js 18+
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### Backend

```bash
cd Backend
cp .env.example .env
npm install
npm run seed
npm run dev
```

API: `http://localhost:5000`  
Full endpoint docs: [Backend/README.md](Backend/README.md)

### Frontend

```bash
cd Frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

Set `NEXT_PUBLIC_API_URL` to the API base URL (default `http://localhost:5000`).

### Tests

```bash
cd Backend
npm test
```

Tests use local MongoDB at `mongodb://127.0.0.1:27017/lead-platform-test`.
## Product features

1. **Public** `/capture` posts to `POST /api/public/leads` (rate-limited).
2. **Login** issues a JWT; the SPA stores it and sends `Authorization: Bearer`.
3. **Admin** sees all leads, assigns owners, deletes leads, lists users.
4. **Member** sees only assigned leads; can update status and add notes on those leads.
5. Detail view shows notes (with timestamps) and a full activity trail.

## Deploy (free tier)

| Piece    | Suggested free host |
|----------|---------------------|
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| API      | [Render](https://render.com) — root `Backend/` |
| UI       | [Vercel](https://vercel.com) — root `Frontend/` |

### API (Render)

Environment:

- `NODE_ENV=production`
- `MONGODB_URI` — Atlas URI
- `JWT_SECRET` — long random string
- `CORS_ORIGIN` — your Vercel URL (comma-separated if multiple)

Start command: `npm start`

Then seed demo users once against Atlas: `npm run seed`.

### UI (Vercel)

Environment:

- `NEXT_PUBLIC_API_URL` — Render API URL (no trailing slash)

## Live deployment

After you connect Atlas / Render / Vercel (and push this repo to GitHub), record:

- **App URL:** _https://lead-management-platform-nine.vercel.app/_
- **API URL:** _https://lead-management-platform-server.onrender.com_
- **API docs:** `Backend/README.md` in this repo

Use the demo credentials above for each role.

Built for Digital Heroes Training Task
