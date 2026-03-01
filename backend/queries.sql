-- ============================================================================
-- AlchEx – Student Exchange Platform
-- DQL Queries & Views for All Project Functionalities
-- Database: SQL Server (via Prisma ORM)
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: SQL VIEWS
-- ════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- VIEW 1: Top Exchangers / Leaderboard
-- Shows top users ranked by reputation score with their stats
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_Leaderboard AS
SELECT
    u.id              AS userId,
    u.firstName,
    u.lastName,
    u.profilePicture,
    u.reputationScore,
    u.totalExchanges,
    ISNULL(r.avgRating, 0)   AS averageRating,
    ISNULL(r.totalRatings, 0) AS totalRatings,
    RANK() OVER (ORDER BY u.reputationScore DESC) AS rank
FROM users u
LEFT JOIN (
    SELECT receiverId,
           AVG(CAST(score AS FLOAT)) AS avgRating,
           COUNT(*)                  AS totalRatings
    FROM ratings
    WHERE isDeleted = 0
    GROUP BY receiverId
) r ON r.receiverId = u.id
WHERE u.isDeleted = 0
  AND u.isBanned  = 0
  AND u.totalExchanges > 0;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 2: Active Posts by Category (Marketplace Overview)
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_ActivePostsByCategory AS
SELECT
    p.id          AS postId,
    p.title,
    p.description,
    p.whatINeed,
    p.whatIOffer,
    p.category,
    p.tags,
    p.expiresAt,
    p.createdAt,
    u.id          AS userId,
    u.firstName,
    u.lastName,
    u.profilePicture,
    u.reputationScore,
    ISNULL(oc.offerCount, 0) AS offerCount
FROM posts p
JOIN users u ON u.id = p.userId
LEFT JOIN (
    SELECT postId, COUNT(*) AS offerCount
    FROM offers
    WHERE isDeleted = 0
    GROUP BY postId
) oc ON oc.postId = p.id
WHERE p.status    = 'ACTIVE'
  AND p.isDeleted = 0
  AND p.expiresAt > GETDATE();
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 3: User Rating Statistics
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_UserRatingStats AS
SELECT
    u.id         AS userId,
    u.firstName,
    u.lastName,
    ISNULL(AVG(CAST(r.score AS FLOAT)), 0) AS averageRating,
    COUNT(r.id)                             AS totalRatings,
    SUM(CASE WHEN r.score = 5 THEN 1 ELSE 0 END) AS fiveStarCount,
    SUM(CASE WHEN r.score = 4 THEN 1 ELSE 0 END) AS fourStarCount,
    SUM(CASE WHEN r.score = 3 THEN 1 ELSE 0 END) AS threeStarCount,
    SUM(CASE WHEN r.score = 2 THEN 1 ELSE 0 END) AS twoStarCount,
    SUM(CASE WHEN r.score = 1 THEN 1 ELSE 0 END) AS oneStarCount
FROM users u
LEFT JOIN ratings r ON r.receiverId = u.id AND r.isDeleted = 0
WHERE u.isDeleted = 0
GROUP BY u.id, u.firstName, u.lastName;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 4: Transaction Summary with Participants
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_TransactionSummary AS
SELECT
    t.id             AS transactionId,
    t.status         AS transactionStatus,
    t.requesterDone,
    t.offererDone,
    t.completedAt,
    t.cancelledAt,
    t.expiresAt,
    t.createdAt,
    p.id             AS postId,
    p.title          AS postTitle,
    p.category,
    req.id           AS requesterId,
    req.firstName    AS requesterFirstName,
    req.lastName     AS requesterLastName,
    off2.id          AS offererId,
    off2.firstName   AS offererFirstName,
    off2.lastName    AS offererLastName,
    o.proposalDescription,
    o.counterExchange
