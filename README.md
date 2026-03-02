# Vehicle Rental System

Backend API for a vehicle rental management system with vehicles, customers, bookings, and role-based authentication (Admin and Customer).

## Tech Stack

- **Node.js** + **TypeScript**
- **Express.js** (web framework)
- **PostgreSQL** (database)
- **bcrypt** (password hashing)
- **jsonwebtoken** (JWT authentication)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `PORT` – server port (default `3000`)
   - `JWT_SECRET` – secret for signing JWTs
   - `DATABASE_URL` – PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/vehicle_rental_db`)

3. **Database**

   Tables are created automatically when you start the server (from `src/db/schema.sql`). Ensure your DB exists and `DATABASE_URL` is set.

4. **Run**

   ```bash
   npm run dev
   ```

   Or build and run:

   ```bash
   npm run build
   npm start
   ```

## API Base

All API routes are under **`/api/v1`**.

### Authentication

- `POST /api/v1/auth/signup` – Register (body: name, email, password, phone, role?)
- `POST /api/v1/auth/signin` – Login (body: email, password) → returns `token` and `user`

Protected routes use header: `Authorization: Bearer <token>`.

### Vehicles

- `POST /api/v1/vehicles` – Create (Admin only)
- `GET /api/v1/vehicles` – List all (public)
- `GET /api/v1/vehicles/:vehicleId` – Get one (public)
- `PUT /api/v1/vehicles/:vehicleId` – Update (Admin only)
- `DELETE /api/v1/vehicles/:vehicleId` – Delete (Admin only; no active bookings)

### Users

- `GET /api/v1/users` – List all (Admin only)
- `PUT /api/v1/users/:userId` – Update (Admin: any user; Customer: own profile only)
- `DELETE /api/v1/users/:userId` – Delete (Admin only; no active bookings)

### Bookings

- `POST /api/v1/bookings` – Create (Customer or Admin); validates availability, sets vehicle to booked, computes total price
- `GET /api/v1/bookings` – Admin: all bookings; Customer: own only
- `PUT /api/v1/bookings/:bookingId` – Customer: cancel (before start date); Admin: mark as returned (vehicle set to available)

Bookings whose `rent_end_date` has passed are automatically marked as returned and the vehicle is set to available when listings or updates are performed.

## Project Structure

```
src/
├── config/          # App config (env)
├── db/              # Pool, schema.sql, setup script
├── middleware/      # Auth (JWT, requireAdmin, requireAdminOrOwn), error handler
├── modules/
│   ├── auth/        # signup, signin (routes, controller, service)
│   ├── users/       # list, update, delete
│   ├── vehicles/    # CRUD
│   └── bookings/    # create, list, update + auto-return
├── types/           # Shared types
├── utils/           # response helpers
├── app.ts
└── server.ts
```

## Response Format

- Success: `{ "success": true, "message": "...", "data": ... }` (omit `data` for deletes)
- Error: `{ "success": false, "message": "...", "errors": "..." }`

HTTP status codes: 200, 201 (Created), 400 (validation), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error).

## Deploy on Vercel

1. Push the project to GitHub (or connect your repo in Vercel).
2. In [Vercel](https://vercel.com), **New Project** → import this repo.
3. Set **Environment Variables** in the project settings:
   - `DATABASE_URL` – your PostgreSQL connection string (e.g. Neon)
   - `JWT_SECRET` – a strong secret for JWT signing
4. Deploy. The build runs `npm run build`; all requests are handled by the serverless function at `api/index.js`.

Your API will be at `https://<your-project>.vercel.app/api/v1/...` (e.g. `https://<your-project>.vercel.app/api/v1/vehicles`).
