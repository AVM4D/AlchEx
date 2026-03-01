# AlchEx — API Endpoint & Query Type Reference

> **Legend**
> - **ORM** = Prisma Client methods (`prisma.model.findUnique()`, `.create()`, `.update()`, etc.)
> - **Raw SQL** = `$queryRaw`, `$queryRawUnsafe`, or `$executeRaw` (hand-written SQL)
> - **Static** = No database query (hardcoded data)

---

## 1. Auth Routes — `/api/auth`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 1 | POST | `/register` | `authController.register` | ORM | `userRepository.create` | `INSERT INTO [User]` |
| 2 | POST | `/login` | `authController.login` | ORM | `userRepository.findByEmail` | `SELECT * FROM [User] WHERE email = @p1` |
| 3 | POST | `/refresh` | `authController.refresh` | ORM | `userRepository.findById` | `SELECT * FROM [User] WHERE id = @p1` |
| 4 | POST | `/logout` | `authController.logout` | — | — | No DB query (clears token client-side) |
| 5 | GET | `/me` | `authController.me` | ORM | `userRepository.findById` | `SELECT * FROM [User] WHERE id = @p1` |

---

## 2. Post Routes — `/api/posts`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 6 | GET | `/categories` | `postController.getCategories` | **Static** | — | No DB query (returns hardcoded array) |
| 7 | GET | `/marketplace` | `postController.getMarketplace` | **Raw SQL** | `postRepository.findAll` | Dynamic `SELECT` with `JOIN [User]`, `LEFT JOIN` (offer count subquery), `WHERE` filters, `ORDER BY`, `OFFSET/FETCH` pagination, `COUNT(*)` via `$queryRawUnsafe` |
| 8 | GET | `/my` | `postController.getMyPosts` | **Raw SQL** | `postRepository.findAll` (filtered by userId) | Same as above with userId filter |
| 9 | GET | `/:id` | `postController.getById` | ORM | `postRepository.findById` | `SELECT * FROM [Post] WHERE id = @p1` with `include: { user }` |
| 10 | POST | `/` | `postController.create` | ORM | `postRepository.create` | `INSERT INTO [Post]` |
| 11 | PUT | `/:id` | `postController.update` | ORM | `postRepository.update` | `UPDATE [Post] SET ... WHERE id = @p1` |
| 12 | DELETE | `/:id` | `postController.delete` | ORM | `postRepository.softDelete` | `UPDATE [Post] SET isDeleted = 1 WHERE id = @p1` |

---

## 3. Offer Routes — `/api/offers`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 13 | POST | `/` | `offerController.create` | ORM | `offerRepository.create` | `INSERT INTO [Offer]` |
| 14 | PUT | `/:id` | `offerController.update` | ORM | `offerRepository.update` | `UPDATE [Offer] SET ... WHERE id = @p1` |
| 15 | POST | `/:id/accept` | `offerController.accept` | ORM | `offerRepository.update` + `transactionRepository.create` + `offerRepository.rejectOtherOffers` | `UPDATE [Offer]` → `INSERT [Transaction]` → `UPDATE [Offer] SET status='REJECTED' WHERE postId=@p1 AND id!=@p2` |
| 16 | POST | `/:id/withdraw` | `offerController.withdraw` | ORM | `offerRepository.update` | `UPDATE [Offer] SET status='WITHDRAWN' WHERE id = @p1` |
| 17 | GET | `/post/:postId` | `offerController.getByPost` | ORM | `offerRepository.findByPost` | `SELECT * FROM [Offer] WHERE postId = @p1` with `include: { user }` |
| 18 | GET | `/my` | `offerController.getMyOffers` | **Raw SQL** | `offerRepository.findByUser` | `SELECT` with `JOIN [Post]`, `LEFT JOIN [Transaction]`, `OFFSET/FETCH`, `COUNT(*)` via `$queryRaw` |
| 19 | DELETE | `/:id` | `offerController.delete` | ORM | `offerRepository.softDelete` | `UPDATE [Offer] SET isDeleted = 1 WHERE id = @p1` |

