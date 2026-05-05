# 🔮 AlchEx — Non-Monetary Student Exchange Platform

> **Team**: Ahmad Mursaleen (24L-0664) · Shajee Haroon (24L-0559) · Abdur Rehman Shah (24L-0712)  
> **Course**: Database Systems — Spring 2026, FAST-NUCES Lahore  
> **Instructor**: Ahmed Jaan · **Lab TA**: Shahzeb Mubashar

A production-grade, full-stack web application for university students to exchange goods and services without money. Inspired by the alchemical principle of **Equivalent Exchange** — you can't gain something without giving something in return.

> 📖 **For a complete beginner-friendly architecture walkthrough** with Mermaid diagrams, feature flows, ER diagrams, and stored procedure documentation, see **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)**.

---

## Tech Stack

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **Database**: SQL Server via `mssql` driver (raw SQL + stored procedures)
  - Windows Auth via `msnodesqlv8` (native ODBC) — auto-detected
  - SQL Auth via `tedious` (pure JS, cross-platform) — fallback
- **Schema Management**: Prisma (schema push only — no Prisma queries at runtime)
- **Auth**: JWT (access + refresh tokens), bcrypt (12 rounds), `.edu` email validation
- **Real-time**: Socket.IO for chat & notifications
- **Security**: Helmet (CSP, HSTS), CORS, rate limiting, XSS sanitization
- **Jobs**: node-cron for scheduled tasks (post/offer/transaction expiry, leaderboard snapshots)
- **Stored Procedures**: 14 SPs encapsulating all critical business workflows atomically

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS 3 with custom purple glassmorphism theme
- **Animations**: Framer Motion, GSAP
- **3D**: React Three Fiber (Three.js) — cinematic alchemy hero scene
- **State**: Zustand with localStorage persist middleware
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6 with lazy loading (code-split 16 pages)
- **UI**: Radix UI primitives, Headless UI, Lucide icons, react-hot-toast

---

## Features

| Feature | Description |
|---------|-------------|
| **Landing Page** | Cinematic 3D alchemy circle hero (Three.js), floating particles, animated stats, how-it-works steps, feature grid, leaderboard teaser |
| **Authentication** | `.edu`-only registration, JWT dual-token (access 15min + refresh 7d), auto-refresh via Axios interceptors, remember me (30d) |
| **Marketplace** | Browse/search/filter posts by category and search term; pagination |
| **Post Management** | Create, edit, delete posts; "What I Need" + "What I Offer" fields; auto-expiry via cron |
| **Offer System** | Submit offers on posts (1 per student per post), 48h expiry countdown, edit/withdraw while pending |
| **Offer Acceptance** | Atomic via `sp_AcceptOffer`: accept one → reject all others → create transaction → unlock chat |
| **Transactions** | Full lifecycle: `IN_PROGRESS` → `SUCCESSFUL` / `CANCELLED` / `EXPIRED`; both parties mark done independently |
| **Real-time Chat** | Socket.IO messaging per transaction; typing indicators, read receipts; **auto-disabled** when transaction completes/cancels |
| **Rating & Reputation** | 1–5 star ratings post-completion; weighted reputation: `avgRating × 0.6 + normalizedExchanges × 0.4`; recalculated via SP |
| **Leaderboard** | All-time/monthly/weekly rankings; top-3 podium with crowns; daily snapshots via `sp_DailyLeaderboardSnapshot` |
| **User Profiles** | Avatar, bio, university/batch/program/section, reputation stats, rating breakdown, post history |
| **Admin Panel** | Dashboard stats (via single SP), user management (search/ban/unban), report resolution, force-cancel transactions |
| **Notifications** | Real-time push via Socket.IO; 11 notification types; in-app notification center with read/unread states |
| **Reporting** | File disputes against transactions; admin review with notes; reporter notified on resolution |

---

## Project Structure

