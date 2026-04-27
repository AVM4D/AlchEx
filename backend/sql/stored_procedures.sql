-- =============================================
-- AlchEx – Stored Procedures
-- All major business workflows encapsulated
-- =============================================


-- ═══════════════════════════════════════════════════════════════
-- SP 1: sp_AcceptOffer
-- Atomically: accept offer → reject others → update post → create transaction
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_AcceptOffer]
    @offerId       NVARCHAR(36),
    @requesterId   NVARCHAR(36),
    @txId          NVARCHAR(36) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @postId    NVARCHAR(36);
    DECLARE @offererId NVARCHAR(36);
    DECLARE @expiresAt DATETIME2;

    -- Validate offer exists, is PENDING, belongs to active post
    SELECT @postId = o.postId, @offererId = o.userId
    FROM offers o
    JOIN posts p ON p.id = o.postId
    WHERE o.id = @offerId
      AND o.status = 'PENDING'
      AND o.isDeleted = 0
      AND p.status = 'ACTIVE'
      AND p.userId = @requesterId;

    IF @postId IS NULL
    BEGIN
        RAISERROR('Invalid offer or post state', 16, 1);
        RETURN;
    END

    SET @expiresAt = DATEADD(DAY, 14, GETDATE());
    SET @txId = NEWID();

    BEGIN TRANSACTION;

        -- Step 1: Accept the chosen offer
        UPDATE offers
        SET status = 'ACCEPTED', updatedAt = GETDATE()
        WHERE id = @offerId;

        -- Step 2: Reject all other pending offers on the same post
        UPDATE offers
        SET status = 'REJECTED', updatedAt = GETDATE()
        WHERE postId = @postId
          AND id != @offerId
          AND status = 'PENDING';

        -- Step 3: Set the post to IN_PROGRESS
        UPDATE posts
        SET status = 'IN_PROGRESS', updatedAt = GETDATE()
        WHERE id = @postId;

        -- Step 4: Create the transaction record
        INSERT INTO transactions
            (id, postId, offerId, requesterId, offererId, status,
             requesterDone, offererDone, requesterCancel, offererCancel,
             expiresAt, isDeleted, createdAt, updatedAt)
        VALUES
            (@txId, @postId, @offerId, @requesterId, @offererId,
             'IN_PROGRESS', 0, 0, 0, 0,
             @expiresAt, 0, GETDATE(), GETDATE());

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 2: sp_CompleteTransaction
-- Marks one side as done; if both done → set SUCCESSFUL + update post
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_CompleteTransaction]
    @transactionId  NVARCHAR(36),
    @userId         NVARCHAR(36),
    @bothDone       BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @requesterId   NVARCHAR(36);
    DECLARE @offererId     NVARCHAR(36);
    DECLARE @postId        NVARCHAR(36);
    DECLARE @newReqDone    BIT;
    DECLARE @newOffDone    BIT;

    SELECT @requesterId = requesterId, @offererId = offererId,
           @postId = postId,
           @newReqDone = requesterDone, @newOffDone = offererDone
    FROM transactions
    WHERE id = @transactionId AND status = 'IN_PROGRESS' AND isDeleted = 0;

    IF @requesterId IS NULL
    BEGIN
        RAISERROR('Transaction not found or not in progress', 16, 1);
        RETURN;
    END

    IF @userId != @requesterId AND @userId != @offererId
    BEGIN
        RAISERROR('User is not part of this transaction', 16, 1);
        RETURN;
    END

    -- Set the flag for whichever side this user is on
    IF @userId = @requesterId SET @newReqDone = 1;
    IF @userId = @offererId   SET @newOffDone = 1;

    SET @bothDone = 0;

    BEGIN TRANSACTION;

        IF @newReqDone = 1 AND @newOffDone = 1
        BEGIN
            -- Both sides done → complete
            SET @bothDone = 1;

            UPDATE transactions
            SET requesterDone = 1, offererDone = 1,
                status = 'SUCCESSFUL', completedAt = GETDATE(), updatedAt = GETDATE()
            WHERE id = @transactionId;

            UPDATE posts
            SET status = 'SUCCESSFUL', updatedAt = GETDATE()
            WHERE id = @postId;

            -- Recalculate reputation for both users
            EXEC sp_RecalculateReputation @userId = @requesterId;
            EXEC sp_RecalculateReputation @userId = @offererId;
        END
        ELSE
        BEGIN
            -- Only one side done so far
            UPDATE transactions
            SET requesterDone = @newReqDone, offererDone = @newOffDone,
                updatedAt = GETDATE()
            WHERE id = @transactionId;
        END

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 3: sp_CancelTransaction
-- Cancel by participant or admin (force)
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_CancelTransaction]
    @transactionId  NVARCHAR(36),
    @userId         NVARCHAR(36),
    @isAdmin        BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @requesterId NVARCHAR(36);
    DECLARE @offererId   NVARCHAR(36);
    DECLARE @postId      NVARCHAR(36);
    DECLARE @status      NVARCHAR(20);

    SELECT @requesterId = requesterId, @offererId = offererId,
           @postId = postId, @status = status
    FROM transactions
    WHERE id = @transactionId AND isDeleted = 0;

    IF @requesterId IS NULL
    BEGIN
        RAISERROR('Transaction not found', 16, 1);
        RETURN;
    END

    IF @status != 'IN_PROGRESS'
    BEGIN
        RAISERROR('Transaction is not in progress', 16, 1);
        RETURN;
    END

    IF @isAdmin = 0 AND @userId != @requesterId AND @userId != @offererId
    BEGIN
        RAISERROR('User is not part of this transaction', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

        UPDATE transactions
        SET status = 'CANCELLED',
            cancelledAt = GETDATE(),
            requesterCancel = CASE WHEN @userId = @requesterId THEN 1 ELSE requesterCancel END,
            offererCancel   = CASE WHEN @userId = @offererId   THEN 1 ELSE offererCancel END,
            updatedAt = GETDATE()
        WHERE id = @transactionId;

        UPDATE posts
        SET status = 'CANCELLED', updatedAt = GETDATE()
        WHERE id = @postId;

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 4: sp_RecalculateReputation
-- Formula: reputationScore = avgRating * 0.6 + normalizedExchanges * 0.4
-- Where normalizedExchanges = MIN(exchangeCount / 50, 1) * 5
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_RecalculateReputation]
    @userId  NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @avgRating    FLOAT = 0;
    DECLARE @ratingCount  INT = 0;
    DECLARE @exchangeCount INT = 0;
    DECLARE @normalizedEx FLOAT;
    DECLARE @newScore     FLOAT;

    -- Step 1: Get average rating
    SELECT @avgRating = ISNULL(AVG(CAST(score AS FLOAT)), 0),
           @ratingCount = COUNT(score)
    FROM ratings
    WHERE receiverId = @userId AND isDeleted = 0;

    -- Step 2: Count successful exchanges
    SELECT @exchangeCount = COUNT(*)
    FROM transactions
    WHERE (requesterId = @userId OR offererId = @userId)
      AND status = 'SUCCESSFUL';

    -- Step 3: Compute score
    SET @normalizedEx = CASE
        WHEN @exchangeCount >= 50 THEN 5.0
        ELSE (CAST(@exchangeCount AS FLOAT) / 50.0) * 5.0
    END;

    SET @newScore = ROUND(@avgRating * 0.6 + @normalizedEx * 0.4, 2);

    -- Step 4: Update
    UPDATE users
    SET reputationScore = @newScore,
        totalExchanges = @exchangeCount,
        updatedAt = GETDATE()
    WHERE id = @userId;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 5: sp_ExpirePosts