---

## 4. Transaction Routes — `/api/transactions`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 20 | GET | `/my` | `transactionController.getMyTransactions` | **Raw SQL** | `transactionRepository.findByUser` | `SELECT` with `JOIN [Post]`, `JOIN [User] AS poster`, `JOIN [User] AS offerer`, `WHERE (posterId=@p1 OR offererId=@p1)`, `OFFSET/FETCH`, `COUNT(*)` via `$queryRaw` |
| 21 | GET | `/:id` | `transactionController.getById` | ORM | `transactionRepository.findById` | `SELECT * FROM [Transaction] WHERE id = @p1` with deep includes (post, poster, offerer, offer, messages) |
| 22 | POST | `/:id/complete` | `transactionController.markComplete` | ORM + **Raw SQL** | `transactionRepository.update` → `userRepository.updateReputation` | `UPDATE [Transaction]` (ORM) → `SELECT AVG/COUNT FROM [Rating]` + `SELECT COUNT FROM [Transaction]` + `UPDATE [User] SET reputation` (all Raw SQL) |
| 23 | POST | `/:id/cancel` | `transactionController.cancel` | ORM | `transactionRepository.update` + `postRepository.update` | `UPDATE [Transaction]` → `UPDATE [Post]` |

---

## 5. Chat Routes — `/api/chat`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 24 | GET | `/unread` | `chatController.getUnreadCount` | **Raw SQL** | `messageRepository.getUnreadCount` | `SELECT COUNT(*) FROM [Message] JOIN [Transaction] WHERE (posterId=@p1 OR offererId=@p1) AND senderId != @p1 AND isRead = 0` via `$queryRaw` |
| 25 | GET | `/:transactionId` | `chatController.getMessages` | **Raw SQL** | `messageRepository.findByTransaction` | `SELECT` with `JOIN [User]`, `ORDER BY createdAt`, `OFFSET/FETCH`, `COUNT(*)` via `$queryRaw` |
| 26 | POST | `/` | `chatController.sendMessage` | ORM | `messageRepository.create` | `INSERT INTO [Message]` |

---

## 6. User Routes — `/api/users`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 27 | GET | `/profile` | `userController.getProfile` | ORM | `userRepository.findById` | `SELECT * FROM [User] WHERE id = @p1` |
| 28 | PUT | `/profile` | `userController.updateProfile` | ORM | `userRepository.update` | `UPDATE [User] SET ... WHERE id = @p1` |
| 29 | GET | `/leaderboard` | `userController.getLeaderboard` | ORM | `userRepository.getLeaderboard` | `SELECT TOP(N) * FROM [User] ORDER BY reputation DESC` |
| 30 | GET | `/:id` | `userController.getPublicProfile` | ORM | `userRepository.findById` | `SELECT * FROM [User] WHERE id = @p1` |
| 31 | GET | `/:id/ratings` | `ratingController.getByUser` | **Raw SQL** | `ratingRepository.findByReceiver` | `SELECT` with `JOIN [User] AS giver`, `WHERE receiverId = @p1`, `OFFSET/FETCH`, `COUNT(*)` via `$queryRaw` |
| 32 | GET | `/:id/rating-stats` | `userController.getRatingStats` | **Raw SQL** | `ratingRepository.getStats` | `SELECT AVG(score), COUNT(*) FROM [Rating]` + `SELECT score, COUNT(*) GROUP BY score` via `$queryRaw` |
| 33 | POST | `/ratings` | `ratingController.create` | ORM + **Raw SQL** | `ratingRepository.create` → `userRepository.updateReputation` | `INSERT INTO [Rating]` (ORM) → reputation recalc (Raw SQL) |
| 34 | GET | `/ratings/:id` | `ratingController.getById` | ORM | `ratingRepository.findById` | `SELECT * FROM [Rating] WHERE id = @p1` |
| 35 | PUT | `/ratings/:id` | `ratingController.update` | ORM + **Raw SQL** | `ratingRepository.update` → `userRepository.updateReputation` | `UPDATE [Rating]` (ORM) → reputation recalc (Raw SQL) |
| 36 | DELETE | `/ratings/:id` | `ratingController.delete` | ORM + **Raw SQL** | `ratingRepository.softDelete` → `userRepository.updateReputation` | `UPDATE [Rating] SET isDeleted=1` (ORM) → reputation recalc (Raw SQL) |