```
AlchEx/
├── backend/
│   ├── sql/                        # Raw SQL files
│   │   ├── schema.sql              # CREATE TABLE definitions (8 tables + snapshots)
│   │   ├── stored_procedures.sql   # 14 stored procedures
│   │   ├── views.sql               # SQL views for dashboard/reports
│   │   └── queries.sql             # Sample SELECT queries
│   ├── src/
│   │   ├── server.ts               # 🚀 Entry point — Express + Socket.IO + Cron
│   │   ├── controllers/            # HTTP request handlers (11 controllers)
│   │   ├── services/               # Business logic layer (10 services)
│   │   ├── repositories/           # Data access layer — raw SQL (9 repositories)
│   │   ├── routes/                 # Express route definitions (10 route files)
│   │   ├── middlewares/            # Auth (JWT), validation (Zod), error handler, XSS
│   │   ├── sockets/                # Socket.IO setup — chat, typing, read receipts
│   │   ├── jobs/                   # Cron jobs (expire posts/offers/transactions, leaderboard)
│   │   ├── db/                     # DB connection (mssql), seed data, schema setup
│   │   └── utils/                  # Config, JWT helpers, validators, error classes
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # 🚀 Entry point — all route definitions
│   │   ├── main.tsx                # React DOM render
│   │   ├── index.css               # Global styles + Tailwind
│   │   ├── pages/                  # 16 page components (lazy-loaded)
│   │   ├── components/
│   │   │   ├── ui/                 # 38 reusable UI components
│   │   │   ├── layout/            # Sidebar, Header, AppLayout
│   │   │   └── landing/           # HeroScene (3D), ScrollVideoSection
│   │   ├── services/              # API client (Axios), auth, data, Socket.IO
│   │   ├── store/                 # Zustand stores (auth, notifications, UI)
│   │   ├── types/                 # TypeScript interfaces
│   │   └── lib/                   # Utility functions
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── postman/                        # Postman API collection
├── docker-compose.yml
├── start.ps1                       # One-click first-time setup script
├── run.ps1                         # Quick start script (after setup)
├── PROJECT_ARCHITECTURE.md         # 📖 Complete architecture guide
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js 18+** — https://nodejs.org
- **SQL Server** — SQL Server Express (free) works perfectly
  - Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
  - During install, pick "Basic" and note the instance name (usually `SQLEXPRESS`)
- **Git** — https://git-scm.com

---

### 🚀 Step-by-Step Setup (after cloning)

#### Step 0 — Clone and open in VS Code

```bash
git clone https://github.com/AVM4D/AlchEx.git
cd AlchEx
code .
```

#### Step 1 — Install dependencies

```bash
# Terminal 1 — Backend
cd backend
npm install

# Terminal 2 — Frontend
cd frontend
npm install
```

#### Step 2 — Configure environment variables

**Backend** (`backend/.env`):
```bash
copy .env.example .env
```
Edit `backend/.env` and set `DATABASE_URL`:

- **Windows Authentication** (most common on personal PCs):
  ```
  DATABASE_URL="sqlserver://localhost;instanceName=SQLEXPRESS;database=alchex;integratedSecurity=true;trustServerCertificate=true"
  ```
- **SQL Server Authentication** (username + password):
  ```
  DATABASE_URL="sqlserver://localhost:1433;database=alchex;user=sa;password=YOUR_PASSWORD;trustServerCertificate=true"
  ```

Also set JWT secrets:
```
JWT_ACCESS_SECRET=some-random-long-string-abc123
JWT_REFRESH_SECRET=another-random-long-string-xyz789
```

**Frontend** (`frontend/.env`):
```bash
copy .env.example .env
# Defaults (http://localhost:4000) are correct — no changes needed
```

#### Step 3 — Make sure SQL Server is running

Press `Win + R` → type `services.msc` → find **SQL Server (SQLEXPRESS)** → make sure status says **Running**.

#### Step 4 — Create database & apply schema

**Option A — Automatic** (recommended):
```bash
powershell -ExecutionPolicy Bypass -File start.ps1
```
This creates the database, pushes schema, runs stored procedures, seeds sample data, and starts both servers. **You're done!**

**Option B — Manual**:
```sql
-- In SSMS or sqlcmd:
CREATE DATABASE [alchex];
```
Then:
```bash
cd backend
npx prisma generate
npx prisma db push
```

#### Step 5 — Run stored procedures

Open `backend/sql/stored_procedures.sql` in SSMS and execute it against the `alchex` database. This creates all 14 stored procedures.

#### Step 6 — Seed sample data (optional but recommended)

```bash
cd backend
npm run seed
```

**Sample credentials after seeding:**

| Email | Password | Role |
|-------|----------|------|
| `admin@alchex.io` | `Test@1234` | Admin |
| `demo@university.edu` | `Test@1234` | Admin |
| `sarah@university.edu` | `Test@1234` | Student |

All seed users share the password `Test@1234`.

#### Step 7 — Start development servers

```bash
# Terminal 1
cd backend
npm run dev
# → 🔮 AlchEx Backend Server running on port 4000

