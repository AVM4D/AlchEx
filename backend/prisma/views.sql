-- ============================================================================
-- AlchEx – SQL Views
-- Run this file against your SQL Server database to create all views.
-- These views are queried by the Node.js API via Prisma $queryRaw.
-- ============================================================================

-- ─── VIEW 1: Leaderboard (Top Exchangers) ───
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

-- ─── VIEW 2: Active Posts by Category ───
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

-- ─── VIEW 3: User Rating Statistics ───
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

-- ─── VIEW 4: Transaction Summary ───
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

-- ─── VIEW 5: Pending Reports ───
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

-- ─── VIEW 6: Most Popular Categories ───
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

-- ─── VIEW 7: User Exchange History ───
CREATE OR ALTER VIEW vw_UserExchangeHistory AS
SELECT
    u.id       AS oduserId,
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

-- ─── VIEW 8: Unread Messages per User ───
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

-- ─── VIEW 9: Admin Dashboard Statistics ───
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

-- ─── VIEW 10: Post Status Distribution ───
CREATE OR ALTER VIEW vw_PostStatusDistribution AS
SELECT
    status,
    COUNT(*) AS postCount,
    CAST(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM posts WHERE isDeleted = 0), 0) AS DECIMAL(5,2)) AS percentage
FROM posts
WHERE isDeleted = 0
GROUP BY status;
GO
