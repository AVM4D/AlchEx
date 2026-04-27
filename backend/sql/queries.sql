-- ============================================================================
-- AlchEx – Student Exchange Platform
-- DQL Queries & CRUD Operations (BCNF Schema)
-- Database: SQL Server (via mssql native driver)
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: SQL VIEWS (moved to views.sql — executed by setup.ts)
-- ════════════════════════════════════════════════════════════════════════════
-- See: backend/sql/views.sql


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: STORED PROCEDURES (moved to stored_procedures.sql)
-- ════════════════════════════════════════════════════════════════════════════
-- See: backend/sql/stored_procedures.sql
-- 14 stored procedures for all major business workflows:
--   sp_AcceptOffer, sp_CompleteTransaction, sp_CancelTransaction,
--   sp_RecalculateReputation, sp_ExpirePosts, sp_ExpireOffers,
--   sp_ExpireTransactions, sp_BanUser, sp_UnbanUser, sp_CreateReport,
--   sp_ResolveReport, sp_DailyLeaderboardSnapshot, sp_GetDashboardStats,
--   sp_CreateRating


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: DQL SELECT QUERIES (Functional Queries)
-- ════════════════════════════════════════════════════════════════════════════


-- Q1: Top 5 Exchangers (Leaderboard)
SELECT TOP 5 * FROM vw_Leaderboard ORDER BY [rank] ASC;

-- Q2: Top 10 Highest Rated Users
SELECT TOP 10 userId, firstName, lastName, averageRating, totalRatings
FROM vw_UserRatingStats WHERE totalRatings > 0
ORDER BY averageRating DESC, totalRatings DESC;

-- Q3: Browse Marketplace – Active Posts (with pagination)
SELECT * FROM vw_ActivePostsByCategory
ORDER BY createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;

-- Q4: Search Posts by Keyword
SELECT * FROM vw_ActivePostsByCategory
WHERE title LIKE '%programming%' OR description LIKE '%programming%'
   OR whatINeed LIKE '%programming%' OR whatIOffer LIKE '%programming%'
ORDER BY createdAt DESC;

-- Q5: Filter Posts by Category
SELECT * FROM vw_ActivePostsByCategory
WHERE category = 'Tutoring'
ORDER BY createdAt DESC;

-- Q6: Get All Offers for a Specific Post
SELECT o.id AS offerId, o.proposalDescription, o.counterExchange,
       o.status AS offerStatus, o.expiresAt, o.createdAt,
       u.id AS offererId, u.firstName, u.lastName, u.profilePicture, u.reputationScore
FROM offers o
JOIN users u ON u.id = o.userId
WHERE o.postId = '<post_id>' AND o.isDeleted = 0
ORDER BY o.createdAt DESC;

-- Q7: Posts Created by a Specific User
SELECT p.id, p.title, p.description, c.name AS category,
       p.status, p.expiresAt, p.createdAt,
       ISNULL(oc.offerCount, 0) AS offerCount
FROM posts p
JOIN categories c ON c.id = p.categoryId
LEFT JOIN (
    SELECT postId, COUNT(*) AS offerCount FROM offers WHERE isDeleted = 0 GROUP BY postId
) oc ON oc.postId = p.id
WHERE p.userId = '<user_id>' AND p.isDeleted = 0
ORDER BY p.createdAt DESC;

-- Q8: Offers Made by a Specific User
SELECT o.id AS offerId, o.proposalDescription, o.counterExchange,
       o.status AS offerStatus, o.createdAt,
       p.id AS postId, p.title AS postTitle, p.status AS postStatus
FROM offers o
JOIN posts p ON p.id = o.postId
WHERE o.userId = '<user_id>' AND o.isDeleted = 0
ORDER BY o.createdAt DESC;

-- Q9: Transaction History for a User
SELECT * FROM vw_UserExchangeHistory
WHERE userId = '<user_id>'
ORDER BY createdAt DESC;