FROM transactions t
JOIN posts   p    ON p.id    = t.postId
JOIN offers  o    ON o.id    = t.offerId
JOIN users   req  ON req.id  = t.requesterId
JOIN users   off2 ON off2.id = t.offererId
WHERE t.isDeleted = 0;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 5: Pending Reports (Admin Dashboard)
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_PendingReports AS
SELECT
    r.id             AS reportId,
    r.reason,
    r.description    AS reportDescription,
    r.evidence,
    r.status         AS reportStatus,
    r.createdAt,
    reporter.id         AS reporterId,
    reporter.firstName  AS reporterFirstName,
    reporter.lastName   AS reporterLastName,
    target.id           AS targetUserId,
    target.firstName    AS targetFirstName,
    target.lastName     AS targetLastName,
    t.id                AS transactionId,
    p.title             AS postTitle
FROM reports r
JOIN users  reporter ON reporter.id = r.reporterId
JOIN users  target   ON target.id   = r.targetUserId
JOIN transactions t  ON t.id        = r.transactionId
LEFT JOIN posts p    ON p.id        = t.postId
WHERE r.status    = 'PENDING'
  AND r.isDeleted = 0;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 6: Most Popular Categories
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_PopularCategories AS
SELECT
    p.category,
    COUNT(*)                                              AS totalPosts,
    SUM(CASE WHEN p.status = 'ACTIVE' THEN 1 ELSE 0 END) AS activePosts,
    SUM(CASE WHEN p.status = 'SUCCESSFUL' THEN 1 ELSE 0 END) AS successfulPosts,
    ISNULL(SUM(oc.offerCount), 0)                         AS totalOffers
FROM posts p
LEFT JOIN (
    SELECT postId, COUNT(*) AS offerCount
    FROM offers
    WHERE isDeleted = 0
    GROUP BY postId
) oc ON oc.postId = p.id
WHERE p.isDeleted = 0
GROUP BY p.category;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 7: User Exchange History
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_UserExchangeHistory AS
SELECT
    u.id       AS userId,
    u.firstName,
    u.lastName,
    t.id       AS transactionId,
    t.status   AS transactionStatus,
    t.completedAt,
    t.createdAt,
    p.title    AS postTitle,
    p.category,
    CASE
        WHEN t.requesterId = u.id THEN 'REQUESTER'
        ELSE 'OFFERER'
    END AS userRole,
    partner.id        AS partnerId,
    partner.firstName AS partnerFirstName,
    partner.lastName  AS partnerLastName,
    rat.score         AS ratingGiven,
    ratR.score        AS ratingReceived
FROM users u
JOIN transactions t ON (t.requesterId = u.id OR t.offererId = u.id) AND t.isDeleted = 0
JOIN posts p ON p.id = t.postId
JOIN users partner ON partner.id = CASE
    WHEN t.requesterId = u.id THEN t.offererId
    ELSE t.requesterId
END
LEFT JOIN ratings rat  ON rat.transactionId = t.id AND rat.giverId    = u.id AND rat.isDeleted = 0
LEFT JOIN ratings ratR ON ratR.transactionId = t.id AND ratR.receiverId = u.id AND ratR.isDeleted = 0
WHERE u.isDeleted = 0;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 8: Unread Messages per User
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_UnreadMessagesPerUser AS
SELECT
    u.id         AS userId,
    u.firstName,
    u.lastName,
    COUNT(m.id)  AS unreadCount
FROM users u
JOIN transactions t ON (t.requesterId = u.id OR t.offererId = u.id) AND t.isDeleted = 0
JOIN messages m     ON m.transactionId = t.id
                   AND m.senderId != u.id
                   AND m.isRead = 0
                   AND m.isDeleted = 0
