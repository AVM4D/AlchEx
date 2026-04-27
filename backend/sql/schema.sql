-- =============================================
-- AlchEx Database Schema (SQL Server) — BCNF Normalized
-- Student Exchange Platform
-- =============================================


-- ─── LOOKUP TABLE: universities ─────────────────────────
-- Normalises university + campus out of users (BCNF)
CREATE TABLE [dbo].[universities] (
    [id]       INT              NOT NULL  IDENTITY(1,1),
    [name]     NVARCHAR(255)    NOT NULL,
    [campus]   NVARCHAR(255)    NOT NULL,

    CONSTRAINT [universities_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [universities_name_campus_key]  UNIQUE NONCLUSTERED ([name], [campus])
);


-- ─── LOOKUP TABLE: programs ─────────────────────────────
-- Normalises batch / program / section out of users (BCNF)
CREATE TABLE [dbo].[programs] (
    [id]       INT              NOT NULL  IDENTITY(1,1),
    [name]     NVARCHAR(100)    NOT NULL,   -- e.g. BSCS, BSEE

    CONSTRAINT [programs_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [programs_name_key]  UNIQUE NONCLUSTERED ([name])
);


-- ─── LOOKUP TABLE: categories ───────────────────────────
-- Normalises category out of posts (BCNF)
CREATE TABLE [dbo].[categories] (
    [id]       INT              NOT NULL  IDENTITY(1,1),
    [name]     NVARCHAR(100)    NOT NULL,
    [icon]     NVARCHAR(50)     NULL,

    CONSTRAINT [categories_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [categories_name_key]  UNIQUE NONCLUSTERED ([name])
);


-- ─── TABLE: users ───────────────────────────
-- Stores all platform users (students & admins)
-- Role: 'STUDENT' | 'ADMIN'

CREATE TABLE [dbo].[users] (
    [id]                  NVARCHAR(36)     NOT NULL,
    [email]               NVARCHAR(255)    NOT NULL,
    [passwordHash]        NVARCHAR(255)    NOT NULL,
    [firstName]           NVARCHAR(100)    NOT NULL,
    [lastName]            NVARCHAR(100)    NOT NULL,
    [profilePicture]      NVARCHAR(500)    NULL,
    [bio]                 NVARCHAR(500)    NULL,
    [batch]               NVARCHAR(10)     NULL,       -- e.g. 2024
    [programId]           INT              NULL,
    [section]             NVARCHAR(10)     NULL,       -- e.g. A, B, C
    [universityId]        INT              NULL,
    [role]                NVARCHAR(10)     NOT NULL  CONSTRAINT [users_role_df]  DEFAULT 'STUDENT',
    [emailVerified]       BIT              NOT NULL  CONSTRAINT [users_emailVerified_df]  DEFAULT 0,
    [verificationToken]   NVARCHAR(255)    NULL,
    [refreshToken]        NVARCHAR(500)    NULL,
    [isBanned]            BIT              NOT NULL  CONSTRAINT [users_isBanned_df]  DEFAULT 0,
    [banReason]           NVARCHAR(500)    NULL,
    [reputationScore]     FLOAT(53)        NOT NULL  CONSTRAINT [users_reputationScore_df]  DEFAULT 0,
    [totalExchanges]      INT              NOT NULL  CONSTRAINT [users_totalExchanges_df]  DEFAULT 0,
    [isDeleted]           BIT              NOT NULL  CONSTRAINT [users_isDeleted_df]  DEFAULT 0,
    [createdAt]           DATETIME2        NOT NULL  CONSTRAINT [users_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]           DATETIME2        NOT NULL,

    CONSTRAINT [users_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [users_email_key]  UNIQUE NONCLUSTERED ([email]),
    CONSTRAINT [users_role_chk]  CHECK ([role] IN ('STUDENT', 'ADMIN')),
    CONSTRAINT [users_score_chk] CHECK ([reputationScore] >= 0),
    CONSTRAINT [users_programId_fkey]  FOREIGN KEY ([programId]) REFERENCES [dbo].[programs] ([id])
        ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT [users_universityId_fkey]  FOREIGN KEY ([universityId]) REFERENCES [dbo].[universities] ([id])
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX [users_email_idx]            ON [dbo].[users] ([email]);
CREATE NONCLUSTERED INDEX [users_role_idx]             ON [dbo].[users] ([role]);
CREATE NONCLUSTERED INDEX [users_reputationScore_idx]  ON [dbo].[users] ([reputationScore] DESC);
CREATE NONCLUSTERED INDEX [users_universityId_idx]     ON [dbo].[users] ([universityId]);
CREATE NONCLUSTERED INDEX [users_programId_idx]        ON [dbo].[users] ([programId]);


-- ─── TABLE: user_social_links ───────────────────────────
-- Normalises the JSON socialLinks field (1NF → BCNF)
-- Each row = one social link for a user

CREATE TABLE [dbo].[user_social_links] (
    [id]       INT              NOT NULL  IDENTITY(1,1),
    [userId]   NVARCHAR(36)     NOT NULL,
    [platform] NVARCHAR(50)     NOT NULL,  -- e.g. 'github', 'linkedin', 'twitter'
    [url]      NVARCHAR(500)    NOT NULL,

    CONSTRAINT [user_social_links_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_social_links_user_platform_key]  UNIQUE NONCLUSTERED ([userId], [platform]),
    CONSTRAINT [user_social_links_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ─── TABLE: tags ────────────────────────────────────────
-- Master list of all tags (normalised from posts.tags JSON)

CREATE TABLE [dbo].[tags] (
    [id]    INT              NOT NULL  IDENTITY(1,1),
    [name]  NVARCHAR(100)    NOT NULL,

    CONSTRAINT [tags_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [tags_name_key]  UNIQUE NONCLUSTERED ([name])
);


-- ─── TABLE: posts ───────────────────────────
-- Exchange posts created by users
-- Status: 'ACTIVE' | 'IN_PROGRESS' | 'SUCCESSFUL' | 'CANCELLED' | 'EXPIRED'

CREATE TABLE [dbo].[posts] (
    [id]             NVARCHAR(36)     NOT NULL,
    [userId]         NVARCHAR(36)     NOT NULL,
    [title]          NVARCHAR(255)    NOT NULL,
    [description]    NVARCHAR(MAX)    NOT NULL,
    [whatINeed]      NVARCHAR(500)    NOT NULL,
    [whatIOffer]     NVARCHAR(500)    NOT NULL,
    [categoryId]     INT              NOT NULL,
    [status]         NVARCHAR(20)     NOT NULL  CONSTRAINT [posts_status_df]  DEFAULT 'ACTIVE',
    [notifyOnOffers] BIT              NOT NULL  CONSTRAINT [posts_notifyOnOffers_df]  DEFAULT 1,
    [expiresAt]      DATETIME2        NOT NULL,
    [isDeleted]      BIT              NOT NULL  CONSTRAINT [posts_isDeleted_df]  DEFAULT 0,
    [createdAt]      DATETIME2        NOT NULL  CONSTRAINT [posts_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]      DATETIME2        NOT NULL,

    CONSTRAINT [posts_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [posts_status_chk]  CHECK ([status] IN ('ACTIVE','IN_PROGRESS','SUCCESSFUL','CANCELLED','EXPIRED')),
    CONSTRAINT [posts_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE CASCADE,
    CONSTRAINT [posts_categoryId_fkey]  FOREIGN KEY ([categoryId]) REFERENCES [dbo].[categories] ([id])
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX [posts_userId_idx]      ON [dbo].[posts] ([userId]);
CREATE NONCLUSTERED INDEX [posts_status_idx]      ON [dbo].[posts] ([status]);
CREATE NONCLUSTERED INDEX [posts_categoryId_idx]  ON [dbo].[posts] ([categoryId]);
CREATE NONCLUSTERED INDEX [posts_expiresAt_idx]   ON [dbo].[posts] ([expiresAt]);
CREATE NONCLUSTERED INDEX [posts_createdAt_idx]   ON [dbo].[posts] ([createdAt] DESC);


-- ─── TABLE: post_tags ───────────────────────────────────
-- Many-to-many junction between posts and tags (BCNF — no transitive dep.)

CREATE TABLE [dbo].[post_tags] (
    [postId]  NVARCHAR(36)  NOT NULL,
    [tagId]   INT           NOT NULL,

    CONSTRAINT [post_tags_pkey]  PRIMARY KEY CLUSTERED ([postId], [tagId]),
    CONSTRAINT [post_tags_postId_fkey]  FOREIGN KEY ([postId]) REFERENCES [dbo].[posts] ([id])
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT [post_tags_tagId_fkey]   FOREIGN KEY ([tagId])  REFERENCES [dbo].[tags] ([id])
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ─── TABLE: offers ──────────────────────────
-- Offers made by users on posts
-- Status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED'

CREATE TABLE [dbo].[offers] (
    [id]                    NVARCHAR(36)     NOT NULL,
    [postId]                NVARCHAR(36)     NOT NULL,
    [userId]                NVARCHAR(36)     NOT NULL,
    [proposalDescription]   NVARCHAR(MAX)    NOT NULL,
    [counterExchange]       NVARCHAR(500)    NULL,
    [status]                NVARCHAR(20)     NOT NULL  CONSTRAINT [offers_status_df]  DEFAULT 'PENDING',
    [expiresAt]             DATETIME2        NULL,
    [isDeleted]             BIT              NOT NULL  CONSTRAINT [offers_isDeleted_df]  DEFAULT 0,
    [createdAt]             DATETIME2        NOT NULL  CONSTRAINT [offers_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]             DATETIME2        NOT NULL,

    CONSTRAINT [offers_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [offers_postId_userId_key]  UNIQUE NONCLUSTERED ([postId], [userId]),
    CONSTRAINT [offers_status_chk]  CHECK ([status] IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN','EXPIRED')),
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
    [id]              NVARCHAR(36)     NOT NULL,
    [postId]          NVARCHAR(36)     NOT NULL,
    [offerId]         NVARCHAR(36)     NOT NULL,
    [requesterId]     NVARCHAR(36)     NOT NULL,
    [offererId]       NVARCHAR(36)     NOT NULL,
    [status]          NVARCHAR(20)     NOT NULL  CONSTRAINT [transactions_status_df]  DEFAULT 'IN_PROGRESS',
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
    CONSTRAINT [transactions_status_chk]    CHECK ([status] IN ('IN_PROGRESS','SUCCESSFUL','CANCELLED','EXPIRED','DISPUTED')),
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
    [id]              NVARCHAR(36)     NOT NULL,
    [transactionId]   NVARCHAR(36)     NOT NULL,
    [senderId]        NVARCHAR(36)     NOT NULL,
    [content]         NVARCHAR(MAX)    NOT NULL,
    [messageType]     NVARCHAR(10)     NOT NULL  CONSTRAINT [messages_messageType_df]  DEFAULT 'TEXT',
    [isRead]          BIT              NOT NULL  CONSTRAINT [messages_isRead_df]  DEFAULT 0,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [messages_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [messages_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [messages_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [messages_messageType_chk]  CHECK ([messageType] IN ('TEXT','SYSTEM','ACTION')),
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
    [id]              NVARCHAR(36)     NOT NULL,
    [transactionId]   NVARCHAR(36)     NOT NULL,
    [giverId]         NVARCHAR(36)     NOT NULL,
    [receiverId]      NVARCHAR(36)     NOT NULL,
    [score]           INT              NOT NULL,
    [review]          NVARCHAR(500)    NULL,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [ratings_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [ratings_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [ratings_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ratings_transactionId_giverId_key]  UNIQUE NONCLUSTERED ([transactionId], [giverId]),
    CONSTRAINT [ratings_score_chk]  CHECK ([score] >= 1 AND [score] <= 5),
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
    [id]              NVARCHAR(36)     NOT NULL,
    [transactionId]   NVARCHAR(36)     NOT NULL,
    [reporterId]      NVARCHAR(36)     NOT NULL,
    [targetUserId]    NVARCHAR(36)     NOT NULL,
    [reason]          NVARCHAR(100)    NOT NULL,
    [description]     NVARCHAR(MAX)    NOT NULL,
    [status]          NVARCHAR(20)     NOT NULL  CONSTRAINT [reports_status_df]  DEFAULT 'PENDING',
    [adminNotes]      NVARCHAR(MAX)    NULL,
    [resolvedAt]      DATETIME2        NULL,
    [isDeleted]       BIT              NOT NULL  CONSTRAINT [reports_isDeleted_df]  DEFAULT 0,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [reports_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,
    [updatedAt]       DATETIME2        NOT NULL,

    CONSTRAINT [reports_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [reports_status_chk]  CHECK ([status] IN ('PENDING','INVESTIGATING','RESOLVED','DISMISSED')),
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


-- ─── TABLE: report_evidence ─────────────────
-- Normalises the JSON evidence array (1NF → BCNF)
-- Each row = one evidence file for a report

CREATE TABLE [dbo].[report_evidence] (
    [id]       INT              NOT NULL  IDENTITY(1,1),
    [reportId] NVARCHAR(36)     NOT NULL,
    [filePath] NVARCHAR(500)    NOT NULL,
    [fileType] NVARCHAR(50)     NULL,       -- e.g. 'image/png', 'application/pdf'

    CONSTRAINT [report_evidence_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [report_evidence_reportId_fkey]  FOREIGN KEY ([reportId]) REFERENCES [dbo].[reports] ([id])
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- ─── TABLE: notifications ───────────────────
-- System & event-driven notifications
-- Type: 'OFFER_RECEIVED' | 'OFFER_ACCEPTED' | 'OFFER_REJECTED' | 'MESSAGE' | 'TRANSACTION_COMPLETE' | 'REPORT_UPDATE' | 'SYSTEM'

CREATE TABLE [dbo].[notifications] (
    [id]             NVARCHAR(36)     NOT NULL,
    [userId]         NVARCHAR(36)     NOT NULL,
    [type]           NVARCHAR(30)     NOT NULL,
    [title]          NVARCHAR(255)    NOT NULL,
    [message]        NVARCHAR(500)    NOT NULL,
    [referenceId]    NVARCHAR(36)     NULL,          -- FK-like pointer to related entity (postId, transactionId, etc.)
    [referenceType]  NVARCHAR(30)     NULL,          -- 'POST' | 'TRANSACTION' | 'REPORT' | 'OFFER'
    [isRead]         BIT              NOT NULL  CONSTRAINT [notifications_isRead_df]  DEFAULT 0,
    [createdAt]      DATETIME2        NOT NULL  CONSTRAINT [notifications_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [notifications_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [notifications_type_chk]  CHECK ([type] IN (
        'OFFER_RECEIVED','OFFER_ACCEPTED','OFFER_REJECTED','MESSAGE',
        'TRANSACTION_COMPLETE','REPORT_UPDATE','SYSTEM','RATING_RECEIVED'
    )),
    CONSTRAINT [notifications_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX [notifications_userId_idx]    ON [dbo].[notifications] ([userId]);
CREATE NONCLUSTERED INDEX [notifications_isRead_idx]    ON [dbo].[notifications] ([isRead]);
CREATE NONCLUSTERED INDEX [notifications_createdAt_idx] ON [dbo].[notifications] ([createdAt] DESC);


-- ─── TABLE: leaderboard_snapshots ───────────
-- Periodic snapshots of top users for leaderboard history
-- Period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME'

CREATE TABLE [dbo].[leaderboard_snapshots] (
    [id]              NVARCHAR(36)     NOT NULL,
    [userId]          NVARCHAR(36)     NOT NULL,
    [rank]            INT              NOT NULL,
    [reputationScore] FLOAT(53)        NOT NULL,
    [totalExchanges]  INT              NOT NULL,
    [averageRating]   FLOAT(53)        NOT NULL,
    [period]          NVARCHAR(20)     NOT NULL,
    [snapshotDate]    DATETIME2        NOT NULL,
    [createdAt]       DATETIME2        NOT NULL  CONSTRAINT [leaderboard_snapshots_createdAt_df]  DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT [leaderboard_snapshots_pkey]  PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [leaderboard_snapshots_period_chk]  CHECK ([period] IN ('DAILY','WEEKLY','MONTHLY','ALL_TIME')),
    CONSTRAINT [leaderboard_snapshots_userId_fkey]  FOREIGN KEY ([userId]) REFERENCES [dbo].[users] ([id])
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE NONCLUSTERED INDEX [leaderboard_snapshots_period_snapshotDate_idx]  ON [dbo].[leaderboard_snapshots] ([period], [snapshotDate]);
CREATE NONCLUSTERED INDEX [leaderboard_snapshots_userId_idx]               ON [dbo].[leaderboard_snapshots] ([userId]);
CREATE NONCLUSTERED INDEX [leaderboard_snapshots_rank_idx]                 ON [dbo].[leaderboard_snapshots] ([rank]);


-- =============================================
-- END OF SCHEMA
-- =============================================
