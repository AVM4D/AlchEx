# 🔮 AlchEx — Non-Monetary Student Exchange Platform

A production-grade, full-stack web application for university students to exchange goods and services without money. Built with a dark purple alchemy theme, cinematic 3D landing page, real-time chat, reputation system, and admin moderation panel.

---

## Tech Stack

### Backend
- **Runtime**: Node.js + Express + TypeScript
- **Database**: SQL Server via Prisma ORM
- **Auth**: JWT (access + refresh tokens), bcrypt, .edu email validation
- **Real-time**: Socket.IO for chat & notifications
- **Security**: Helmet, CORS, rate limiting
- **Jobs**: node-cron for scheduled tasks (post expiry, leaderboard snapshots)

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS 3 with custom purple glassmorphism theme
- **Animations**: Framer Motion
- **3D**: React Three Fiber (Three.js) — cinematic alchemy hero scene
- **State**: Zustand with persist middleware
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6 with lazy loading
- **UI**: Radix UI primitives, Lucide icons, react-hot-toast

---

## Features

- **Landing Page** — Cinematic 3D alchemy circle hero with floating particles, animated stats, step-by-step how-it-works, feature grid, leaderboard teaser
- **Auth** — .edu-only registration, JWT access/refresh tokens, protected routes, auto-refresh
- **Marketplace** — Browse/search/filter posts by category, condition, sort order; grid/list views with pagination
- **Post Management** — Create, edit, delete posts with image upload; category/condition/exchange-for metadata
- **Offer System** — Send offers on posts, accept/reject as post owner; automatic transaction creation on accept
- **Transactions** — Full lifecycle (IN_PROGRESS → COMPLETED/CANCELLED/DISPUTED); both parties mark done
- **Real-time Chat** — Socket.IO messaging per transaction; typing indicators, read receipts, online status
- **Rating & Reputation** — 1–5 star ratings post-completion; weighted reputation score; rating breakdown on profiles
- **Leaderboard** — All-time/monthly/weekly rankings; top-3 podium with crowns; reputation + exchange count
- **User Profiles** — Avatar, bio, university, reputation stats, post history, rating breakdown
- **Admin Panel** — Dashboard stats, user management (search/ban/unban), report resolution
- **Notifications** — Real-time push via Socket.IO; in-app notification center with read/unread states
- **Moderation** — Pluggable AI moderation architecture (basic profanity filter + OpenAI stub)

---

## Project Structure

```
AlchEx/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # SQL Server database schema
│   ├── src/
│   │   ├── controllers/           # Route handlers
│   │   ├── middlewares/            # Auth, error handling, validation
│   │   ├── repositories/          # Data access layer
│   │   ├── routes/                # Express route definitions
│   │   ├── services/              # Business logic layer
│   │   ├── sockets/               # Socket.IO setup
│   │   ├── jobs/                  # Cron jobs
│   │   ├── prisma/                # Prisma client singleton
│   │   ├── utils/                 # Config, JWT, validators, helpers
│   │   └── server.ts              # Express app entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # Button, Input, GlassCard, Modal, etc.
│   │   │   ├── layout/            # Sidebar, Header, AppLayout
│   │   │   └── landing/           # HeroScene (3D), landing sections
│   │   ├── pages/                 # All page components
│   │   ├── services/              # API client, auth, data, socket
│   │   ├── store/                 # Zustand stores
│   │   ├── types/                 # TypeScript interfaces
│   │   ├── lib/                   # Utility functions
│   │   ├── App.tsx                # Router & route definitions
│   │   ├── main.tsx               # React entry point
│   │   └── index.css              # Global styles & Tailwind
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js 18+** — download from https://nodejs.org
- **SQL Server** — SQL Server Express (free) works perfectly
  - Download: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
  - During install, pick "Basic" and note the instance name (usually `SQLEXPRESS`)
- **Git** — https://git-scm.com

---

### 🚀 Step-by-Step Setup on a New PC (after cloning)

Follow **every** step below, in order.

#### Step 0 — Clone and open in VS Code

```
git clone <your-repo-url>
cd AlchEx
code .
```

#### Step 1 — Install backend dependencies

Open a terminal in VS Code (`Ctrl + ~`), then:

```
cd backend
npm install
```

Wait until it finishes (you'll see `added X packages`).

#### Step 2 — Install frontend dependencies

Open a **second** terminal (`Ctrl + Shift + ~`), then:

```
cd frontend
npm install
```

#### Step 3 — Create your backend `.env` file

Go back to the **first terminal** (backend). Run:

```
copy .env.example .env
```

Now open the file `backend/.env` in VS Code and **edit the `DATABASE_URL`** to match your SQL Server:

- **If you use Windows Authentication** (most common on a personal PC):
  ```
  DATABASE_URL="sqlserver://localhost;instanceName=SQLEXPRESS;database=alchex;integratedSecurity=true;trustServerCertificate=true"
  ```
  > Change `SQLEXPRESS` to your actual instance name if different.

- **If you use SQL Server Authentication** (username + password):
  ```
  DATABASE_URL="sqlserver://localhost:1433;database=alchex;user=sa;password=YOUR_PASSWORD_HERE;trustServerCertificate=true"
  ```

Also change the JWT secrets to any random strings:
```
JWT_ACCESS_SECRET=some-random-long-string-abc123
JWT_REFRESH_SECRET=another-random-long-string-xyz789
```

Save the file.

#### Step 4 — Create your frontend `.env` file

In the **second terminal** (frontend):

```
copy .env.example .env
```

The defaults (`http://localhost:4000`) are correct for local development — no changes needed.