-- Q10: Chat Messages in a Transaction (paginated)
SELECT m.id, m.content, m.messageType, m.isRead, m.createdAt,
       u.id AS senderId, u.firstName AS senderFirstName,
       u.lastName AS senderLastName, u.profilePicture
FROM messages m
JOIN users u ON u.id = m.senderId
WHERE m.transactionId = '<transaction_id>' AND m.isDeleted = 0
ORDER BY m.createdAt ASC
OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY;

-- Q11: Ratings Received by a User
SELECT r.id AS ratingId, r.score, r.review, r.createdAt,
       g.id AS giverId, g.firstName AS giverFirstName,
       g.lastName AS giverLastName, g.profilePicture
FROM ratings r
JOIN users g ON g.id = r.giverId
WHERE r.receiverId = '<user_id>' AND r.isDeleted = 0
ORDER BY r.createdAt DESC;

-- Q12: Rating Stats for a User
SELECT * FROM vw_UserRatingStats WHERE userId = '<user_id>';

-- Q13: Most Popular Categories
SELECT * FROM vw_PopularCategories ORDER BY totalPosts DESC;

-- Q14: User Profile with Exchange Stats
SELECT u.id, u.firstName, u.lastName, u.email, u.profilePicture, u.bio,
       u.batch, p.name AS program, u.section,
       uni.name AS university, uni.campus,
       u.reputationScore, u.totalExchanges, u.createdAt,
       ISNULL(rs.averageRating, 0) AS averageRating,
       ISNULL(rs.totalRatings, 0) AS totalRatings,
       ISNULL(pc.postCount, 0) AS totalPosts,
       ISNULL(oc2.offerCount, 0) AS totalOffers
FROM users u
LEFT JOIN programs p ON p.id = u.programId
LEFT JOIN universities uni ON uni.id = u.universityId
LEFT JOIN vw_UserRatingStats rs ON rs.userId = u.id
LEFT JOIN (SELECT userId, COUNT(*) AS postCount FROM posts WHERE isDeleted = 0 GROUP BY userId) pc ON pc.userId = u.id
LEFT JOIN (SELECT userId, COUNT(*) AS offerCount FROM offers WHERE isDeleted = 0 GROUP BY userId) oc2 ON oc2.userId = u.id
WHERE u.id = '<user_id>' AND u.isDeleted = 0;

-- Q15: Pending Offers per Post (for post owners)
SELECT p.id AS postId, p.title, COUNT(o.id) AS pendingOfferCount
FROM posts p
LEFT JOIN offers o ON o.postId = p.id AND o.status = 'PENDING' AND o.isDeleted = 0
WHERE p.userId = '<user_id>' AND p.status = 'ACTIVE' AND p.isDeleted = 0
GROUP BY p.id, p.title ORDER BY pendingOfferCount DESC;

-- Q16: Transaction Completion Rate
SELECT COUNT(*) AS totalTransactions,
       SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END) AS successful,
       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
       SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS expired,
       SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) AS inProgress,
       CAST(SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END) * 100.0
            / NULLIF(COUNT(*), 0) AS DECIMAL(5,2)) AS completionRatePercent
FROM transactions WHERE isDeleted = 0;

-- Q17: Recently Completed Exchanges
SELECT TOP 10 transactionId, transactionStatus, postTitle, category,
       requesterFirstName, requesterLastName, offererFirstName, offererLastName, completedAt
FROM vw_TransactionSummary
WHERE transactionStatus = 'SUCCESSFUL'
ORDER BY completedAt DESC;

-- Q18: Admin – All Users with Ban Status
SELECT u.id, u.firstName, u.lastName, u.email, u.role,
       u.isBanned, u.banReason, u.reputationScore, u.totalExchanges, u.createdAt
FROM users u WHERE u.isDeleted = 0 ORDER BY u.createdAt DESC;