---

## 7. Notification & Report Routes — `/api/`

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 37 | POST | `/reports` | `reportController.create` | ORM | `reportRepository.create` | `INSERT INTO [Report]` |
| 38 | GET | `/notifications` | `notificationController.getMyNotifications` | **Raw SQL** | `notificationRepository.findByUser` | `SELECT` with `ORDER BY createdAt DESC`, `OFFSET/FETCH`, `COUNT(*)` total, `COUNT(*)` unread — 3 raw queries via `$queryRaw` |
| 39 | PATCH | `/notifications/:id/read` | `notificationController.markAsRead` | ORM | `notificationRepository.markAsRead` | `UPDATE [Notification] SET isRead = 1 WHERE id = @p1` |
| 40 | PATCH | `/notifications/read-all` | `notificationController.markAllAsRead` | ORM | `notificationRepository.markAllAsRead` | `UPDATE [Notification] SET isRead = 1 WHERE userId = @p1` |
| 41 | DELETE | `/notifications/:id` | `notificationController.delete` | ORM | `notificationRepository.delete` | `DELETE FROM [Notification] WHERE id = @p1` |

---

## 8. Admin Routes — `/api/admin` (all require admin role)

| # | Method | Endpoint | Controller Method | Query Type | Repository Method | SQL Summary |
|---|--------|----------|-------------------|------------|-------------------|-------------|
| 42 | GET | `/dashboard` | `adminController.getDashboard` | ORM | `prisma.user.count` + `prisma.post.count` + `prisma.transaction.count` + `prisma.report.count` | 6× `SELECT COUNT(*) FROM [table] WHERE ...` (parallel Promise.all) |
| 43 | GET | `/users` | `adminController.getUsers` | **Raw SQL** | `userRepository.findAll` | Dynamic `SELECT` with `WHERE` search filter, `OFFSET/FETCH`, `COUNT(*)` via `$queryRawUnsafe` |
| 44 | POST | `/users/ban` | `adminController.banUser` | ORM | `userRepository.update` + `notificationRepository.create` | `UPDATE [User] SET isBanned=1` → `INSERT [Notification]` |
| 45 | POST | `/users/:id/unban` | `adminController.unbanUser` | ORM | `userRepository.update` + `notificationRepository.create` | `UPDATE [User] SET isBanned=0` → `INSERT [Notification]` |
| 46 | GET | `/reports` | `adminController.getReports` | ORM | `reportRepository.findAll` | `SELECT * FROM [Report]` with pagination, `include: { reporter, reportedUser }` |
| 47 | POST | `/reports/resolve` | `adminController.resolveReport` | ORM | `reportRepository.update` + `notificationRepository.create` | `UPDATE [Report]` → `INSERT [Notification]` |
| 48 | DELETE | `/reports/:id` | `adminController.deleteReport` | ORM | `reportRepository.softDelete` | `UPDATE [Report] SET isDeleted = 1 WHERE id = @p1` |
| 49 | GET | `/transactions` | `adminController.getAllTransactions` | **Raw SQL** | `transactionRepository.findAll` | Dynamic `SELECT` with 3 JOINs, optional status filter, `OFFSET/FETCH`, `COUNT(*)` via `$queryRawUnsafe` |
| 50 | POST | `/transactions/:id/force-cancel` | `adminController.forceCancel` | ORM | `transactionRepository.update` | `UPDATE [Transaction] SET status='CANCELLED'` |