WHERE u.isDeleted = 0
GROUP BY u.id, u.firstName, u.lastName;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 9: Admin Dashboard Statistics
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_AdminDashboard AS
SELECT
    (SELECT COUNT(*) FROM users WHERE isDeleted = 0)                              AS totalUsers,
    (SELECT COUNT(*) FROM users WHERE isDeleted = 0 AND isBanned = 1)             AS bannedUsers,
    (SELECT COUNT(*) FROM posts WHERE isDeleted = 0)                              AS totalPosts,
    (SELECT COUNT(*) FROM posts WHERE status = 'ACTIVE' AND isDeleted = 0)        AS activePosts,
    (SELECT COUNT(*) FROM transactions WHERE isDeleted = 0)                       AS totalTransactions,
    (SELECT COUNT(*) FROM transactions WHERE status = 'IN_PROGRESS')              AS activeTransactions,
    (SELECT COUNT(*) FROM transactions WHERE status = 'SUCCESSFUL')               AS successfulTransactions,
    (SELECT COUNT(*) FROM transactions WHERE status = 'CANCELLED')                AS cancelledTransactions,
    (SELECT COUNT(*) FROM reports WHERE status = 'PENDING' AND isDeleted = 0)     AS pendingReports,
    (SELECT COUNT(*) FROM reports WHERE isDeleted = 0)                            AS totalReports,
    (SELECT COUNT(*) FROM offers  WHERE isDeleted = 0)                            AS totalOffers,
    (SELECT COUNT(*) FROM offers  WHERE status = 'PENDING' AND isDeleted = 0)     AS pendingOffers;
GO


-- ─────────────────────────────────────────────────────────
-- VIEW 10: Post Status Distribution
-- ─────────────────────────────────────────────────────────
CREATE OR ALTER VIEW vw_PostStatusDistribution AS
SELECT
    status,
    COUNT(*) AS postCount,
    CAST(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM posts WHERE isDeleted = 0), 0) AS DECIMAL(5,2)) AS percentage
FROM posts
WHERE isDeleted = 0
GROUP BY status;
GO


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: DQL SELECT QUERIES (Functional Queries)
-- ════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────
-- Q1: Top 5 Exchangers (Leaderboard)
-- ─────────────────────────────────────────────────────────
SELECT TOP 5 *
FROM vw_Leaderboard
ORDER BY rank ASC;


-- ─────────────────────────────────────────────────────────
-- Q2: Top 10 Highest Rated Users
-- ─────────────────────────────────────────────────────────
SELECT TOP 10
    userId, firstName, lastName,
    averageRating, totalRatings
FROM vw_UserRatingStats
WHERE totalRatings > 0
ORDER BY averageRating DESC, totalRatings DESC;


-- ─────────────────────────────────────────────────────────
-- Q3: Browse Marketplace – Active Posts (with pagination)
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_ActivePostsByCategory
ORDER BY createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;


-- ─────────────────────────────────────────────────────────
-- Q4: Search Posts by Keyword
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_ActivePostsByCategory
WHERE title       LIKE '%programming%'
   OR description LIKE '%programming%'
   OR whatINeed   LIKE '%programming%'
   OR whatIOffer  LIKE '%programming%'
ORDER BY createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q5: Filter Posts by Category
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_ActivePostsByCategory
WHERE category = 'TUTORING'
ORDER BY createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q6: Get All Offers for a Specific Post
-- ─────────────────────────────────────────────────────────
SELECT
    o.id          AS offerId,
    o.proposalDescription,
    o.counterExchange,
    o.status      AS offerStatus,
    o.expiresAt,
    o.createdAt,
    u.id          AS offererId,
    u.firstName,
    u.lastName,
    u.profilePicture,
    u.reputationScore
FROM offers o
JOIN users u ON u.id = o.userId
WHERE o.postId    = '<post_id>'
  AND o.isDeleted = 0
ORDER BY o.createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q7: Posts Created by a Specific User
-- ─────────────────────────────────────────────────────────
SELECT
    p.id, p.title, p.description, p.category,
    p.status, p.expiresAt, p.createdAt,
    ISNULL(oc.offerCount, 0) AS offerCount