# Terminal 2
cd frontend
npm run dev
# → VITE ready at http://localhost:5173/
```

Open **http://localhost:5173** — you're running! 🎉

---

### ⚡ Quick Start (after first-time setup)

```bash
powershell -ExecutionPolicy Bypass -File run.ps1
```
Or manually: `npm run dev` in both `backend/` and `frontend/` terminals.

---

### 🐳 Docker Setup (alternative)

```bash
copy .env.example .env          # Set DB_PASSWORD, JWT secrets
docker-compose up --build       # Frontend: :80, Backend: :4000, DB: :1433
```

After the DB is running:
```bash
cd backend
npx prisma db push
```

---

## Database

### Tables (9 total)

| Table | Purpose |
|-------|---------|
| `users` | Student/admin accounts, reputation scores, ban status |
| `posts` | Exchange requests with "what I need" / "what I offer" |
| `offers` | Proposals on posts (1 per student per post, 48h expiry) |
| `transactions` | Active exchanges between two students |
| `messages` | Chat messages within a transaction |
| `ratings` | 1-5 star ratings after successful exchanges |
| `reports` | Dispute reports filed against transactions |
| `notifications` | In-app notifications (11 types) |
| `leaderboard_snapshots` | Daily rankings of top 100 users |

### Stored Procedures (14 total)

| SP | Purpose |
|----|---------|
| `sp_AcceptOffer` | Atomically: accept offer → reject others → create transaction |
| `sp_CompleteTransaction` | Mark one side done; if both done → set SUCCESSFUL + recalculate reputation |
| `sp_CancelTransaction` | Cancel by participant or admin (force) |
| `sp_RecalculateReputation` | Weighted formula: `avgRating × 0.6 + normalizedExchanges × 0.4` |
| `sp_ExpirePosts` | Expire active posts past their deadline (cron: every 15 min) |
| `sp_ExpireOffers` | Expire stale pending offers past 48h (cron: every 15 min) |
| `sp_ExpireTransactions` | Expire in-progress transactions past 14 days (cron: every 30 min) |
| `sp_BanUser` / `sp_UnbanUser` | Ban/unban with system notification |
| `sp_CreateReport` | File dispute (validates reporter is part of transaction) |
| `sp_ResolveReport` | Admin resolves/dismisses report + notifies reporter |
| `sp_DailyLeaderboardSnapshot` | Capture top 100 users' rankings (cron: daily at midnight) |
| `sp_GetDashboardStats` | Returns all admin dashboard statistics in a single query |
| `sp_CreateRating` | Create rating + recalculate reputation + notify receiver |

### Normalization

Database is normalized to **BCNF**. Indexes on frequently queried columns (email, status, foreign keys, timestamps).

---

## API Endpoints

### Auth (public)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (.edu email only) |
| POST | `/api/auth/login` | Login → returns access + refresh tokens |
| POST | `/api/auth/refresh` | Refresh access token (cookie-based) |
| POST | `/api/auth/logout` | Logout — clears refresh token |
| GET | `/api/auth/me` | Get current user profile |

### Posts (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/marketplace` | Browse marketplace (filter, search, paginate) |
| GET | `/api/posts/my` | Get my posts |
| POST | `/api/posts` | Create new post |
| GET | `/api/posts/:id` | Get post detail |
| PUT | `/api/posts/:id` | Update post |
| DELETE | `/api/posts/:id` | Delete post (soft delete) |

