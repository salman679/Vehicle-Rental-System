# Vehicle Rental System

**Backend API** for a vehicle rental management system with role-based access, vehicle inventory, and booking lifecycle management.

**Live URL:** [https://vehicle-rental-system-ashy-eta.vercel.app](https://vehicle-rental-system-ashy-eta.vercel.app)  
**Repository:** [https://github.com/salman679/Vehicle-Rental-System](https://github.com/salman679/Vehicle-Rental-System)

---

## Features

- **Authentication** — User registration and login with JWT; bcrypt password hashing.
- **Role-based access** — **Admin** (full access) and **Customer** (own profile and bookings).
- **Vehicles** — CRUD with types (car, bike, van, SUV), registration numbers, daily rent price, and availability status.
- **Users** — List all (Admin), update profile (Admin or own), delete (Admin; blocked if active bookings).
- **Bookings** — Create with automatic price calculation (daily rate × days); cancel (Customer, before start) or mark returned (Admin); auto-return when rental period ends.
- **Validation & safety** — Delete vehicle/user only when no active bookings; consistent JSON responses and error handling.

---

## Technology Stack

| Layer        | Technology                          |
| ------------ | ------------------------------------ |
| Runtime      | Node.js                             |
| Language     | TypeScript                          |
| Web framework| Express.js                          |
| Database     | PostgreSQL                          |
| Auth         | JWT (jsonwebtoken), bcrypt          |
| Hosting      | Vercel (serverless)                 |

---

## Setup & Usage

### Prerequisites

- Node.js (v18 or later recommended)
- PostgreSQL instance (e.g. [Neon](https://neon.tech), local, or any Postgres host)

### Local setup

1. **Clone and install**

   ```bash
   git clone https://github.com/salman679/Vehicle-Rental-System.git
   cd Vehicle-Rental-System
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env` and set:

   | Variable       | Description                          |
   | -------------- | ------------------------------------ |
   | `PORT`         | Server port (default `3000`)         |
   | `JWT_SECRET`   | Secret for signing JWTs              |
   | `DATABASE_URL` | PostgreSQL connection string         |

   Tables are created automatically on first run from `src/db/schema.sql`.

3. **Run the server**

   ```bash
   npm run dev
   ```

   Or build and run:

   ```bash
   npm run build
   npm start
   ```

   API base: `http://localhost:3000`. Root: [http://localhost:3000/](http://localhost:3000/) returns a welcome message and endpoint overview.

### Usage (API)

- **Base path:** `/api/v1`
- **Auth:** Register via `POST /api/v1/auth/signup`, login via `POST /api/v1/auth/signin`; use the returned token in the header: `Authorization: Bearer <token>`.
- **Public:** `GET /api/v1/vehicles`, `GET /api/v1/vehicles/:vehicleId`.
- **Admin-only:** Create/update/delete vehicles, list/delete users.
- **Role-based:** Bookings — create (Customer or Admin), list (Admin: all; Customer: own), update (Customer: cancel; Admin: mark returned).

Example with live API:

```bash
# Root / welcome
curl https://vehicle-rental-system-ashy-eta.vercel.app

# List vehicles
curl https://vehicle-rental-system-ashy-eta.vercel.app/api/v1/vehicles
```

---

## API Reference (summary)

| Method | Endpoint                     | Access     | Description                |
| ------ | --------------------------- | ---------- | -------------------------- |
| POST   | `/api/v1/auth/signup`        | Public     | Register                   |
| POST   | `/api/v1/auth/signin`        | Public     | Login → JWT                |
| POST   | `/api/v1/vehicles`          | Admin      | Create vehicle             |
| GET    | `/api/v1/vehicles`          | Public     | List vehicles              |
| GET    | `/api/v1/vehicles/:id`      | Public     | Get vehicle                |
| PUT    | `/api/v1/vehicles/:id`      | Admin      | Update vehicle             |
| DELETE | `/api/v1/vehicles/:id`      | Admin      | Delete vehicle             |
| GET    | `/api/v1/users`             | Admin      | List users                 |
| PUT    | `/api/v1/users/:id`         | Admin/Own  | Update user                |
| DELETE | `/api/v1/users/:id`         | Admin      | Delete user                |
| POST   | `/api/v1/bookings`          | Customer/Admin | Create booking        |
| GET    | `/api/v1/bookings`          | Role-based | List bookings              |
| PUT    | `/api/v1/bookings/:id`      | Role-based | Cancel or mark returned   |

### Response format

- **Success:** `{ "success": true, "message": "...", "data": ... }`
- **Error:** `{ "success": false, "message": "...", "errors": "..." }`

Status codes: `200`, `201`, `400`, `401`, `403`, `404`, `500`.

---

## Project structure

```
src/
├── config/       # App config (env)
├── db/            # Pool, schema.sql, init
├── middleware/    # Auth, error handler
├── modules/
│   ├── auth/      # signup, signin
│   ├── users/
│   ├── vehicles/
│   └── bookings/
├── types/
├── utils/
├── app.ts
└── server.ts
api/
└── index.js       # Vercel serverless entry
```

---

## Deploy on Vercel

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com).
2. Set **Environment Variables:** `DATABASE_URL`, `JWT_SECRET`.
3. Deploy. Build runs `npm run build`; the API is served via `api/index.js`.

Live demo: [https://vehicle-rental-system-ashy-eta.vercel.app](https://vehicle-rental-system-ashy-eta.vercel.app)