FROM posts p
LEFT JOIN (
    SELECT postId, COUNT(*) AS offerCount
    FROM offers WHERE isDeleted = 0
    GROUP BY postId
) oc ON oc.postId = p.id
WHERE p.userId    = '<user_id>'
  AND p.isDeleted = 0
ORDER BY p.createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q8: Offers Made by a Specific User
-- ─────────────────────────────────────────────────────────
SELECT
    o.id          AS offerId,
    o.proposalDescription,
    o.counterExchange,
    o.status      AS offerStatus,
    o.createdAt,
    p.id          AS postId,
    p.title       AS postTitle,
    p.status      AS postStatus
FROM offers o
JOIN posts p ON p.id = o.postId
WHERE o.userId    = '<user_id>'
  AND o.isDeleted = 0
ORDER BY o.createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q9: Transaction History for a User
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_UserExchangeHistory
WHERE userId = '<user_id>'
ORDER BY createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q10: Chat Messages in a Transaction (paginated)
-- ─────────────────────────────────────────────────────────
SELECT
    m.id,
    m.content,
    m.messageType,
    m.isRead,
    m.createdAt,
    u.id         AS senderId,
    u.firstName  AS senderFirstName,
    u.lastName   AS senderLastName,
    u.profilePicture
FROM messages m
JOIN users u ON u.id = m.senderId
WHERE m.transactionId = '<transaction_id>'
  AND m.isDeleted     = 0
ORDER BY m.createdAt ASC
OFFSET 0 ROWS FETCH NEXT 50 ROWS ONLY;


-- ─────────────────────────────────────────────────────────
-- Q11: Ratings Received by a User
-- ─────────────────────────────────────────────────────────
SELECT
    r.id          AS ratingId,
    r.score,
    r.review,
    r.createdAt,
    g.id          AS giverId,
    g.firstName   AS giverFirstName,
    g.lastName    AS giverLastName,
    g.profilePicture
FROM ratings r
JOIN users g ON g.id = r.giverId
WHERE r.receiverId = '<user_id>'
  AND r.isDeleted  = 0
ORDER BY r.createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q12: Rating Stats for a User (score distribution)
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_UserRatingStats
WHERE userId = '<user_id>';


-- ─────────────────────────────────────────────────────────
-- Q13: Most Popular Categories
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_PopularCategories
ORDER BY totalPosts DESC;


-- ─────────────────────────────────────────────────────────
-- Q14: User Profile with Exchange Stats
-- ─────────────────────────────────────────────────────────
SELECT
    u.id, u.firstName, u.lastName, u.email,
    u.profilePicture, u.bio, u.batch, u.program,
    u.section, u.university, u.campus,
    u.reputationScore, u.totalExchanges,
    u.createdAt,
    ISNULL(rs.averageRating, 0) AS averageRating,
    ISNULL(rs.totalRatings, 0)  AS totalRatings,
    ISNULL(pc.postCount, 0)     AS totalPosts,
    ISNULL(oc2.offerCount, 0)   AS totalOffers
FROM users u
LEFT JOIN vw_UserRatingStats rs ON rs.userId = u.id
LEFT JOIN (
    SELECT userId, COUNT(*) AS postCount
    FROM posts WHERE isDeleted = 0
    GROUP BY userId
) pc ON pc.userId = u.id
LEFT JOIN (
    SELECT userId, COUNT(*) AS offerCount
    FROM offers WHERE isDeleted = 0
    GROUP BY userId
) oc2 ON oc2.userId = u.id
WHERE u.id = '<user_id>'
  AND u.isDeleted = 0;


-- ─────────────────────────────────────────────────────────
-- Q15: Pending Offers per Post (for post owners)
-- ─────────────────────────────────────────────────────────
SELECT
    p.id       AS postId,
    p.title,
    COUNT(o.id) AS pendingOfferCount
FROM posts p
LEFT JOIN offers o ON o.postId = p.id AND o.status = 'PENDING' AND o.isDeleted = 0
WHERE p.userId    = '<user_id>'
  AND p.status    = 'ACTIVE'
  AND p.isDeleted = 0