-- Expire active posts past their expiry date
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_ExpirePosts]
    @expiredCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE posts
    SET status = 'EXPIRED', updatedAt = GETDATE()
    WHERE status = 'ACTIVE'
      AND expiresAt <= GETDATE()
      AND isDeleted = 0;

    SET @expiredCount = @@ROWCOUNT;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 6: sp_ExpireOffers
-- Expire stale pending offers past their expiry date
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_ExpireOffers]
    @expiredCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE offers
    SET status = 'EXPIRED', updatedAt = GETDATE()
    WHERE status = 'PENDING'
      AND expiresAt <= GETDATE()
      AND isDeleted = 0;

    SET @expiredCount = @@ROWCOUNT;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 7: sp_ExpireTransactions
-- Expire in-progress transactions + their posts
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_ExpireTransactions]
    @expiredCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

        -- Expire transactions
        UPDATE transactions
        SET status = 'EXPIRED', updatedAt = GETDATE()
        WHERE status = 'IN_PROGRESS'
          AND expiresAt <= GETDATE()
          AND isDeleted = 0;

        SET @expiredCount = @@ROWCOUNT;

        -- Also expire the related posts
        IF @expiredCount > 0
        BEGIN
            UPDATE posts
            SET status = 'EXPIRED', updatedAt = GETDATE()
            WHERE status = 'IN_PROGRESS'
              AND id IN (
                SELECT p.id
                FROM posts p
                INNER JOIN transactions t ON t.postId = p.id
                WHERE t.status = 'EXPIRED'
              );
        END

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 8: sp_BanUser
-- Ban a user + send system notification
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_BanUser]
    @userId    NVARCHAR(36),
    @reason    NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @role NVARCHAR(10);
    SELECT @role = role FROM users WHERE id = @userId AND isDeleted = 0;

    IF @role IS NULL
    BEGIN
        RAISERROR('User not found', 16, 1);
        RETURN;
    END

    IF @role = 'ADMIN'
    BEGIN
        RAISERROR('Cannot ban an admin', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

        UPDATE users
        SET isBanned = 1, banReason = @reason, updatedAt = GETDATE()
        WHERE id = @userId;

        INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt)
        VALUES (NEWID(), @userId, 'SYSTEM', 'Account Suspended',
                'Your account has been suspended. Reason: ' + @reason, 0, GETDATE());

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 9: sp_UnbanUser
-- Unban a user + send system notification
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_UnbanUser]
    @userId    NVARCHAR(36)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

        UPDATE users
        SET isBanned = 0, banReason = NULL, updatedAt = GETDATE()
        WHERE id = @userId;

        INSERT INTO notifications (id, userId, type, title, message, isRead, createdAt)
        VALUES (NEWID(), @userId, 'SYSTEM', 'Account Reinstated',
                'Your account has been reinstated.', 0, GETDATE());

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 10: sp_CreateReport
-- File a report against another user
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_CreateReport]
    @reportId      NVARCHAR(36),
    @transactionId NVARCHAR(36),
    @reporterId    NVARCHAR(36),
    @targetUserId  NVARCHAR(36),
    @reason        NVARCHAR(100),
    @description   NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate reporter is part of the transaction
    IF NOT EXISTS (
        SELECT 1 FROM transactions
        WHERE id = @transactionId
          AND (requesterId = @reporterId OR offererId = @reporterId)
          AND isDeleted = 0
    )
    BEGIN
        RAISERROR('Reporter is not part of this transaction', 16, 1);
        RETURN;
    END

    INSERT INTO reports
        (id, transactionId, reporterId, targetUserId, reason, description,
         status, isDeleted, createdAt, updatedAt)
    VALUES
        (@reportId, @transactionId, @reporterId, @targetUserId,
         @reason, @description, 'PENDING', 0, GETDATE(), GETDATE());
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 11: sp_ResolveReport
-- Admin resolves/dismisses a report
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_ResolveReport]
    @reportId   NVARCHAR(36),
    @status     NVARCHAR(20),
    @adminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @reporterId NVARCHAR(36);

    SELECT @reporterId = reporterId
    FROM reports
    WHERE id = @reportId AND isDeleted = 0;

    IF @reporterId IS NULL
    BEGIN
        RAISERROR('Report not found', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

        UPDATE reports
        SET status = @status, adminNotes = @adminNotes,
            resolvedAt = GETDATE(), updatedAt = GETDATE()
        WHERE id = @reportId;

        INSERT INTO notifications (id, userId, type, title, message, referenceId, referenceType, isRead, createdAt)
        VALUES (NEWID(), @reporterId, 'REPORT_UPDATE', 'Report Updated',
                'Your report has been ' + LOWER(@status) + '.',
                @reportId, 'REPORT', 0, GETDATE());

    COMMIT TRANSACTION;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 12: sp_DailyLeaderboardSnapshot
-- Captures top 100 users into leaderboard_snapshots
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_DailyLeaderboardSnapshot]
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @now DATETIME2 = GETDATE();

    INSERT INTO leaderboard_snapshots
        (id, userId, [rank], reputationScore, totalExchanges, averageRating, period, snapshotDate, createdAt)
    SELECT
        NEWID(),
        u.id,
        ROW_NUMBER() OVER (ORDER BY u.reputationScore DESC),
        u.reputationScore,
        u.totalExchanges,
        ISNULL(r.avgRating, 0),
        'DAILY',
        @now,
        GETDATE()
    FROM users u
    LEFT JOIN (
        SELECT receiverId, AVG(CAST(score AS FLOAT)) AS avgRating
        FROM ratings WHERE isDeleted = 0
        GROUP BY receiverId
    ) r ON r.receiverId = u.id
    WHERE u.isDeleted = 0
      AND u.isBanned = 0
      AND u.totalExchanges > 0
    ORDER BY u.reputationScore DESC
    OFFSET 0 ROWS FETCH NEXT 100 ROWS ONLY;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 13: sp_GetDashboardStats