---

## 9. View Routes — `/api/views` (all use Raw SQL via `viewRepository`)

These endpoints query **SQL Server Views** and complex aggregations — all use `$queryRaw`.

### Public (no auth)

| # | Method | Endpoint | View/Query Used | SQL Summary |
|---|--------|----------|-----------------|-------------|
| 51 | GET | `/leaderboard` | `vw_Leaderboard` | `SELECT * FROM vw_Leaderboard ORDER BY reputation DESC` |
| 52 | GET | `/marketplace` | `vw_ActivePostsByCategory` | `SELECT * FROM vw_ActivePostsByCategory WHERE category = @p1` (or all) |
| 53 | GET | `/search` | Direct query | `SELECT * FROM [Post] JOIN [User] WHERE title LIKE '%@p1%' OR description LIKE '%@p1%'` |
| 54 | GET | `/top-rated` | `vw_UserRatingStats` | `SELECT * FROM vw_UserRatingStats ORDER BY avgScore DESC OFFSET/FETCH` |
| 55 | GET | `/categories` | `vw_PopularCategories` | `SELECT * FROM vw_PopularCategories ORDER BY postCount DESC` |
| 56 | GET | `/recent-exchanges` | `vw_UserExchangeHistory` | `SELECT * FROM vw_UserExchangeHistory WHERE status = 'SUCCESSFUL' ORDER BY completedAt DESC` |
| 57 | GET | `/expiring-posts` | Direct query | `SELECT * FROM [Post] JOIN [User] WHERE expiresAt BETWEEN NOW AND NOW+48h` |

### Authenticated User

| # | Method | Endpoint | View/Query Used | SQL Summary |
|---|--------|----------|-----------------|-------------|
| 58 | GET | `/user/:id/rating-stats` | `vw_UserRatingStats` | `SELECT * FROM vw_UserRatingStats WHERE userId = @p1` |
| 59 | GET | `/user/:id/profile-stats` | Multi-table aggregation | `SELECT` with subqueries: post count, completed transactions, avg rating, total exchanges |
| 60 | GET | `/user/:id/exchange-history` | `vw_UserExchangeHistory` | `SELECT * FROM vw_UserExchangeHistory WHERE posterId = @p1 OR offererId = @p1` |
| 61 | GET | `/user/:id/conversations` | Multi-table join | `SELECT` with `JOIN [Transaction]`, `JOIN [User]`, `JOIN [Message]` — latest message per conversation |
| 62 | GET | `/user/:id/pending-offers` | Direct query | `SELECT * FROM [Offer] JOIN [Post] WHERE post.userId = @p1 AND offer.status = 'PENDING'` grouped by post |

### Authenticated + Transaction

| # | Method | Endpoint | View/Query Used | SQL Summary |
|---|--------|----------|-----------------|-------------|
| 63 | GET | `/transaction/:id/summary` | `vw_TransactionSummary` | `SELECT * FROM vw_TransactionSummary WHERE id = @p1` |

### Admin Only

| # | Method | Endpoint | View/Query Used | SQL Summary |
|---|--------|----------|-----------------|-------------|
| 64 | GET | `/admin/dashboard` | `vw_AdminDashboard` | `SELECT * FROM vw_AdminDashboard` (user/post/transaction/report counts) |
| 65 | GET | `/admin/pending-reports` | `vw_PendingReports` | `SELECT * FROM vw_PendingReports ORDER BY createdAt` with pagination |
| 66 | GET | `/admin/post-distribution` | `vw_PostStatusDistribution` | `SELECT * FROM vw_PostStatusDistribution` |
| 67 | GET | `/admin/completion-rate` | Aggregation query | `SELECT status, COUNT(*), percentage FROM [Transaction] GROUP BY status` |
| 68 | GET | `/admin/monthly-activity` | Aggregation query | `SELECT month, newUsers, newPosts, completedTransactions GROUP BY month` |