GROUP BY p.id, p.title
ORDER BY pendingOfferCount DESC;


-- ─────────────────────────────────────────────────────────
-- Q16: Transaction Completion Rate
-- ─────────────────────────────────────────────────────────
SELECT
    COUNT(*)                                                       AS totalTransactions,
    SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END)        AS successful,
    SUM(CASE WHEN status = 'CANCELLED'  THEN 1 ELSE 0 END)        AS cancelled,
    SUM(CASE WHEN status = 'EXPIRED'    THEN 1 ELSE 0 END)        AS expired,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END)       AS inProgress,
    CAST(
        SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END) * 100.0
        / NULLIF(COUNT(*), 0)
    AS DECIMAL(5,2)) AS completionRatePercent
FROM transactions
WHERE isDeleted = 0;


-- ─────────────────────────────────────────────────────────
-- Q17: Recently Completed Exchanges
-- ─────────────────────────────────────────────────────────
SELECT TOP 10
    transactionId, transactionStatus,
    postTitle, category,
    requesterFirstName, requesterLastName,
    offererFirstName, offererLastName,
    completedAt
FROM vw_TransactionSummary
WHERE transactionStatus = 'SUCCESSFUL'
ORDER BY completedAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q18: Admin – All Users with Ban Status
-- ─────────────────────────────────────────────────────────
SELECT
    id, firstName, lastName, email, role,
    isBanned, banReason, reputationScore,
    totalExchanges, createdAt
FROM users
WHERE isDeleted = 0
ORDER BY createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q19: Admin – Pending Reports (via view)
-- ─────────────────────────────────────────────────────────
SELECT *
FROM vw_PendingReports
ORDER BY createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q20: Admin – Dashboard Statistics (via view)
-- ─────────────────────────────────────────────────────────
SELECT * FROM vw_AdminDashboard;


-- ─────────────────────────────────────────────────────────
-- Q21: Post Status Distribution (via view)
-- ─────────────────────────────────────────────────────────
SELECT * FROM vw_PostStatusDistribution;


-- ─────────────────────────────────────────────────────────
-- Q22: Notifications for a User (with unread count)
-- ─────────────────────────────────────────────────────────
SELECT
    n.id, n.type, n.title, n.message,
    n.data, n.isRead, n.createdAt
FROM notifications n
WHERE n.userId = '<user_id>'
ORDER BY n.createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;

-- Unread count
SELECT COUNT(*) AS unreadCount
FROM notifications
WHERE userId = '<user_id>'
  AND isRead = 0;


-- ─────────────────────────────────────────────────────────
-- Q23: Expiring Posts (posts about to expire in next 24h)
-- ─────────────────────────────────────────────────────────
SELECT
    p.id, p.title, p.category, p.expiresAt,
    u.firstName, u.lastName,
    DATEDIFF(HOUR, GETDATE(), p.expiresAt) AS hoursRemaining
FROM posts p
JOIN users u ON u.id = p.userId
WHERE p.status    = 'ACTIVE'
  AND p.isDeleted = 0
  AND p.expiresAt BETWEEN GETDATE() AND DATEADD(HOUR, 24, GETDATE())
ORDER BY p.expiresAt ASC;


-- ─────────────────────────────────────────────────────────
-- Q24: User's Active Conversations (transactions with messages)
-- ─────────────────────────────────────────────────────────
SELECT
    t.id              AS transactionId,
    p.title           AS postTitle,
    partner.id        AS partnerId,
    partner.firstName AS partnerFirstName,
    partner.lastName  AS partnerLastName,
    partner.profilePicture,
    lastMsg.content   AS lastMessage,
    lastMsg.createdAt AS lastMessageAt,
    ISNULL(unread.cnt, 0) AS unreadCount
FROM transactions t
JOIN posts p ON p.id = t.postId
JOIN users partner ON partner.id = CASE
    WHEN t.requesterId = '<user_id>' THEN t.offererId
    ELSE t.requesterId