#### Step 5 — Make sure SQL Server is running

- Press `Win + R`, type `services.msc`, press Enter
- Find **SQL Server (SQLEXPRESS)** (or your instance name)
- Make sure its status says **Running**. If not, right-click → Start.

#### Step 6 — Create the database

You can either:

**Option A — Use the start script** (does everything automatically):
```
cd ..
powershell -ExecutionPolicy Bypass -File start.ps1
```
This will create the database, push the schema, seed data, and start both servers. You're done!

**Option B — Do it manually** (if the script doesn't work for your setup):

Open **SQL Server Management Studio (SSMS)** or **sqlcmd** and create a database:
```sql
CREATE DATABASE [alchex];
```

Then in the **backend terminal**:
```
npx prisma generate
npx prisma db push
```

You should see: `Your database is now in sync with your Prisma schema`.

#### Step 7 — Seed the database (optional but recommended)

This loads 10 sample users, 15 posts, 12 offers, and other test data:

```
npx tsx src/prisma/seed.ts
```

Sample login credentials after seeding:
| Email | Password | Role |
|-------|----------|------|
| `admin@alchex.io` | `Test@1234` | Admin |
| `demo@university.edu` | `Test@1234` | Admin |
| `sarah@university.edu` | `Test@1234` | Student |

All seed users share the password `Test@1234`.

#### Step 8 — Start the backend server

In the **backend terminal**:

```
npm run dev
```

You should see: `🚀 Server running on port 4000 (development)`.

#### Step 9 — Start the frontend server

In the **frontend terminal**:

```
npm run dev
```

You should see: `VITE ready ... Local: http://localhost:5173/`.

#### Step 10 — Open the app

Open your browser and go to **http://localhost:5173**.  
That's it — you're running! 🎉

---

### 🐳 Docker Setup (alternative)

```bash
copy .env.example .env          # Set DB_PASSWORD, JWT secrets
docker-compose up --build       # Frontend: :80, Backend: :4000, DB: :1433
```

After the DB is running, apply the schema:
```bash
cd backend
npx prisma db push
```

---

### ⚡ Quick Start (after first-time setup)

Once everything is installed, you can start both servers any time with:

```
powershell -ExecutionPolicy Bypass -File run.ps1
```

Or manually: run `npm run dev` in both `backend/` and `frontend/` terminals.

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Register (.edu only) | No |
| POST | `/api/auth/login` | Login (returns tokens) | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout (clear refresh) | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/posts` | List posts (filter/search/paginate) | Yes |
| POST | `/api/posts` | Create post | Yes |
| GET | `/api/posts/:id` | Get post detail | Yes |
| PUT | `/api/posts/:id` | Update post | Yes |
| DELETE | `/api/posts/:id` | Delete post | Yes |
| POST | `/api/offers` | Create offer | Yes |
| GET | `/api/offers/post/:postId` | Get offers for post | Yes |
| PUT | `/api/offers/:id/accept` | Accept offer | Yes |
| PUT | `/api/offers/:id/reject` | Reject offer | Yes |
| GET | `/api/transactions` | List transactions | Yes |
| PUT | `/api/transactions/:id/done` | Mark side done | Yes |
| PUT | `/api/transactions/:id/cancel` | Cancel transaction | Yes |
| GET | `/api/chat/:txId/messages` | Get chat messages | Yes |
| POST | `/api/chat/:txId/messages` | Send message | Yes |
| POST | `/api/ratings` | Create rating | Yes |
| GET | `/api/users/:id` | Get user profile | Yes |
| PUT | `/api/users/profile` | Update own profile | Yes |
| GET | `/api/users/leaderboard` | Get leaderboard | Yes |
| POST | `/api/reports` | Create report | Yes |
| GET | `/api/admin/dashboard` | Admin stats | Admin |
| GET | `/api/admin/users` | List users | Admin |
| PUT | `/api/admin/users/:id/ban` | Ban user | Admin |
| PUT | `/api/admin/users/:id/unban` | Unban user | Admin |
| GET | `/api/admin/reports` | List reports | Admin |
| PUT | `/api/admin/reports/:id/resolve` | Resolve report | Admin |

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

Glass morphism cards, purple glow shadows, gradient borders, smooth Framer Motion transitions throughout.

---

## Architecture

```
Controller → Service → Repository → DB Connection → SQL Server
     ↑            ↑                        ↑
  Middleware    Validators (Zod)    Stored Procedures
```

- **Controllers**: Thin HTTP handlers, delegate to services
- **Services**: Business logic, authorization checks, orchestration
- **Repositories**: Pure data access, raw SQL queries via custom DB connection layer
- **Middleware**: Auth (JWT verify), validation (Zod), error handling
- **Stored Procedures**: 14 SPs encapsulate atomic multi-step operations (accept offer, complete transaction, recalculate reputation, etc.)

> 📖 **For a complete beginner-friendly architecture guide** with diagrams, feature flows, database schema, stored procedure details, and everything you need to understand this project, see **[PROJECT_ARCHITECTURE.md](./PROJECT_ARCHITECTURE.md)**.

---

## License

MIT
