# Karya Services — Recruitment CRM

A full-stack recruitment CRM for managing candidates, counselors, and job applications. Built with React, Express, and PostgreSQL.

**Live site:** [www.karya.services](https://www.karya.services)

---

## What It Does

- **Candidates** register, fill their profile, and track job applications
- **Counselors** manage their assigned candidates and update application pipelines
- **Admins** approve candidates, assign counselors, create accounts, and oversee everything

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Backend | Express.js (TypeScript), compiled via esbuild |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma 6 |
| Auth | JWT (7-day expiry) + bcrypt |
| AI | Anthropic Claude (job description parsing) |
| Hosting | Hostinger Node.js Web App |
| Font | IBM Plex Sans |

---

## Project Structure

```
karya/
├── src/                          # React frontend
│   ├── components/               # Shared UI components
│   │   ├── admin/                # Admin-specific components
│   │   ├── client/               # Candidate-specific components
│   │   ├── employee/             # Counselor-specific components
│   │   ├── ClientDashboard.tsx   # Candidate dashboard
│   │   ├── EmployeeDashboard.tsx # Counselor dashboard
│   │   ├── FeedbackModal.tsx     # Review/feedback popup
│   │   ├── Layout.tsx            # Page layout wrapper
│   │   └── Logo.tsx              # KARYA brand logo
│   ├── contexts/
│   │   └── UserRoleContext.tsx   # Global auth + user state
│   ├── lib/
│   │   ├── ThemeContext.tsx      # Light/dark theme context
│   │   └── utils.ts             # Tailwind cn() helper
│   ├── pages/                   # All route pages
│   │   ├── Auth.tsx             # Login / Register page
│   │   ├── AdminDashboard.tsx   # Admin interface
│   │   ├── Dashboard.tsx        # Role-based dashboard router
│   │   ├── Onboarding.tsx       # New candidate onboarding
│   │   ├── Landing.tsx          # Public landing page
│   │   └── ...                  # Other public pages (Privacy, Terms, etc.)
│   ├── types/                   # Shared TypeScript types
│   ├── App.tsx                  # Root component + router
│   ├── index.css                # Global styles + IBM Plex Sans
│   └── main.tsx                 # React entry point
│
├── prisma/
│   ├── schema.prisma            # Database models
│   └── seed.ts                  # Admin account seeder
│
├── api/
│   └── index.ts                 # Vercel serverless export (wraps server.ts)
│
├── public/                      # Static assets served as-is
│   ├── favicon.svg
│   ├── manifest.json
│   ├── robots.txt
│   └── sitemap.xml
│
├── server.ts                    # Express backend — all API routes
├── app.js                       # Hostinger startup entry point
├── server.js                    # Compiled server (auto-generated, do not edit)
├── vite.config.ts               # Vite config + /api proxy
├── vercel.json                  # Vercel deployment config
├── package.json                 # Scripts + dependencies
├── tsconfig.json                # TypeScript config
├── index.html                   # HTML shell for Vite
├── .env                         # Local secrets (never commit)
└── .env.example                 # Template for environment variables
```

---

## Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Any long random string for signing tokens |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI job parsing |
| `NODE_ENV` | Yes | Set to `production` on server |
| `PUPPETEER_SKIP_DOWNLOAD` | Yes | Set to `true` (Puppeteer not used in prod) |
| `EMAIL_USER` | Optional | Gmail address for notification emails |
| `EMAIL_PASS` | Optional | Gmail app password |
| `GEMINI_API_KEY` | Optional | Google Gemini alternative AI key |

---

## Running Locally (Development)

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) database (free tier works fine)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and fill in your DATABASE_URL + JWT_SECRET
cp .env.example .env

# 3. Push schema to your Neon database
npx prisma db push