END
OUTER APPLY (
    SELECT TOP 1 content, createdAt
    FROM messages
    WHERE transactionId = t.id AND isDeleted = 0
    ORDER BY createdAt DESC
) lastMsg
LEFT JOIN (
    SELECT transactionId, COUNT(*) AS cnt
    FROM messages
    WHERE senderId != '<user_id>' AND isRead = 0 AND isDeleted = 0
    GROUP BY transactionId
) unread ON unread.transactionId = t.id
WHERE (t.requesterId = '<user_id>' OR t.offererId = '<user_id>')
  AND t.isDeleted = 0
  AND t.status = 'IN_PROGRESS'
ORDER BY lastMsg.createdAt DESC;


-- ─────────────────────────────────────────────────────────
-- Q25: Monthly Exchange Activity (for charts/analytics)
-- ─────────────────────────────────────────────────────────
SELECT
    FORMAT(createdAt, 'yyyy-MM') AS month,
    COUNT(*)                      AS totalTransactions,
    SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END) AS successful,
    SUM(CASE WHEN status = 'CANCELLED'  THEN 1 ELSE 0 END) AS cancelled
FROM transactions
WHERE isDeleted = 0
GROUP BY FORMAT(createdAt, 'yyyy-MM')
ORDER BY month DESC;


-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: CRUD OPERATIONS (used by Node.js APIs via Prisma ORM)
-- These are the SQL equivalents of what Prisma generates for each entity.
-- ════════════════════════════════════════════════════════════════════════════


-- ───────── USERS CRUD ─────────

-- Create User (Register)
INSERT INTO users (id, email, passwordHash, firstName, lastName, role, createdAt, updatedAt)
VALUES (NEWID(), 'student@university.edu', '<hashed_password>', 'John', 'Doe', 'STUDENT', GETDATE(), GETDATE());

-- Read User by ID
SELECT id, email, firstName, lastName, profilePicture, bio, batch, program,
       section, university, campus, socialLinks, role, reputationScore,
       totalExchanges, createdAt
FROM users
WHERE id = '<user_id>' AND isDeleted = 0;

-- Read User by Email (Login lookup)
SELECT * FROM users WHERE email = 'student@university.edu';

-- Update User Profile
UPDATE users
SET firstName = 'John', lastName = 'Doe', bio = 'CS Student',
    batch = '2024', program = 'BSCS', updatedAt = GETDATE()
WHERE id = '<user_id>';

-- Soft Delete User
UPDATE users
SET isDeleted = 1, updatedAt = GETDATE()
WHERE id = '<user_id>';

-- List All Users (Admin, paginated)
SELECT id, email, firstName, lastName, role, isBanned, reputationScore, createdAt
FROM users
WHERE isDeleted = 0
ORDER BY createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;


-- ───────── POSTS CRUD ─────────

-- Create Post
INSERT INTO posts (id, userId, title, description, whatINeed, whatIOffer, category, tags, expiresAt, createdAt, updatedAt)
VALUES (NEWID(), '<user_id>', 'Need Calculus Help', 'Looking for tutoring', 'Calculus tutoring',
        'Programming help in return', 'TUTORING', '["math","calculus"]',
        DATEADD(DAY, 7, GETDATE()), GETDATE(), GETDATE());

-- Read Post by ID
SELECT p.*, u.firstName, u.lastName, u.profilePicture
FROM posts p
JOIN users u ON u.id = p.userId
WHERE p.id = '<post_id>' AND p.isDeleted = 0;

-- Update Post
UPDATE posts
SET title = 'Updated Title', description = 'Updated desc', updatedAt = GETDATE()
WHERE id = '<post_id>';

-- Soft Delete Post
UPDATE posts
SET isDeleted = 1, updatedAt = GETDATE()
WHERE id = '<post_id>';