-- Q19: Admin – Pending Reports
SELECT * FROM vw_PendingReports ORDER BY createdAt DESC;

-- Q20: Admin – Dashboard Statistics (via stored procedure)
EXEC sp_GetDashboardStats;

-- Q21: Post Status Distribution
SELECT * FROM vw_PostStatusDistribution;

-- Q22: Notifications for a User
SELECT id, type, title, message, referenceId, referenceType, isRead, createdAt
FROM notifications WHERE userId = '<user_id>'
ORDER BY createdAt DESC OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;

-- Unread count
SELECT COUNT(*) AS unreadCount FROM notifications WHERE userId = '<user_id>' AND isRead = 0;

-- Q23: Expiring Posts (next 24h)
SELECT p.id, p.title, c.name AS category, p.expiresAt,
       u.firstName, u.lastName,
       DATEDIFF(HOUR, GETDATE(), p.expiresAt) AS hoursRemaining
FROM posts p
JOIN users u ON u.id = p.userId
JOIN categories c ON c.id = p.categoryId
WHERE p.status = 'ACTIVE' AND p.isDeleted = 0
  AND p.expiresAt BETWEEN GETDATE() AND DATEADD(HOUR, 24, GETDATE())
ORDER BY p.expiresAt ASC;

-- Q24: Tags for a Post
SELECT t.name FROM post_tags pt JOIN tags t ON t.id = pt.tagId WHERE pt.postId = '<post_id>';

-- Q25: Monthly Exchange Activity
SELECT FORMAT(createdAt, 'yyyy-MM') AS month,
       COUNT(*) AS totalTransactions,
       SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END) AS successful,
       SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled
FROM transactions WHERE isDeleted = 0
GROUP BY FORMAT(createdAt, 'yyyy-MM') ORDER BY month DESC;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4: CRUD OPERATIONS (via repositories — parameterized SQL)
-- ════════════════════════════════════════════════════════════════════════════

-- ───────── USERS CRUD ─────────
-- Create User (Register)
INSERT INTO users (id, email, passwordHash, firstName, lastName, role, createdAt, updatedAt)
VALUES (NEWID(), 'student@university.edu', '<hashed>', 'John', 'Doe', 'STUDENT', GETDATE(), GETDATE());

-- Read User by ID (with joins)
SELECT u.*, p.name AS program, uni.name AS university, uni.campus
FROM users u
LEFT JOIN programs p ON p.id = u.programId
LEFT JOIN universities uni ON uni.id = u.universityId
WHERE u.id = '<user_id>' AND u.isDeleted = 0;

-- Update User Profile
UPDATE users SET firstName='John', lastName='Doe', bio='CS Student', batch='2024', updatedAt=GETDATE()
WHERE id = '<user_id>';

-- Soft Delete
UPDATE users SET isDeleted = 1, updatedAt = GETDATE() WHERE id = '<user_id>';


-- ───────── POSTS CRUD ─────────
-- Create Post (with category lookup)
DECLARE @catId INT;
SELECT @catId = id FROM categories WHERE name = 'Tutoring';
INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, categoryId, expiresAt, createdAt, updatedAt)
VALUES (NEWID(), '<user_id>', 'Need Help', 'Looking for tutoring', 'Calculus tutoring',
        'Programming help', @catId, DATEADD(DAY, 7, GETDATE()), GETDATE(), GETDATE());

-- Read Post by ID
SELECT p.*, c.name AS category, u.firstName, u.lastName FROM posts p
JOIN categories c ON c.id = p.categoryId
JOIN users u ON u.id = p.userId
WHERE p.id = '<post_id>' AND p.isDeleted = 0;

-- Update / Soft Delete
UPDATE posts SET title='Updated', updatedAt=GETDATE() WHERE id='<post_id>';
UPDATE posts SET isDeleted=1, updatedAt=GETDATE() WHERE id='<post_id>';