### Offers (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/offers` | Submit offer on a post |
| PUT | `/api/offers/:id` | Edit pending offer |
| POST | `/api/offers/:id/accept` | Accept offer (post owner only) → creates transaction |
| POST | `/api/offers/:id/withdraw` | Withdraw your offer |
| GET | `/api/offers/post/:postId` | List offers for a post |
| GET | `/api/offers/my` | List my offers |

### Transactions (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions/my` | List my transactions |
| GET | `/api/transactions/:id` | Get transaction detail |
| POST | `/api/transactions/:id/complete` | Mark your side as done |
| POST | `/api/transactions/:id/cancel` | Cancel the exchange |

### Chat (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/:transactionId` | Get chat messages |
| POST | `/api/chat` | Send message (also via Socket.IO) |

### Users (authenticated)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/profile` | Get own profile |
| PUT | `/api/users/profile` | Update own profile |
| GET | `/api/users/:id` | Get public profile |
| GET | `/api/users/:id/ratings` | Get user's ratings |
| GET | `/api/users/:id/rating-stats` | Get rating breakdown |
| GET | `/api/users/leaderboard` | Get leaderboard |
| POST | `/api/users/ratings` | Submit a rating |

### Admin (admin role required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard statistics |
| GET | `/api/admin/users` | List/search users |
| POST | `/api/admin/users/ban` | Ban a user |
| POST | `/api/admin/users/:id/unban` | Unban a user |
| GET | `/api/admin/reports` | List reports |
| POST | `/api/admin/reports/resolve` | Resolve/dismiss a report |
| POST | `/api/admin/transactions/:id/force-cancel` | Force-cancel a transaction |

---

## Architecture

```
Route → Controller → Service → Repository → DB Connection → SQL Server
           ↑             ↑                         ↑
        Middleware    Validators (Zod)     Stored Procedures (14)
```

- **Routes**: Map URLs to controller methods
- **Controllers**: Thin HTTP handlers — extract request data, delegate to services, send response
- **Services**: All business logic — validation, authorization, orchestration
- **Repositories**: Pure data access layer — raw SQL queries via custom `db` module
- **DB Connection**: Custom `mssql` wrapper with tagged template literals (SQL injection safe) + stored procedure caller
- **Middleware**: Auth (JWT verify + ban check), Zod validation, XSS sanitization, global error handler
- **Stored Procedures**: 14 SPs encapsulate atomic multi-step operations

> 📖 **For the complete architecture guide** with Mermaid diagrams, ER diagrams, sequence diagrams, state machines, and detailed feature flows, see **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)**.

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0B0F14` / `#111827` | Page & card backgrounds |
| Surface | `#1F2937` / `#374151` | Cards, inputs, elevated surfaces |
| Primary | `#8B5CF6` | Buttons, links, accents, glows |
| Primary Dark | `#7C3AED` | Hover states, gradients |
| Lavender | `#A78BFA` | Subtle highlights, secondary text |
| Success | `#10B981` | Active status, confirmations |
| Danger | `#EF4444` | Errors, destructive actions |
| Warning | `#F59E0B` | Pending states, cautions |

Glassmorphism cards, purple glow shadows, gradient borders, smooth Framer Motion transitions throughout.

---

## License

MIT