-- List Posts (Marketplace with filters)
SELECT p.*, u.firstName, u.lastName
FROM posts p
JOIN users u ON u.id = p.userId
WHERE p.status = 'ACTIVE' AND p.isDeleted = 0 AND p.expiresAt > GETDATE()
ORDER BY p.createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;


-- ───────── OFFERS CRUD ─────────

-- Create Offer
INSERT INTO offers (id, postId, userId, proposalDescription, counterExchange, expiresAt, createdAt, updatedAt)
VALUES (NEWID(), '<post_id>', '<user_id>', 'I can help with calculus',
        'Need help with web dev', DATEADD(HOUR, 48, GETDATE()), GETDATE(), GETDATE());

-- Read Offer by ID
SELECT o.*, u.firstName, u.lastName, p.title AS postTitle
FROM offers o
JOIN users u ON u.id = o.userId
JOIN posts p ON p.id = o.postId
WHERE o.id = '<offer_id>' AND o.isDeleted = 0;

-- Update Offer
UPDATE offers
SET proposalDescription = 'Updated proposal', updatedAt = GETDATE()
WHERE id = '<offer_id>';

-- Soft Delete Offer
UPDATE offers
SET isDeleted = 1, updatedAt = GETDATE()
WHERE id = '<offer_id>';

-- List Offers for a Post
SELECT o.*, u.firstName, u.lastName, u.reputationScore
FROM offers o
JOIN users u ON u.id = o.userId
WHERE o.postId = '<post_id>' AND o.isDeleted = 0
ORDER BY o.createdAt DESC;


-- ───────── TRANSACTIONS CRUD ─────────

-- Create Transaction (when offer is accepted)
INSERT INTO transactions (id, postId, offerId, requesterId, offererId, expiresAt, createdAt, updatedAt)
VALUES (NEWID(), '<post_id>', '<offer_id>', '<requester_id>', '<offerer_id>',
        DATEADD(DAY, 14, GETDATE()), GETDATE(), GETDATE());

-- Read Transaction by ID
SELECT t.*, p.title AS postTitle, o.proposalDescription,
       req.firstName AS requesterFirstName, off2.firstName AS offererFirstName
FROM transactions t
JOIN posts p ON p.id = t.postId
JOIN offers o ON o.id = t.offerId
JOIN users req ON req.id = t.requesterId
JOIN users off2 ON off2.id = t.offererId
WHERE t.id = '<transaction_id>' AND t.isDeleted = 0;

-- Update Transaction (mark complete)
UPDATE transactions
SET requesterDone = 1, updatedAt = GETDATE()
WHERE id = '<transaction_id>';

-- Soft Delete Transaction
UPDATE transactions
SET isDeleted = 1, updatedAt = GETDATE()
WHERE id = '<transaction_id>';

-- List Transactions for a User
SELECT t.*, p.title AS postTitle
FROM transactions t
JOIN posts p ON p.id = t.postId
WHERE (t.requesterId = '<user_id>' OR t.offererId = '<user_id>')
  AND t.isDeleted = 0
ORDER BY t.createdAt DESC;

-- List All Transactions (Admin)
SELECT t.*, p.title AS postTitle, req.firstName + ' ' + req.lastName AS requester,
       off2.firstName + ' ' + off2.lastName AS offerer
FROM transactions t
JOIN posts p ON p.id = t.postId
JOIN users req ON req.id = t.requesterId
JOIN users off2 ON off2.id = t.offererId
WHERE t.isDeleted = 0
ORDER BY t.createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;


-- ───────── MESSAGES CRUD ─────────

-- Create Message
INSERT INTO messages (id, transactionId, senderId, content, messageType, createdAt)
VALUES (NEWID(), '<transaction_id>', '<sender_id>', 'Hello! Ready to start the exchange?', 'TEXT', GETDATE());