---

## 10. Cron Jobs (Background — no API endpoint)

| Job | Schedule | Query Type | Repository Method | SQL Summary |
|-----|----------|------------|-------------------|-------------|
| Expire Posts | Every 15 min | ORM | `postRepository.expirePosts` | `UPDATE [Post] SET status='EXPIRED' WHERE expiresAt < NOW AND status='ACTIVE'` |
| Expire Offers | Every 15 min | ORM | `offerRepository.expireOffers` | `UPDATE [Offer] SET status='EXPIRED' WHERE ...` |
| Expire Transactions | Every 30 min | ORM | `transactionRepository.expireTransactions` + `prisma.post.updateMany` | `UPDATE [Transaction]` → `UPDATE [Post]` |
| Leaderboard Snapshot | Weekly | ORM | `prisma.user.findMany` + `prisma.rating.groupBy` + `prisma.leaderboardSnapshot.createMany` | `SELECT TOP(100) FROM [User]` → `SELECT userId, AVG(score) FROM [Rating] GROUP BY userId` → `INSERT INTO [LeaderboardSnapshot]` |

---

## 11. Socket.IO Events (Real-time — no REST endpoint)

| Event | Direction | Query Type | Repository Method | SQL Summary |
|-------|-----------|------------|-------------------|-------------|
| `message:send` | Client → Server | ORM | `messageRepository.create` | `INSERT INTO [Message]` |
| `message:read` | Client → Server | ORM | `messageRepository.markAsRead` | `UPDATE [Message] SET isRead = 1 WHERE transactionId = @p1` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Total API Endpoints** | **68** |
| Endpoints using **ORM only** | 32 |
| Endpoints using **Raw SQL only** | 26 |
| Endpoints using **ORM + Raw SQL** (mixed) | 4 |
| Endpoints with **no DB query** (static/logout) | 2 |
| Background **Cron Jobs** | 4 (all ORM) |
| **Socket.IO** events | 2 (all ORM) |

### Raw SQL Breakdown

| Raw SQL Method | Used In | Purpose |
|----------------|---------|---------|
| `$queryRaw` (tagged template) | 7 repositories | Parameterized queries — safe from SQL injection |
| `$queryRawUnsafe` (string) | 3 repositories | Dynamic WHERE/ORDER clauses built at runtime |
| `$executeRaw` | `userRepository.updateReputation` | Raw UPDATE with computed values |

### ORM (Prisma Client) Operations Used

| Prisma Method | Used For |
|---------------|----------|
| `findUnique` | Single record by ID/email |
| `findMany` | List with filters (leaderboard, reports, cron) |
| `create` | Insert new records |
| `update` | Modify single record |
| `updateMany` | Bulk status changes (expire, reject offers) |
| `count` | Dashboard statistics |
| `groupBy` | Rating aggregation in cron |
| `delete` | Hard delete (notifications only) |
| `$transaction` | Atomic multi-table writes |

---

## SQL Views Used (defined in `prisma/views.sql`)

| View Name | Queried By Endpoint |
|-----------|-------------------|
| `vw_Leaderboard` | `/api/views/leaderboard` |
| `vw_ActivePostsByCategory` | `/api/views/marketplace` |
| `vw_UserRatingStats` | `/api/views/top-rated`, `/api/views/user/:id/rating-stats` |
| `vw_TransactionSummary` | `/api/views/transaction/:id/summary` |
| `vw_PendingReports` | `/api/views/admin/pending-reports` |
| `vw_PopularCategories` | `/api/views/categories` |
| `vw_UserExchangeHistory` | `/api/views/recent-exchanges`, `/api/views/user/:id/exchange-history` |
| `vw_AdminDashboard` | `/api/views/admin/dashboard` |
| `vw_PostStatusDistribution` | `/api/views/admin/post-distribution` |

---

*Generated for AlchEx project — Database Systems deliverable reference.*
