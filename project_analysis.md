# AlchEx Project Analysis — TA Requirements vs Current State

## Proposal Requirements Checklist

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **User Auth & Access Control** (`.edu` emails, STUDENT/ADMIN roles) | ✅ Implemented | Auth routes, JWT, role guards exist |
| 2 | **Student Marketplace** (create posts, offers, one-offer-per-post) | ✅ Implemented | Posts, offers CRUD all working |
| 3 | **Post Lifecycle & Status** (ACTIVE → IN_PROGRESS → SUCCESSFUL/EXPIRED) | ✅ Implemented | Cron jobs + status transitions working |
| 4 | **Acceptance, Chat & Transaction Completion** | ✅ Implemented | Socket.IO chat, accept/reject/cancel flows |
| 5 | **Ratings, Reputation & Leaderboard** | ✅ Implemented | Rating CRUD, reputation formula, leaderboard snapshots |
| 6 | **User Profiles & Filtering** | ✅ Implemented | Profile page, filtering by category/search |
| 7 | **Admin Panel & Moderation** | ✅ Implemented | Admin page, ban/unban, report management |
| 8 | **Reporting & Dispute Handling** | ✅ Implemented | Report CRUD, resolve/dismiss by admin |
| 9 | **AI-Assisted Moderation** (Optional) | ⚠️ Stub only | Basic pattern matching, OpenAI TODO |

## TA Requirements — What Needs Work

### 1. 🔴 Database Normalization to BCNF
**Current issues:**
- `users.socialLinks` → JSON string stored in main table (violates 1NF)
- `posts.tags` → JSON array string in main table (violates 1NF) 
- `reports.evidence` → JSON array of file paths (violates 1NF)
- `notifications.data` → JSON payload (violates 1NF)
- `users` table has 20+ columns — batch/program/section/university/campus could be normalized
- Column sizes all `NVARCHAR(1000)` — wasteful, needs proper sizing
- No CHECK constraints for status enums

### 2. 🔴 Stored Procedures
**Current state:** Zero stored procedures. All business logic is in Node.js code with inline SQL.
**Needed:** Wrap major business workflows in stored procedures:
- `sp_AcceptOffer` — atomically accept offer, reject others, create transaction
- `sp_CompleteTransaction` — mark done, update post status, recalculate reputation
- `sp_CancelTransaction` — cancel with participant flags, update post
- `sp_RecalculateReputation` — compute reputation score
- `sp_ExpirePosts`, `sp_ExpireOffers`, `sp_ExpireTransactions` — cron operations
- `sp_BanUser`, `sp_UnbanUser` — admin operations
- `sp_CreateReport`, `sp_ResolveReport` — report lifecycle
- `sp_DailyLeaderboardSnapshot` — leaderboard capture

### 3. 🔴 Database Optimization
- Add CHECK constraints for enum columns (status fields, role, messageType)
- Proper column sizing (NVARCHAR(255) for names, NVARCHAR(MAX) for descriptions)
- Add computed columns where useful
- Add proper foreign key on `leaderboard_snapshots.userId`
- Consider indexing improvements
- Add triggers for audit/cascading updates

## Implementation Plan
1. Create new normalized schema (`schema_v2.sql`) with BCNF tables
2. Create stored procedures (`stored_procedures.sql`)
3. Update backend repositories to call stored procedures
4. Add CHECK constraints, proper column sizes, missing FKs
5. Update the `setup.ts` to run the new SQL files
6. Verify all frontend features still work
