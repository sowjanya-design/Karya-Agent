# Karya Services — Recruitment CRM

A full-stack recruitment CRM platform for managing candidates, counselors, and job applications. React 19 + TypeScript frontend, Express.js backend, PostgreSQL via Prisma ORM, all containerised with Docker.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Environment Setup](#environment-setup)
5. [Running with Docker (Recommended)](#running-with-docker-recommended)
6. [Running Locally without Docker](#running-locally-without-docker)
7. [Database — Prisma ORM](#database--prisma-orm)
8. [Making Code Changes (Deploy Cycle)](#making-code-changes-deploy-cycle)
9. [User Roles & Credentials](#user-roles--credentials)
10. [API Reference](#api-reference)
11. [Architecture Overview](#architecture-overview)
12. [Troubleshooting](#troubleshooting)
13. [Quick Reference](#quick-reference)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Express.js (TypeScript), tsx runtime |
| Database | PostgreSQL 15 |
| ORM | Prisma 6 |
| Auth | JWT (7-day expiry), bcrypt password hashing |
| Containerisation | Docker, Docker Compose |
| UI Animations | Motion (Framer Motion v12) |
| Toast Notifications | Sonner |
| Icons | Lucide React |

---

## Project Structure

```
karya/
├── src/                            # Frontend React source
│   ├── pages/
│   │   └── AdminDashboard.tsx      # Admin interface (candidates, counselors, jobs)
│   ├── components/
│   │   ├── EmployeeDashboard.tsx   # Counselor/consultant interface
│   │   ├── ClientDashboard.tsx     # Candidate interface
│   │   └── client/
│   │       └── ProfileTab.tsx      # Candidate profile editor
│   ├── contexts/
│   │   └── UserRoleContext.tsx     # Global auth + user state
│   └── lib/
│       └── utils.ts                # Tailwind cn() helper
├── prisma/
│   └── schema.prisma               # Database schema
├── server.ts                       # Express backend — all API routes
├── docker-compose.yml              # Defines db + backend services
├── Dockerfile                      # Backend container build instructions
├── vite.config.ts                  # Vite config + /api proxy to port 3000
├── .env                            # Local environment variables (not committed)
├── .env.example                    # Template for environment variables
└── package.json                    # Dependencies + npm scripts
```

---

## Prerequisites

Install these before anything else:

| Tool | Version | Purpose |
|---|---|---|
| Node.js | v20 or higher | Running the dev server and build tools |
| npm | v10 or higher | Package management (comes with Node.js) |
| Docker Desktop | latest | Running PostgreSQL + backend in containers |
| Git | any | Cloning the repository |

Verify installations:

```bash
node --version    # v20.x.x or higher
npm --version     # 10.x.x or higher
docker --version  # Docker version 24.x or higher
```

---

## Environment Setup

### 1. Copy the environment template

```bash
cp .env.example .env
```

On Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```

### 2. Fill in required values in `.env`

```env
# Required — Anthropic API key for AI features (job description parsing)
ANTHROPIC_API_KEY=sk-ant-api03-...

# Optional — Alternative AI provider
GEMINI_API_KEY=AIza...

# Optional — Gmail for sending notification emails
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

> **Note:** `DATABASE_URL` and `JWT_SECRET` are already configured inside `docker-compose.yml` for Docker mode. You only need them in `.env` if running the backend locally without Docker:

```env
# Only needed for local non-Docker development
DATABASE_URL=postgresql://karya_user:karya_password@localhost:5432/karya_db
JWT_SECRET=super_secret_jwt_key_here
```

---

## Running with Docker (Recommended)

Docker runs PostgreSQL and the Express backend in containers. The backend serves the built React frontend as static files in production mode.

### Step 1 — Install frontend dependencies

```bash
npm install
```

### Step 2 — Build the frontend

The backend serves compiled files from `dist/` in production. Build before starting Docker.

```bash
npm run build
```

### Step 3 — Start the full stack

```bash
docker compose up -d
```

This starts two containers:

| Container | Service | Port |
|---|---|---|
| `karya-db-1` | PostgreSQL database | 5432 |
| `karya-backend-1` | Express API + static files | 3000 |

The backend waits for the database to be healthy before starting.

### Step 4 — Initialise the database (first run only)

Push the Prisma schema to create all tables:

```bash
npx prisma db push
```

Run this once on the first setup, and again after any change to `prisma/schema.prisma`.

### Step 5 — Open the app

Visit: **http://localhost:3000**

The Express server serves the React SPA from `dist/` and handles all `/api/*` routes.

---

### Stopping the stack

```bash
# Stop containers (preserves database data)
docker compose down

# Stop and wipe all data (database volume deleted)
docker compose down -v
```

### Checking container status and logs

```bash
# See running containers and their status
docker compose ps

# Stream live backend logs
docker compose logs -f backend

# Stream live database logs
docker compose logs -f db
```

---

## Running Locally without Docker

Use this mode for active development. The Vite dev server provides hot module replacement so the browser refreshes automatically on file changes.

### Step 1 — Start PostgreSQL

You need a running PostgreSQL instance. Easiest option is to run only the database in Docker:

```bash
docker compose up -d db
```

Or install PostgreSQL natively and update `DATABASE_URL` in `.env` accordingly.

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Initialise the database

```bash
npx prisma db push
```

### Step 4 — Start the backend server

Open a terminal and run:

```bash
npm run dev:server
```

Express API starts on **http://localhost:3000**

### Step 5 — Start the frontend dev server

Open a second terminal and run:

```bash
npm run dev
```

Vite dev server starts on **http://localhost:5173**

All `/api/*` requests from the browser automatically proxy to `http://localhost:3000` (configured in `vite.config.ts`).

> **Hot reload behaviour:**
> - Frontend (React/TSX): changes appear in the browser instantly — no restart needed.
> - Backend (server.ts): you must stop and restart `npm run dev:server` after any backend change.

---

## Database — Prisma ORM

### Schema file location

```
prisma/schema.prisma
```

### Database Models

| Model | Purpose |
|---|---|
| `User` | All users — candidates, counselors, admins. Has `uid` (short ID), `role`, `email`, `passwordHash`, `displayName` |
| `Client` | Candidate profile record, linked to User by matching `uid`. Stores `applicationData` (JSON), `assignedEmployeeId` |
| `ClientJob` | Individual job application. Belongs to a Client. Has `company`, `role`, `status`, `location`, `salary`, `appliedDate`, `jobUrl` |
| `ResumeHistory` | Versioned history of AI-generated resume variants |
| `PreRegistration` | Pre-registration forms submitted before full account creation |

> **Important relationship note:** `User` and `Client` have **no Prisma foreign key relation** defined between them. They are linked by matching `uid` string values and merged in application code. When fetching client data you always need a separate `prisma.user.findMany()` call to get name and email.

### Common Prisma Commands

```bash
# Sync schema changes to the live database
npx prisma db push

# Open Prisma Studio — visual database browser at http://localhost:5555
npx prisma studio

# Regenerate Prisma client after schema changes
npx prisma generate

# Introspect the current database and update schema
npx prisma db pull
```

---

## Making Code Changes (Deploy Cycle)

Because the backend runs in `NODE_ENV=production` inside Docker with no hot reload, every code change requires a rebuild.

### Frontend change only (files under `src/`)

```bash
npm run build
docker compose up -d --force-recreate backend
```

### Backend change only (`server.ts`)

```bash
docker compose build backend
docker compose up -d --force-recreate backend
```

### Both frontend and backend changed

```bash
npm run build
docker compose build backend
docker compose up -d --force-recreate backend
```

### Schema change (`prisma/schema.prisma`)

```bash
npx prisma db push       # sync schema to database
docker compose build backend
docker compose up -d --force-recreate backend
```

> The `Dockerfile` runs `npx prisma generate` at image build time, so the Prisma client inside the container always matches your current schema.

### Force a full clean rebuild (when in doubt)

```bash
npm run build
docker compose build --no-cache backend
docker compose up -d --force-recreate backend
```

---

## User Roles & Credentials

There are three roles in the system: `admin`, `employee` (counselor), `client` (candidate).

### Admin Accounts

Admins have full access to all candidates, counselors, job applications, and system settings.

| Email | Password |
|---|---|
| karya.ai.admin@gmail.com | AdminPassword123! |
|

### Counselor Accounts (role: `employee`)

Counselors see and manage only their assigned candidates. New counselors are created by admin in the **Counselors Data** tab of the Admin Dashboard.

| Name | Email | Password | UID |
|---|---|---|---|
| Karthik | mkarthikeya24@gmail.com | Consultancy@2026 | 02 |
| Niteesh | kbsn1170@gmail.com | Consultancy@2026 | 01 |
| Kesamasetty Raghavendra Karthik | karthikkesam9666@gmail.com | karthikkesam9666 | 03 |

### Candidate Accounts (role: `client`)

Candidates register themselves on the login page under the **Candidate** tab. New accounts start with **Pending Approval** status and must be approved by an admin before full access is granted.

| Name | Email | Password |
|---|---|---|
| Yaswanth Surya Teja Alapati | yaswanthalapati17@gmail.com | yaswanthalapati17 |

---

## API Reference

All routes are defined in `server.ts`. The base URL is `http://localhost:3000`.

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register a new candidate account |
| POST | `/api/auth/login` | Public | Login — returns JWT token |
| GET | `/api/auth/me` | Authenticated | Get current user profile |

**Login request:**
```json
{ "email": "user@example.com", "password": "yourpassword" }
```

**Login response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "uid": "02", "role": "employee", "email": "...", "displayName": "..." }
}
```

The JWT token must be stored in `localStorage` under the key `jwt_token` and included in every authenticated request:

```
Authorization: Bearer <token>
```

---

### Clients (Candidates)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/clients` | Admin / Employee | List all clients. Employees see only their assigned clients |
| PUT | `/api/clients/:uid` | Admin / Employee | Update client status, profile data, or assigned counselor |
| DELETE | `/api/users/:uid` | Admin | Permanently delete a user and their client record |

---

### Job Applications

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/jobs/:clientUid` | Admin / Employee | Get all job applications for a specific candidate |
| POST | `/api/jobs` | Admin / Employee | Create a new job application |
| PUT | `/api/jobs/:jobId` | Admin / Employee | Update a job application (status, notes, etc.) |
| DELETE | `/api/jobs/:jobId` | Admin / Employee | Delete a job application |

**Create job application request body:**
```json
{
  "clientId": "prisma-uuid-of-client",
  "company": "Google",
  "role": "Software Engineer",
  "status": "Applied",
  "appliedDate": "2026-06-07",
  "location": "Hyderabad, India",
  "salary": "25 LPA",
  "jobUrl": "https://careers.google.com/jobs/..."
}
```

---

### Counselors

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/users/counselors` | Admin | List all counselors with their assigned candidate details |
| POST | `/api/users/counselor` | Admin | Create a new counselor account |

**Create counselor request body:**
```json
{
  "displayName": "Jane Doe",
  "email": "jane@agency.com",
  "password": "optionalCustomPassword"
}
```

If `password` is omitted, a secure random password is generated and returned in the response.

---

### Admin

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/admin/stats` | Admin / Employee | Global statistics (total users, applications, etc.) |
| POST | `/api/admin/create-user` | Admin | Create any user type |

---

### AI — Job Scraping

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/scrape-job` | Authenticated | Scrape a job posting URL and extract company/role/location via AI |

**Request body:**
```json
{ "url": "https://company.com/careers/job-123" }
```

---

## Architecture Overview

```
Browser
  │
  ├── http://localhost:3000       (production — Docker)
  │     Express serves React SPA from dist/
  │
  └── http://localhost:5173       (development — Vite dev server)
        Vite proxies /api/* → http://localhost:3000


Express Server (server.ts)
  │
  ├── Static file serving (dist/)
  ├── JWT authentication middleware
  ├── Role-based route guards (admin / employee / client)
  └── Prisma ORM
        │
        PostgreSQL (Docker container)
```

### Authentication Flow

1. User submits email + password on the login page
2. Server verifies password with bcrypt, signs a JWT (7-day expiry)
3. Frontend stores the token in `localStorage` as `jwt_token`
4. Every API request includes `Authorization: Bearer <token>` header
5. `authenticateToken` middleware decodes the JWT and attaches `req.user` to the request
6. Route handlers check `req.user.role` to enforce admin/employee-only access

### Frontend Role Routing

After login, the React app reads `user.role` from context and renders the appropriate dashboard:

```
UserRoleContext (global auth state)
  │
  ├── role === 'admin'     → AdminDashboard.tsx
  ├── role === 'employee'  → EmployeeDashboard.tsx
  └── role === 'client'    → ClientDashboard.tsx
```

### Admin Dashboard Tabs

| Tab | Content |
|---|---|
| Candidates | All registered candidates with status management |
| Applied Jobs | All job applications across all candidates |
| Counselors Data | View, create, and delete counselor accounts |
| Pre-Registrations | Pre-registration form submissions |
| Banned Users | Accounts marked as banned |

### Counselor Dashboard Sections

| Section | Content |
|---|---|
| Overview | Summary cards — total assigned candidates, pending approvals |
| Candidate Roster | Full list of assigned candidates with dossier view |
| Dossier — Details | Candidate profile, resume, onboarding status |
| Dossier — Job Applications | View/add job applications for the selected candidate |
| Dossier — Application Pipeline | Job pipeline with status tracking and management |

---

## Troubleshooting

### Port 3000 is already in use

```powershell
# Windows: find what is using the port
netstat -ano | findstr :3000

# Kill by PID (replace 1234 with actual PID)
Stop-Process -Id 1234 -Force
```

### Database connection refused

```bash
# Check container health
docker compose ps

# View database logs
docker compose logs db

# Restart the database container
docker compose restart db
```

### Changes not appearing after code edit

Make sure you completed both steps:

```bash
npm run build                                        # recompile React
docker compose up -d --force-recreate backend        # restart container
```

If still not showing, force a clean Docker image rebuild:

```bash
docker compose build --no-cache backend
docker compose up -d --force-recreate backend
```

### Prisma errors after schema change

```bash
npx prisma db push         # sync schema to database
npx prisma generate        # regenerate Prisma client
docker compose build backend
docker compose up -d --force-recreate backend
```

### JWT token expired / stuck on login loop

Tokens expire after 7 days. Clear the stored token in the browser:

```javascript
// Open browser DevTools → Console tab → paste this:
localStorage.removeItem('jwt_token')
```

Then refresh the page and log in again.

### Docker build fails with install errors

```bash
docker compose build --no-cache backend
```

### Browse the database directly

```bash
npx prisma studio
# Opens at http://localhost:5555
```

---

## Quick Reference

```bash
# ── STANDARD DEPLOY CYCLE (after any code change) ──────────────────────
npm run build && docker compose build backend && docker compose up -d --force-recreate backend

# ── DOCKER OPERATIONS ───────────────────────────────────────────────────
docker compose up -d                          # start everything
docker compose down                           # stop (keep data)
docker compose down -v                        # stop + wipe database
docker compose ps                             # check status
docker compose logs -f backend                # live backend logs
docker compose build --no-cache backend       # force clean rebuild

# ── DATABASE ─────────────────────────────────────────────────────────────
npx prisma db push                            # sync schema to database
npx prisma studio                             # visual DB browser (:5555)
npx prisma generate                           # regenerate Prisma client

# ── LOCAL DEVELOPMENT (with hot reload) ──────────────────────────────────
npm run dev                                   # frontend dev server (:5173)
npm run dev:server                            # backend server (:3000)

# ── OTHER ────────────────────────────────────────────────────────────────
npm install                                   # install all dependencies
npm run build                                 # compile React to dist/
```
