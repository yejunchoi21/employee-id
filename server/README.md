# Employee ID server

MongoDB-backed company departments, membership auth, admin-provisioned
employee accounts, help requests, and approval-gated employee submissions.

## Working now

- MongoDB connection
- Session auth bound to `Membership` (httpOnly cookie)
- Admin-only `POST /api/admin/employee-accounts` (creates member account + linked profile)
- Password change with first-login enforcement (`mustChangePassword`)
- Default company departments as DB records with stable IDs
- Help-request APIs with sender/recipient access control
- Employee submission + approval APIs

Pending and rejected cards are excluded from `/api/employees/published`.

## First admin (when none exists)

If the database has **no admin membership yet**, bootstrap one:

```bash
cd server
cp .env.example .env   # if needed
npm install
npm run bootstrap-admin -- --email=admin@northline.co --password=TempAdminPass1 --name="Northline Admin"
```

From the repo root:

```bash
npm run bootstrap-admin -- --email=admin@northline.co --password=TempAdminPass1 --name="Northline Admin"
```

Then sign in and **change the temporary password** immediately. The command
refuses to run if an admin already exists.

### Optional demo seed

`npm run seed` still provisions local demo admin/member accounts with a known
dev password (`Northline!Dev1`) and `mustChangePassword: false`. Prefer
`bootstrap-admin` + admin account creation for realistic testing.

## Create employee accounts (admin UI / API)

Only admins can create accounts. New accounts:

- default to the `member` role
- receive a hashed initial password (`mustChangePassword: true`)
- are linked to an approved employee profile (email uniqueness enforced)

```http
POST /api/admin/employee-accounts
```

Body includes email, displayName, initialPassword, departmentId, and profile
fields (title, office, joined, phone, manager, bio, skills).

Password hashes are never returned in API responses.

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
npm run bootstrap-admin -- --email=admin@northline.co --password=TempAdminPass1 --name="Northline Admin"
npm run dev
```
