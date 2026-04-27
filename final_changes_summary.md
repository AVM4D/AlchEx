# AlchEx — Final Changes Summary

## ✅ What Was Done

### 1. Database Normalized to BCNF

**New Lookup Tables** (eliminate transitive dependencies):

| Table | Purpose | Replaces |
|-------|---------|----------|
| `universities` | University + Campus | `users.university`, `users.campus` |
| `programs` | Academic programs | `users.program` |
| `categories` | Post categories | `posts.category` (string) |
| `tags` | Tag master list | `posts.tags` (JSON string) |
| `post_tags` | Post↔Tag junction | — |
| `user_social_links` | Social links per user | `users.socialLinks` (JSON) |
| `report_evidence` | Evidence files per report | `reports.evidence` (JSON) |

**Column Improvements:**
- Proper sizing: `NVARCHAR(255)` for names, `NVARCHAR(MAX)` for descriptions
- `CHECK` constraints on all enum columns (role, status, messageType, period)
- Foreign keys on every relationship (including `leaderboard_snapshots.userId`)
- Proper indexes on all frequently queried columns

### 2. 14 Stored Procedures Created

| # | Procedure | Purpose |
|---|-----------|---------|
| 1 | `sp_AcceptOffer` | Atomically accept offer, reject others, create transaction |
| 2 | `sp_CompleteTransaction` | Mark done, auto-complete when both sides done, recalc reputation |
| 3 | `sp_CancelTransaction` | Cancel with participant flags, update post |
| 4 | `sp_RecalculateReputation` | Weighted formula: 60% rating + 40% exchange volume |
| 5 | `sp_ExpirePosts` | Expire overdue active posts |
| 6 | `sp_ExpireOffers` | Expire stale pending offers |
| 7 | `sp_ExpireTransactions` | Expire transactions + cascade to posts |
| 8 | `sp_BanUser` | Ban user + send notification |
| 9 | `sp_UnbanUser` | Unban + send notification |
| 10 | `sp_CreateReport` | File report with validation |
| 11 | `sp_ResolveReport` | Admin resolve/dismiss + notify reporter |
| 12 | `sp_DailyLeaderboardSnapshot` | Capture top 100 users daily |
| 13 | `sp_GetDashboardStats` | Admin dashboard in a single query |
| 14 | `sp_CreateRating` | Create rating + recalc reputation + notify |

### 3. Backend Services Updated

All services now call stored procedures instead of inline SQL for multi-step operations:
- `transactionService.ts` → `sp_CompleteTransaction`, `sp_CancelTransaction`
- `offerService.ts` → `sp_AcceptOffer`
- `ratingService.ts` → `sp_CreateRating`, `sp_RecalculateReputation`
- `adminService.ts` → `sp_BanUser`, `sp_UnbanUser`, `sp_ResolveReport`, `sp_GetDashboardStats`
- `cronJobs.ts` → `sp_ExpirePosts`, `sp_ExpireOffers`, `sp_ExpireTransactions`, `sp_DailyLeaderboardSnapshot`

### 4. Repositories Updated for BCNF

- `userRepository.ts` → Joins `programs`, `universities`; manages `user_social_links`
- `postRepository.ts` → Joins `categories`; manages `post_tags` junction
- `reportRepository.ts` → Manages `report_evidence` table
- `notificationRepository.ts` → Uses `referenceId` + `referenceType` (no JSON blob)

### 5. Database Connection Enhanced

- Added `callProcedure()` method to `connection.ts` for executing stored procedures with named I/O params

---

## 📁 Files Modified

| File | Change |
|------|--------|
| `backend/sql/schema.sql` | Complete BCNF rewrite |
| `backend/sql/stored_procedures.sql` | **NEW** — 14 stored procedures |
| `backend/sql/views.sql` | **NEW** — 10 SQL views |
| `backend/sql/queries.sql` | Rewritten for BCNF schema |
| `backend/src/db/connection.ts` | Added `callProcedure()` |
| `backend/src/db/setup.ts` | Runs schema → views → SPs |
| `backend/src/db/seed.ts` | Uses lookup tables |
| `backend/src/repositories/*.ts` | All 5 repos updated |
| `backend/src/services/*.ts` | All 4 services updated |
| `backend/src/jobs/cronJobs.ts` | Uses SPs |

## 🚀 Setup Instructions

```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
npm install

# 3. Run database setup (creates DB, tables, views, SPs, seeds)
npx tsx src/db/setup.ts

# 4. Start the server
npm run dev
```

> [!IMPORTANT]
> You must **drop and recreate the database** since the schema has changed.
> The setup script handles this automatically.
