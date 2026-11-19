# Employee ID server

MongoDB-backed company departments, membership auth, and approval-gated
employee submissions.

## Working now

- MongoDB connection
- Session auth bound to `Membership` (httpOnly cookie)
- Default company departments as DB records with stable IDs:
  Engineering, Business, Design, Marketing, Human Resources
- `GET /api/departments` (auth) — dropdown source from DB
- `POST /api/employees/submissions` (auth) — create/update pending card
- `GET /api/employees/pending` (admin)
- `POST /api/employees/:id/decision` (admin) — approve | reject
- `GET /api/employees/published` (auth) — approved-only safety list

Pending and rejected cards are excluded from `/api/employees/published`.

## Not in this milestone

- Rotating rack feed
- SSE realtime updates
- Frontend wiring away from localStorage

## Configuration (server `.env` only)

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Mongo connection string (**never** ship to the Vite client) |
| `AUTH_SECRET` | ≥ 32 char session signing secret |
| `CLIENT_ORIGIN` | CORS origin (default `http://localhost:5173`) |
| `PORT` | API port (default `4000`) |

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Seeded logins

- `admin@northline.co` / `Northline!Dev1` (admin)
- `member@northline.co` / `Northline!Dev1` (member)