-- Returns admin dashboard statistics in a single query
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_GetDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        (SELECT COUNT(*) FROM users WHERE isDeleted = 0) AS totalUsers,
        (SELECT COUNT(*) FROM users WHERE isDeleted = 0 AND isBanned = 1) AS bannedUsers,
        (SELECT COUNT(*) FROM posts WHERE isDeleted = 0) AS totalPosts,
        (SELECT COUNT(*) FROM posts WHERE status = 'ACTIVE' AND isDeleted = 0) AS activePosts,
        (SELECT COUNT(*) FROM transactions WHERE isDeleted = 0) AS totalTransactions,
        (SELECT COUNT(*) FROM transactions WHERE status = 'IN_PROGRESS') AS activeTransactions,
        (SELECT COUNT(*) FROM transactions WHERE status = 'SUCCESSFUL') AS successfulTransactions,
        (SELECT COUNT(*) FROM transactions WHERE status = 'CANCELLED') AS cancelledTransactions,
        (SELECT COUNT(*) FROM reports WHERE status = 'PENDING' AND isDeleted = 0) AS pendingReports,
        (SELECT COUNT(*) FROM reports WHERE isDeleted = 0) AS totalReports,
        (SELECT COUNT(*) FROM offers WHERE isDeleted = 0) AS totalOffers,
        (SELECT COUNT(*) FROM offers WHERE status = 'PENDING' AND isDeleted = 0) AS pendingOffers;
