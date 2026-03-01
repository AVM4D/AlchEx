-- =============================================
-- AlchEx Database Schema (SQL Server)
-- Student Exchange Platform
-- =============================================

-- ─── TABLE: users ───────────────────────────
-- Stores all platform users (students & admins)
-- Role: 'STUDENT' | 'ADMIN'

CREATE TABLE [dbo].[users] (
    [id]                  NVARCHAR(1000)   NOT NULL,
    [email]               NVARCHAR(1000)   NOT NULL,
    [passwordHash]        NVARCHAR(1000)   NOT NULL,
    [firstName]           NVARCHAR(1000)   NOT NULL,
    [lastName]            NVARCHAR(1000)   NOT NULL,
    [profilePicture]      NVARCHAR(1000)   NULL,
    [bio]                 NVARCHAR(1000)   NULL,
    [batch]               NVARCHAR(1000)   NULL,
    [program]             NVARCHAR(1000)   NULL,
    [section]             NVARCHAR(1000)   NULL,
    [university]          NVARCHAR(1000)   NULL,
    [campus]              NVARCHAR(1000)   NULL,
    [socialLinks]         NVARCHAR(1000)   NULL,          -- JSON string
    [role]                NVARCHAR(1000)   NOT NULL  CONSTRAINT [users_role_df]  DEFAULT 'STUDENT',  -- STUDENT | ADMIN
    [emailVerified]       BIT              NOT NULL  CONSTRAINT [users_emailVerified_df]  DEFAULT 0,
    [verificationToken]   NVARCHAR(1000)   NULL,
    [refreshToken]        NVARCHAR(1000)   NULL,
    [isBanned]            BIT              NOT NULL  CONSTRAINT [users_isBanned_df]  DEFAULT 0,
    [banReason]           NVARCHAR(1000)   NULL,
    [reputationScore]     FLOAT(53)        NOT NULL  CONSTRAINT [users_reputationScore_df]  DEFAULT 0,
    [totalExchanges]      INT              NOT NULL  CONSTRAINT [users_totalExchanges_df]  DEFAULT 0,
    [isDeleted]           BIT              NOT NULL  CONSTRAINT [users_isDeleted_df]  DEFAULT 0,
    [createdAt]           DATETIME2        NOT NULL  CONSTRAINT [users_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]           DATETIME2        NOT NULL,

    CONSTRAINT [users_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key]  UNIQUE NONCLUSTERED ([email])
);

CREATE NONCLUSTERED INDEX [users_email_idx]            ON [dbo].[users] ([email]);
CREATE NONCLUSTERED INDEX [users_role_idx]             ON [dbo].[users] ([role]);
CREATE NONCLUSTERED INDEX [users_reputationScore_idx]  ON [dbo].[users] ([reputationScore]);


-- ─── TABLE: posts ───────────────────────────
-- Exchange posts created by users
-- Status: 'ACTIVE' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'CANCELLED' | 'EXPIRED'

