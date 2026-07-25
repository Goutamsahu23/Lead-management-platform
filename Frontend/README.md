# Lead Platform — Frontend

Next.js App Router UI for the Lead Platform API.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` must point at the Express API (e.g. `http://localhost:5000`).

## Routes

| Path | Access |
|------|--------|
| `/` | Public landing |
| `/capture` | Public lead form |
| `/login` | Team login |
| `/dashboard` | Authenticated |
| `/leads` | Authenticated list + filters |
| `/leads/[id]` | Detail, status, notes, activity |
| `/users` | Admin only |

## Deploy (Vercel)

1. Import the monorepo; set root directory to `Frontend`.
2. Set `NEXT_PUBLIC_API_URL` to the deployed API URL.
3. Ensure the API `CORS_ORIGIN` includes the Vercel domain.

Built for Digital Heroes Training Task
