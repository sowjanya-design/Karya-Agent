# Karya - Agency CRM & Job Consultancy System

## 1. Project Overview
**Karya** is a comprehensive professional CRM and job application tracking system built specifically for a Job Consultancy Agency. It allows the agency to manage candidate profiles, assign candidates to designated counselors (employees), track job applications (with dynamic web scraping for job details), and review overall metrics.

The system was recently migrated from Firebase to a fully containerized architecture using a custom Node.js/PostgreSQL backend with JWT authentication.

## 2. Tech Stack & Architecture
- **Frontend**: React.js with Vite, styled with Tailwind CSS and Framer Motion for smooth, interactive, and premium animations.
- **Backend**: Node.js & Express.js.
- **Database**: PostgreSQL, managed via Prisma ORM.
- **Authentication**: Custom JWT (JSON Web Tokens) with hashed passwords using bcrypt.
- **Infrastructure**: Fully Dockerized using `docker-compose` (Container 1: PostgreSQL DB, Container 2: Node Backend).
- **AI Integrations**: 
  - **Puppeteer** is used to scrape job postings automatically.
  - **Anthropic Claude API** is used to dynamically parse unstructured scraped text into structured JSON data (Company, Role, Skills, etc.).

## 3. Database Models (Prisma)
The database contains the following primary models:

### `User`
Manages all authenticated entities in the system.
- **Fields**: `id`, `uid` (custom string ID like "01", "02"), `email`, `role` (admin, employee, client), `displayName`, `passwordHash`, `isApproved`, `isBanned`, `assignedClients` (array).

### `Client`
Stores extended candidate-specific data.
- **Fields**: `id`, `uid` (maps to User.uid), `assignedEmployeeId` (links to Counselor), `status` (incomplete, pending_approval, active, selected, banned), `applicationData` (JSON dump of candidate demographics, experience, expected CTC), `onboardingSkipped`.

### `ClientJob`
Tracks individual job applications submitted by counselors on behalf of clients.
- **Fields**: `clientId`, `company`, `role`, `status` (Applied, Interview, Selected, Rejected), `appliedDate`, `jobUrl`.

### `PreRegistration` / `ResumeHistory`
- **PreRegistration**: Temporarily stores generated passwords and UIDs for users created by Admins before their first login.
- **ResumeHistory**: Logs versions of tailored resumes and their ATS scores.

## 4. User Roles & Access Control
The application employs strict Role-Based Access Control (RBAC):

1. **Admin (`admin`)**:
   - Master dashboard view with global statistics.
   - Can view the entire candidate roster and approve pending candidates.
   - Can view all counselor data and dynamically generate new counselor accounts.
   - *Restrictions*: Admins cannot add new job applications directly; they oversee the agency.

2. **Counselor / Employee (`employee`)**:
   - Has a tailored dashboard showing *only* the candidates assigned to their ID.
   - Full write-access to the Candidate Dossier: They can add job applications, fetch job details using the AI scraper, and update application statuses.

3. **Client (`client`)**:
   - Represents the candidate. Primarily a profile entity that gets updated via the agency interface.

## 5. Core Pages & UI Flow

### `/auth` (Login & Registration)
- Provides separate tabs for Client, Employee, and Admin login.
- Candidates can register their profiles, which places them in a `pending_approval` state.

### `/admin` (Admin Dashboard)
- **Overview Tab**: Global metrics (Total Candidates, Total Apps, Apps Today) and a list of all candidates with their application pipelines.
- **Pending Approvals Tab**: Shows candidates who recently registered. Admins review their details (Experience, Fake/Genuine gaps, CTC, Location) and approve them by assigning them to a specific Counselor.
- **Counselors Data Tab**: A dedicated view showing all active counselors (e.g., Niteesh, Karthik) and how many candidates they are managing. Contains the UI to generate new counselor credentials.
- **Candidate Dossier Panel**: A right-side slide-out panel that shows deep details on a selected candidate, splitting information into 'Candidate Profile' and 'Applied Jobs'.

### `/employee` (Counselor Dashboard)
- Similar layout to the Admin Dashboard but scoped strictly to their assigned candidates.
- **Candidate Dossier (Write Access)**: Counselors have an extra "Add Job Application" tab. They can paste a job URL, click "Auto-Fill via AI", and the system will scrape the URL and parse the requirements before saving the application.

## 6. Key Backend API Routes
All routes are protected by a `authenticateToken` middleware requiring a valid JWT in the `Authorization` header.

- `POST /api/auth/login`: Authenticates user and returns JWT + user details.
- `GET /api/clients`: Returns clients (filtered by assigned ID for counselors, or all for admins).
- `PUT /api/clients/:uid`: Updates client status (e.g., approving them) and syncs User permissions.
- `POST /api/jobs`: Saves a new job application for a client.
- `GET /api/users/counselors`: Fetches all employees and aggregates how many clients are assigned to each.
- `POST /api/users/counselor`: Generates a new counselor account, assigns a sequential ID (e.g., `03`), generates a secure temporary password, and saves it.
- `POST /api/scrape-job`: The AI pipeline. Launches a headless Puppeteer browser, grabs text, and uses Claude to return structured JSON.

## 7. Local Environment Setup
To run the project locally:

1. **Backend & DB**:
   ```bash
   docker-compose up -d --build backend
   ```
   This spins up the PostgreSQL database on port 5432 and the Node.js API on port 3000.

2. **Frontend (Vite)**:
   ```bash
   npm run dev
   ```
   Starts the React application on port 5173. The `vite.config.ts` automatically proxies all `/api` requests to the Docker backend.

## 8. Fixed System Assets
The system operates with hardcoded fixed identities for absolute security:
- **Admins**: `karya.ai.admin@gmail.com` and `karya.secret.admin@gmail.com`.
- Admins cannot be dynamically created through the UI to prevent privilege escalation.