END;
GO


-- ═══════════════════════════════════════════════════════════════
-- SP 14: sp_CreateRating
-- Creates a rating and recalculates receiver reputation
-- ═══════════════════════════════════════════════════════════════
CREATE OR ALTER PROCEDURE [dbo].[sp_CreateRating]
    @ratingId       NVARCHAR(36),
    @transactionId  NVARCHAR(36),
    @giverId        NVARCHAR(36),
    @receiverId     NVARCHAR(36),
    @score          INT,
    @review         NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Validate score range
    IF @score < 1 OR @score > 5
    BEGIN
        RAISERROR('Score must be between 1 and 5', 16, 1);
        RETURN;
    END

    -- Validate transaction is SUCCESSFUL
    IF NOT EXISTS (
        SELECT 1 FROM transactions
        WHERE id = @transactionId AND status = 'SUCCESSFUL' AND isDeleted = 0
    )
    BEGIN
        RAISERROR('Can only rate successful exchanges', 16, 1);
        RETURN;
    END

    -- Check for duplicate rating
    IF EXISTS (
        SELECT 1 FROM ratings
        WHERE transactionId = @transactionId AND giverId = @giverId
    )
    BEGIN
        RAISERROR('Already rated this exchange', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

        INSERT INTO ratings (id, transactionId, giverId, receiverId, score, review, isDeleted, createdAt)
        VALUES (@ratingId, @transactionId, @giverId, @receiverId, @score, @review, 0, GETDATE());

        -- Recalculate receiver reputation
        EXEC sp_RecalculateReputation @userId = @receiverId;

        -- Send notification
        INSERT INTO notifications (id, userId, type, title, message, referenceId, referenceType, isRead, createdAt)
        VALUES (NEWID(), @receiverId, 'RATING_RECEIVED', 'New Rating Received',
                'You received a ' + CAST(@score AS NVARCHAR) + '-star rating!',
                @transactionId, 'TRANSACTION', 0, GETDATE());

    COMMIT TRANSACTION;
END;
GO


-- =============================================
-- END OF STORED PROCEDURES
-- =============================================
