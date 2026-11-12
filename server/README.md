# Employee ID server foundation

MongoDB-backed foundation for company-scoped departments, membership auth,
and approval-gated employee cards.

## Working now

- MongoDB connection (`/health`)
- Models: `Company`, `Department`, `Membership`, `Employee`
- Session auth bound to `Membership` (httpOnly cookie)
- `companyId` / `role` come from the authenticated membership, not form fields
- Seeded Northline departments + admin/member accounts

## Not implemented yet

- Pending employee submission API
- Admin approval API
- Company department listing for signup dropdown
- SSE realtime fan-out
- Frontend wiring away from localStorage toward this API

## Configuration (server only)

Copy `.env.example` to `.env` and set:

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Mongo connection string (**never** put this in the Vite client) |
| `AUTH_SECRET` | >= 32 char secret for signing session cookies |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (default `http://localhost:5173`) |
| `PORT` | API port (default `4000`) |

## Setup

```bash
cp .env.example .env
npm install
npm run seed
npm run dev
```

### Seeded login accounts (local/dev)

- `admin@northline.co` / `Northline!Dev1` (admin)
- `member@northline.co` / `Northline!Dev1` (member)

### Auth endpoints

- `POST /api/auth/login` `{ email, password }` → sets httpOnly session cookie
- `GET /api/auth/me` → returns membership (`companyId`, `role`, …)
- `POST /api/auth/logout` → clears session cookie

## Next milestone

Pending employee submission + admin approval so an Engineering card can be
approved and later streamed into company rotations.