# 4. Seed admin accounts
npx prisma db seed
```

### Start the app

Open two terminals:

**Terminal 1 — Backend:**
```bash
npm run dev:server
# Express API starts on http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# Vite dev server starts on http://localhost:5173
# All /api/* requests auto-proxy to localhost:3000
```

---

## Deploying to Hostinger

The app is hosted on **Hostinger Node.js Web App** at `www.karya.services`.

### How deployment works

When you push to `main` and Hostinger redeploys:

1. `npm install` — installs all dependencies
2. `postinstall` auto-runs — generates Prisma client + builds React + compiles server
3. `node server.js` — starts the compiled Express server

### Manual redeploy steps

1. Push your changes to GitHub `main` branch
2. Go to **Hostinger hPanel → Deployments → Redeploy**
3. Wait ~2 minutes for the build to complete
4. Check **Runtime logs** for any errors

### Environment variables on Hostinger

Set these in **hPanel → Environment variables**:

```
DATABASE_URL      = postgresql://...neon.tech/...
JWT_SECRET        = your-secret-here
ANTHROPIC_API_KEY = sk-ant-...
NODE_ENV          = production
PUPPETEER_SKIP_DOWNLOAD = true
```

---

## Deploying to Vercel (Alternative)

The `api/index.ts` file wraps the Express app as a Vercel serverless function.

```bash
# Deploy via Vercel CLI
npx vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard. The `vercel.json` config handles routing.

---

## Database — Prisma

### Models

| Model | Purpose |
|---|---|
| `User` | All users (candidates, counselors, admins) — stores auth + role |
| `Client` | Candidate profile — linked to User by matching `uid` |
| `ClientJob` | Individual job application — belongs to a Client |
| `ResumeHistory` | Versioned AI-generated resumes |
| `PreRegistration` | Pre-signup form submissions |

> `User` and `Client` are linked by matching `uid` strings — there is no Prisma foreign key between them. This is intentional.

### Useful commands

```bash
npx prisma db push        # sync schema changes to database
npx prisma generate       # regenerate Prisma client after schema changes
npx prisma studio         # visual database browser at localhost:5555
npx prisma db seed        # seed admin accounts
```

---

## User Roles

| Role | Access |
|---|---|
| `admin` | Full access — candidates, counselors, jobs, settings |
| `employee` | Counselor — sees only their assigned candidates |
| `client` | Candidate — sees their own profile + job applications |

After login, the app reads `user.role` and renders the correct dashboard automatically.

### Default Admin Accounts

| Email | Password |
|---|---|
| karya.ai.admin@gmail.com | AdminPassword123! |
| avinashmurari3@gmail.com | Avinash@001 |
| karya.secret.admin@gmail.com | AdminPassword123! |

> Change these passwords after first login.

---

## API Routes

All routes live in `server.ts`. Base URL: `/api`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new candidate |
| POST | `/api/auth/login` | Public | Login — returns JWT |
| GET | `/api/auth/me` | Token | Current user info |
| GET | `/api/clients` | Token | All clients (admin) or assigned clients (counselor) |
| PUT | `/api/clients/:uid` | Token | Update candidate status or profile |
| DELETE | `/api/users/:uid` | Admin | Delete user |
| GET | `/api/jobs/:clientUid` | Token | Get job applications for a candidate |
| POST | `/api/jobs` | Token | Create job application |
| PUT | `/api/jobs/:id` | Token | Update job application |
| DELETE | `/api/jobs/:id` | Token | Delete job application |
| GET | `/api/users/counselors` | Admin | List all counselors |
| POST | `/api/users/counselor` | Admin | Create counselor account |
| POST | `/api/scrape-job` | Token | AI-parse a job URL |
| GET | `/api/health` | Public | Health check + DB ping |

---

## npm Scripts

```bash
npm run dev           # Vite frontend dev server (port 5173)
npm run dev:server    # Express backend dev server (port 3000)
npm run build         # Build React frontend → dist/
npm run build:server  # Compile server.ts → server.js via esbuild
npm run build:all     # Build both frontend + server
npm start             # Start production server (node server.js)
```

---

## Troubleshooting

**JWT token issues / stuck on login**
```javascript
// Browser DevTools → Console:
localStorage.removeItem('jwt_token')
```
Then refresh and log in again.

**Prisma error after schema change**
```bash
npx prisma db push
npx prisma generate
```

**Slow first load**
Neon's free tier sleeps after 5 minutes of inactivity. The first request after a sleep takes ~5–10 seconds to wake the database. Upgrade to Neon Pro to keep it always-on.

**API returning HTML instead of JSON**
Make sure `NODE_ENV=production` is set. In development, use `npm run dev:server` alongside `npm run dev`.