-- ───────── OFFERS CRUD ─────────
INSERT INTO offers (id, postId, userId, proposalDescription, status, createdAt, updatedAt)
VALUES (NEWID(), '<post_id>', '<user_id>', 'I can help!', 'PENDING', GETDATE(), GETDATE());

UPDATE offers SET proposalDescription='Updated', updatedAt=GETDATE() WHERE id='<offer_id>';
UPDATE offers SET isDeleted=1, updatedAt=GETDATE() WHERE id='<offer_id>';


-- ───────── TRANSACTIONS (via stored procedures) ─────────
-- Accept Offer → creates transaction atomically
DECLARE @txOut NVARCHAR(36);
EXEC sp_AcceptOffer @offerId='<offer_id>', @requesterId='<user_id>', @txId=@txOut OUTPUT;

-- Complete Transaction
DECLARE @done BIT;
EXEC sp_CompleteTransaction @transactionId='<tx_id>', @userId='<user_id>', @bothDone=@done OUTPUT;

-- Cancel Transaction
EXEC sp_CancelTransaction @transactionId='<tx_id>', @userId='<user_id>';

-- Admin Force Cancel
EXEC sp_CancelTransaction @transactionId='<tx_id>', @userId='<admin_id>', @isAdmin=1;


-- ───────── MESSAGES CRUD ─────────
INSERT INTO messages (id, transactionId, senderId, content, messageType, isRead, isDeleted, createdAt)
VALUES (NEWID(), '<tx_id>', '<sender_id>', 'Hello!', 'TEXT', 0, 0, GETDATE());

UPDATE messages SET isRead = 1
WHERE transactionId = '<tx_id>' AND senderId != '<user_id>' AND isRead = 0;


-- ───────── RATINGS (via stored procedure) ─────────
EXEC sp_CreateRating @ratingId=NEWID(), @transactionId='<tx_id>',
     @giverId='<giver_id>', @receiverId='<receiver_id>', @score=5, @review='Great!';


-- ───────── REPORTS (via stored procedure) ─────────
EXEC sp_CreateReport @reportId=NEWID(), @transactionId='<tx_id>',
     @reporterId='<reporter_id>', @targetUserId='<target_id>',
     @reason='Unresponsive', @description='No response after 3 days.';

EXEC sp_ResolveReport @reportId='<report_id>', @status='RESOLVED', @adminNotes='Investigated.';


-- ───────── NOTIFICATIONS CRUD ─────────
INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt)
VALUES (NEWID(), '<user_id>', 'SYSTEM', 'Welcome!', 'Welcome to AlchEx', 0, GETDATE());

UPDATE notifications SET isRead = 1 WHERE id = '<notif_id>' AND userId = '<user_id>';
UPDATE notifications SET isRead = 1 WHERE userId = '<user_id>' AND isRead = 0;
DELETE FROM notifications WHERE id = '<notif_id>' AND userId = '<user_id>';


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5: AUTOMATED / CRON JOB QUERIES (via stored procedures)
-- ════════════════════════════════════════════════════════════════════════════

-- Expire posts (every 15 min)
DECLARE @cnt1 INT;
EXEC sp_ExpirePosts @expiredCount = @cnt1 OUTPUT;

-- Expire offers (every 15 min)
DECLARE @cnt2 INT;
EXEC sp_ExpireOffers @expiredCount = @cnt2 OUTPUT;

-- Expire transactions + related posts (every 30 min)
DECLARE @cnt3 INT;
EXEC sp_ExpireTransactions @expiredCount = @cnt3 OUTPUT;

-- Daily leaderboard snapshot (midnight)
EXEC sp_DailyLeaderboardSnapshot;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6: REPUTATION RECALCULATION (via stored procedure)
-- ════════════════════════════════════════════════════════════════════════════
EXEC sp_RecalculateReputation @userId = '<user_id>';

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF QUERIES
-- ═══════════════════════════════════════════════════════════════════════════