CREATE TABLE [dbo].[posts] (
    [id]             NVARCHAR(1000)   NOT NULL,
    [userId]         NVARCHAR(1000)   NOT NULL,
    [title]          NVARCHAR(1000)   NOT NULL,
    [description]    NVARCHAR(1000)   NOT NULL,
    [whatINeed]      NVARCHAR(1000)   NOT NULL,
    [whatIOffer]     NVARCHAR(1000)   NOT NULL,
    [category]       NVARCHAR(1000)   NOT NULL,
    [tags]           NVARCHAR(1000)   NULL,              -- JSON array string
    [status]         NVARCHAR(1000)   NOT NULL  CONSTRAINT [posts_status_df]  DEFAULT 'ACTIVE',   -- ACTIVE | IN_PROGRESS | SUCCESSFUL | CANCELLED | EXPIRED
    [notifyOnOffers] BIT              NOT NULL  CONSTRAINT [posts_notifyOnOffers_df]  DEFAULT 1,
    [expiresAt]      DATETIME2        NOT NULL,
    [isDeleted]      BIT              NOT NULL  CONSTRAINT [posts_isDeleted_df]  DEFAULT 0,
    [createdAt]      DATETIME2        NOT NULL  CONSTRAINT [posts_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]      DATETIME2        NOT NULL,

    CONSTRAINT [posts_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [posts_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX [posts_userId_idx]    ON [dbo].[posts] ([userId]);
CREATE NONCLUSTERED INDEX [posts_status_idx]    ON [dbo].[posts] ([status]);
CREATE NONCLUSTERED INDEX [posts_category_idx]  ON [dbo].[posts] ([category]);
CREATE NONCLUSTERED INDEX [posts_expiresAt_idx] ON [dbo].[posts] ([expiresAt]);


-- ─── TABLE: offers ──────────────────────────
-- Offers made by users on posts
-- Status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'

CREATE TABLE [dbo].[offers] (
    [id]                    NVARCHAR(1000)   NOT NULL,
    [postId]                NVARCHAR(1000)   NOT NULL,
    [userId]                NVARCHAR(1000)   NOT NULL,
    [proposalDescription]   NVARCHAR(1000)   NOT NULL,
    [counterExchange]       NVARCHAR(1000)   NULL,
    [status]                NVARCHAR(1000)   NOT NULL  CONSTRAINT [offers_status_df]  DEFAULT 'PENDING',  -- PENDING | ACCEPTED | REJECTED | WITHDRAWN | EXPIRED
    [expiresAt]             DATETIME2        NULL,
    [isDeleted]             BIT              NOT NULL  CONSTRAINT [offers_isDeleted_df]  DEFAULT 0,
    [createdAt]             DATETIME2        NOT NULL  CONSTRAINT [offers_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]             DATETIME2        NOT NULL,

    CONSTRAINT [offers_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [offers_postId_userId_key]  UNIQUE NONCLUSTERED ([postId], [userId]),
    CONSTRAINT [offers_postId_fkey]  FOREIGN KEY ([postId]) REFERENCES [dbo].[posts] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [offers_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX [offers_postId_idx]  ON [dbo].[offers] ([postId]);
CREATE NONCLUSTERED INDEX [offers_userId_idx]  ON [dbo].[offers] ([userId]);
CREATE NONCLUSTERED INDEX [offers_status_idx]  ON [dbo].[offers] ([status]);


-- ─── TABLE: transactions ────────────────────
-- Created when an offer is accepted; tracks the exchange lifecycle
-- Status: 'IN_PROGRESS' | 'SUCCESSFUL' | 'CANCELLED' | 'EXPIRED' | 'DISPUTED'

CREATE TABLE [dbo].[transactions] (
    [id]              NVARCHAR(1000)   NOT NULL,
    [postId]          NVARCHAR(1000)   NOT NULL,
    [offerId]         NVARCHAR(1000)   NOT NULL,
    [requesterId]     NVARCHAR(1000)   NOT NULL,
    [offererId]       NVARCHAR(1000)   NOT NULL,
    [status]          NVARCHAR(1000)   NOT NULL  CONSTRAINT [transactions_status_df]  DEFAULT 'IN_PROGRESS',  -- IN_PROGRESS | SUCCESSFUL | CANCELLED | EXPIRED | DISPUTED
    [requesterDone]   BIT              NOT NULL  CONSTRAINT [transactions_requesterDone_df]  DEFAULT 0,
    [offererDone]     BIT              NOT NULL  CONSTRAINT [transactions_offererDone_df]  DEFAULT 0,
    [requesterCancel] BIT              NOT NULL  CONSTRAINT [transactions_requesterCancel_df]  DEFAULT 0,
    [offererCancel]   BIT              NOT NULL  CONSTRAINT [transactions_offererCancel_df]  DEFAULT 0,
    [completedAt]     DATETIME2        NULL,
    [cancelledAt]     DATETIME2        NULL,
    [expiresAt]       DATETIME2        NOT NULL,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [transactions_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [transactions_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]       DATETIME2        NOT NULL,

    CONSTRAINT [transactions_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [transactions_postId_key]    UNIQUE NONCLUSTERED ([postId]),
    CONSTRAINT [transactions_offerId_key]   UNIQUE NONCLUSTERED ([offerId]),
    CONSTRAINT [transactions_postId_fkey]       FOREIGN KEY ([postId])      REFERENCES [dbo].[posts] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [transactions_offerId_fkey]      FOREIGN KEY ([offerId])     REFERENCES [dbo].[offers] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [transactions_requesterId_fkey]  FOREIGN KEY ([requesterId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [transactions_offererId_fkey]    FOREIGN KEY ([offererId])   REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX [transactions_requesterId_idx]  ON [dbo].[transactions] ([requesterId]);
CREATE NONCLUSTERED INDEX [transactions_offererId_idx]    ON [dbo].[transactions] ([offererId]);
CREATE NONCLUSTERED INDEX [transactions_status_idx]       ON [dbo].[transactions] ([status]);


-- ─── TABLE: messages ────────────────────────
-- Chat messages within a transaction
-- messageType: 'TEXT' | 'SYSTEM' | 'ACTION'

CREATE TABLE [dbo].[messages] (
    [id]              NVARCHAR(1000)   NOT NULL,
    [transactionId]   NVARCHAR(1000)   NOT NULL,
    [senderId]        NVARCHAR(1000)   NOT NULL,
    [content]         NVARCHAR(1000)   NOT NULL,
    [messageType]     NVARCHAR(1000)   NOT NULL  CONSTRAINT [messages_messageType_df]  DEFAULT 'TEXT',  -- TEXT | SYSTEM | ACTION
    [isRead]          BIT              NOT NULL  CONSTRAINT [messages_isRead_df]  DEFAULT 0,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [messages_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [messages_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [messages_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [messages_transactionId_fkey]  FOREIGN KEY ([transactionId]) REFERENCES [dbo].[transactions] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [messages_senderId_fkey]  FOREIGN KEY ([senderId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX [messages_transactionId_idx]  ON [dbo].[messages] ([transactionId]);
CREATE NONCLUSTERED INDEX [messages_senderId_idx]       ON [dbo].[messages] ([senderId]);
CREATE NONCLUSTERED INDEX [messages_createdAt_idx]      ON [dbo].[messages] ([createdAt]);


-- ─── TABLE: ratings ─────────────────────────
-- Post-transaction ratings (1-5 stars + review)
-- Constraint: one rating per user per transaction

CREATE TABLE [dbo].[ratings] (
    [id]              NVARCHAR(1000)   NOT NULL,
    [transactionId]   NVARCHAR(1000)   NOT NULL,
    [giverId]         NVARCHAR(1000)   NOT NULL,
    [receiverId]      NVARCHAR(1000)   NOT NULL,
    [score]           INT              NOT NULL,           -- 1 to 5
    [review]          NVARCHAR(1000)   NULL,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [ratings_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [ratings_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [ratings_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ratings_transactionId_giverId_key]  UNIQUE NONCLUSTERED ([transactionId], [giverId]),
    CONSTRAINT [ratings_transactionId_fkey]  FOREIGN KEY ([transactionId]) REFERENCES [dbo].[transactions] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [ratings_giverId_fkey]  FOREIGN KEY ([giverId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [ratings_receiverId_fkey]  FOREIGN KEY ([receiverId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX [ratings_receiverId_idx]  ON [dbo].[ratings] ([receiverId]);
CREATE NONCLUSTERED INDEX [ratings_score_idx]       ON [dbo].[ratings] ([score]);


-- ─── TABLE: reports ─────────────────────────
-- User-submitted reports against another user within a transaction
-- Status: 'PENDING' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED'

CREATE TABLE [dbo].[reports] (
    [id]              NVARCHAR(1000)   NOT NULL,
    [transactionId]   NVARCHAR(1000)   NOT NULL,
    [reporterId]      NVARCHAR(1000)   NOT NULL,
    [targetUserId]    NVARCHAR(1000)   NOT NULL,
    [reason]          NVARCHAR(1000)   NOT NULL,
    [description]     NVARCHAR(1000)   NOT NULL,
    [evidence]        NVARCHAR(1000)   NULL,              -- JSON array of file paths
    [status]          NVARCHAR(1000)   NOT NULL  CONSTRAINT [reports_status_df]  DEFAULT 'PENDING',  -- PENDING | INVESTIGATING | RESOLVED | DISMISSED
    [adminNotes]      NVARCHAR(1000)   NULL,
    [resolvedAt]      DATETIME2        NULL,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [reports_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [reports_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]       DATETIME2        NOT NULL,

    CONSTRAINT [reports_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [reports_transactionId_fkey]  FOREIGN KEY ([transactionId]) REFERENCES [dbo].[transactions] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [reports_reporterId_fkey]  FOREIGN KEY ([reporterId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT [reports_targetUserId_fkey]  FOREIGN KEY ([targetUserId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE NO ACTION
);

CREATE NONCLUSTERED INDEX [reports_transactionId_idx]  ON [dbo].[reports] ([transactionId]);
CREATE NONCLUSTERED INDEX [reports_reporterId_idx]     ON [dbo].[reports] ([reporterId]);
CREATE NONCLUSTERED INDEX [reports_targetUserId_idx]   ON [dbo].[reports] ([targetUserId]);
CREATE NONCLUSTERED INDEX [reports_status_idx]         ON [dbo].[reports] ([status]);


-- ─── TABLE: notifications ───────────────────
-- System & event-driven notifications
-- Type: 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'MESSAGE' | 'TRANSACTION_COMPLETE' | 'REPORT_UPDATE' | 'SYSTEM'

CREATE TABLE [dbo].[notifications] (
    [id]          NVARCHAR(1000)   NOT NULL,
    [userId]      NVARCHAR(1000)   NOT NULL,
    [type]        NVARCHAR(1000)   NOT NULL,              -- OFFER_RECEIVED | OFFER_ACCEPTED | OFFER_REJECTED | MESSAGE | TRANSACTION_COMPLETE | REPORT_UPDATE | SYSTEM
    [title]       NVARCHAR(1000)   NOT NULL,
    [message]     NVARCHAR(1000)   NOT NULL,
    [data]        NVARCHAR(1000)   NULL,                  -- JSON string for extra payload
    [isRead]      BIT              NOT NULL  CONSTRAINT [notifications_isRead_df]  DEFAULT 0,
    [createdAt]   DATETIME2        NOT NULL  CONSTRAINT [notifications_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [notifications_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [notifications_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX [notifications_userId_idx]    ON [dbo].[notifications] ([userId]);
CREATE NONCLUSTERED INDEX [notifications_isRead_idx]    ON [dbo].[notifications] ([isRead]);
CREATE NONCLUSTERED INDEX [notifications_createdAt_idx] ON [dbo].[notifications] ([createdAt]);


-- ─── TABLE: leaderboard_snapshots ───────────
-- Periodic snapshots of top users for leaderboard history
-- Period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

CREATE TABLE [dbo].[leaderboard_snapshots] (
    [id]              NVARCHAR(1000)   NOT NULL,
    [userId]          NVARCHAR(1000)   NOT NULL,
    [rank]            INT              NOT NULL,
    [reputationScore] FLOAT(53)        NOT NULL,
    [totalExchanges]  INT              NOT NULL,
    [averageRating]   FLOAT(53)        NOT NULL,
    [period]          NVARCHAR(1000)   NOT NULL,          -- DAILY | WEEKLY | MONTHLY | ALL_TIME
    [snapshotDate]    DATETIME2        NOT NULL,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [leaderboard_snapshots_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [leaderboard_snapshots_pkey]  PRIMARY KEY CLUSTERED ([id])
);

CREATE NONCLUSTERED INDEX [leaderboard_snapshots_period_snapshotDate_idx]  ON [dbo].[leaderboard_snapshots] ([period], [snapshotDate]);
CREATE NONCLUSTERED INDEX [leaderboard_snapshots_userId_idx]               ON [dbo].[leaderboard_snapshots] ([userId]);
CREATE NONCLUSTERED INDEX [leaderboard_snapshots_rank_idx]                 ON [dbo].[leaderboard_snapshots] ([rank]);

-- =============================================
-- END OF SCHEMA
-- =============================================