-- Read Messages in a Transaction
SELECT m.*, u.firstName, u.lastName, u.profilePicture
FROM messages m
JOIN users u ON u.id = m.senderId
WHERE m.transactionId = '<transaction_id>' AND m.isDeleted = 0
ORDER BY m.createdAt ASC;

-- Update (Mark as Read)
UPDATE messages
SET isRead = 1
WHERE transactionId = '<transaction_id>'
  AND senderId != '<user_id>'
  AND isRead = 0;

-- Soft Delete Message
UPDATE messages
SET isDeleted = 1
WHERE id = '<message_id>';


-- ───────── RATINGS CRUD ─────────

-- Create Rating
INSERT INTO ratings (id, transactionId, giverId, receiverId, score, review, createdAt)
VALUES (NEWID(), '<transaction_id>', '<giver_id>', '<receiver_id>', 5, 'Great exchange partner!', GETDATE());

-- Read Rating by ID
SELECT r.*, g.firstName AS giverName, rec.firstName AS receiverName
FROM ratings r
JOIN users g ON g.id = r.giverId
JOIN users rec ON rec.id = r.receiverId
WHERE r.id = '<rating_id>' AND r.isDeleted = 0;

-- Update Rating
UPDATE ratings
SET score = 4, review = 'Updated review'
WHERE id = '<rating_id>';

-- Soft Delete Rating
UPDATE ratings
SET isDeleted = 1
WHERE id = '<rating_id>';

-- List Ratings for a User
SELECT r.*, g.firstName, g.lastName, g.profilePicture
FROM ratings r
JOIN users g ON g.id = r.giverId
WHERE r.receiverId = '<user_id>' AND r.isDeleted = 0
ORDER BY r.createdAt DESC;


-- ───────── REPORTS CRUD ─────────

-- Create Report
INSERT INTO reports (id, transactionId, reporterId, targetUserId, reason, description, createdAt, updatedAt)
VALUES (NEWID(), '<transaction_id>', '<reporter_id>', '<target_user_id>',
        'INAPPROPRIATE_BEHAVIOR', 'User was unresponsive and rude', GETDATE(), GETDATE());

-- Read Report by ID
SELECT r.*, reporter.firstName AS reporterName, target.firstName AS targetName
FROM reports r
JOIN users reporter ON reporter.id = r.reporterId
JOIN users target ON target.id = r.targetUserId
WHERE r.id = '<report_id>' AND r.isDeleted = 0;

-- Update Report (Admin resolve)
UPDATE reports
SET status = 'RESOLVED', adminNotes = 'Investigated and resolved', resolvedAt = GETDATE(), updatedAt = GETDATE()
WHERE id = '<report_id>';

-- Soft Delete Report
UPDATE reports
SET isDeleted = 1, updatedAt = GETDATE()
WHERE id = '<report_id>';

-- List Reports (Admin)
SELECT r.*, reporter.firstName + ' ' + reporter.lastName AS reporterName,
       target.firstName + ' ' + target.lastName AS targetName
FROM reports r
JOIN users reporter ON reporter.id = r.reporterId
JOIN users target ON target.id = r.targetUserId
WHERE r.isDeleted = 0
ORDER BY r.createdAt DESC;


-- ───────── NOTIFICATIONS CRUD ─────────

-- Create Notification
INSERT INTO notifications (id, userId, type, title, message, createdAt)
VALUES (NEWID(), '<user_id>', 'OFFER_RECEIVED', 'New Offer!', 'You received an offer on your post', GETDATE());

-- Read Notifications for User
SELECT * FROM notifications
WHERE userId = '<user_id>'
ORDER BY createdAt DESC
OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY;

-- Update (Mark as Read)
UPDATE notifications
SET isRead = 1
WHERE id = '<notification_id>' AND userId = '<user_id>';

-- Mark All as Read
UPDATE notifications
SET isRead = 1
WHERE userId = '<user_id>' AND isRead = 0;

-- Delete Notification
DELETE FROM notifications
WHERE id = '<notification_id>' AND userId = '<user_id>';
