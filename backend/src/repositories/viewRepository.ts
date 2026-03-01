import db from '../db/connection';

// ─────────────────────────────────────────────────────────
// Repository using raw SQL to execute views & queries
// ─────────────────────────────────────────────────────────

export class ViewRepository {

  // ─── Q1: Top Exchangers from vw_Leaderboard ───
  async getLeaderboard(limit: number = 10) {
    return db.query`
      SELECT TOP (${limit}) *
      FROM vw_Leaderboard
      ORDER BY rank ASC
    `;
  }

  // ─── Q2: Active Posts by Category from vw_ActivePostsByCategory ───
  async getActivePostsByCategory(category?: string, offset: number = 0, limit: number = 20) {
    if (category) {
      return db.query`
        SELECT *
        FROM vw_ActivePostsByCategory
        WHERE category = ${category}
        ORDER BY createdAt DESC
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;
    }
    return db.query`
      SELECT *
      FROM vw_ActivePostsByCategory
      ORDER BY createdAt DESC
      OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
    `;
  }

  // ─── Q3: Search Posts by Keyword ───
  async searchPosts(keyword: string) {
    const searchTerm = `%${keyword}%`;
    return db.query`
      SELECT *
      FROM vw_ActivePostsByCategory
      WHERE title       LIKE ${searchTerm}
         OR description LIKE ${searchTerm}
         OR whatINeed    LIKE ${searchTerm}
         OR whatIOffer   LIKE ${searchTerm}
      ORDER BY createdAt DESC
    `;
  }

  // ─── Q4: User Rating Statistics from vw_UserRatingStats ───
  async getUserRatingStats(userId: string) {
    const result = await db.query`
      SELECT *
      FROM vw_UserRatingStats
      WHERE userId = ${userId}
    `;
    return (result as any[])[0] || null;
  }

  // ─── Q5: Top Rated Users ───
  async getTopRatedUsers(limit: number = 10) {
    return db.query`
      SELECT TOP (${limit})
        userId, firstName, lastName,
        averageRating, totalRatings
      FROM vw_UserRatingStats
      WHERE totalRatings > 0
      ORDER BY averageRating DESC, totalRatings DESC
    `;
  }

  // ─── Q6: Most Popular Categories from vw_PopularCategories ───
  async getPopularCategories() {
    return db.query`
      SELECT *
      FROM vw_PopularCategories
      ORDER BY totalPosts DESC
    `;
  }

  // ─── Q7: Transaction Summary from vw_TransactionSummary ───
  async getTransactionSummary(transactionId: string) {
    const result = await db.query`
      SELECT *
      FROM vw_TransactionSummary
      WHERE transactionId = ${transactionId}
    `;
    return (result as any[])[0] || null;
  }

  // ─── Q8: Recently Completed Exchanges ───
  async getRecentCompletedExchanges(limit: number = 10) {
    return db.query`
      SELECT TOP (${limit})
        transactionId, transactionStatus,
        postTitle, category,
        requesterFirstName, requesterLastName,
        offererFirstName, offererLastName,
        completedAt
      FROM vw_TransactionSummary
      WHERE transactionStatus = 'SUCCESSFUL'
      ORDER BY completedAt DESC
    `;
  }

  // ─── Q9: User Exchange History from vw_UserExchangeHistory ───
  async getUserExchangeHistory(userId: string) {
    return db.query`
      SELECT *
      FROM vw_UserExchangeHistory
      WHERE oduserId = ${userId}
      ORDER BY createdAt DESC
    `;
  }

  // ─── Q10: Pending Reports from vw_PendingReports (Admin) ───
  async getPendingReports() {
    return db.query`
      SELECT *
      FROM vw_PendingReports
      ORDER BY createdAt DESC
    `;
  }

  // ─── Q11: Admin Dashboard Stats from vw_AdminDashboard ───
  async getAdminDashboard() {
    const result = await db.query`
      SELECT * FROM vw_AdminDashboard
    `;
    return (result as any[])[0] || null;
  }

  // ─── Q12: Post Status Distribution from vw_PostStatusDistribution ───
  async getPostStatusDistribution() {
    return db.query`
      SELECT * FROM vw_PostStatusDistribution
    `;
  }

  // ─── Q13: Transaction Completion Rate ───
  async getTransactionCompletionRate() {
    const result = await db.query`
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
      WHERE isDeleted = 0
    `;
    return (result as any[])[0] || null;
  }

  // ─── Q14: Expiring Posts (next 24 hours) ───
  async getExpiringPosts() {
    return db.query`
      SELECT
        p.id, p.title, p.category, p.expiresAt,
        u.firstName, u.lastName,
        DATEDIFF(HOUR, GETDATE(), p.expiresAt) AS hoursRemaining
      FROM posts p
      JOIN users u ON u.id = p.userId
      WHERE p.status    = 'ACTIVE'
        AND p.isDeleted = 0
        AND p.expiresAt BETWEEN GETDATE() AND DATEADD(HOUR, 24, GETDATE())
      ORDER BY p.expiresAt ASC
    `;
  }

  // ─── Q15: Pending Offers per Post (for a post owner) ───
  async getPendingOffersPerPost(userId: string) {
    return db.query`
      SELECT
        p.id       AS postId,
        p.title,
        COUNT(o.id) AS pendingOfferCount
      FROM posts p
      LEFT JOIN offers o ON o.postId = p.id AND o.status = 'PENDING' AND o.isDeleted = 0
      WHERE p.userId    = ${userId}
        AND p.status    = 'ACTIVE'
        AND p.isDeleted = 0
      GROUP BY p.id, p.title
      ORDER BY pendingOfferCount DESC
    `;
  }

  // ─── Q16: Monthly Exchange Activity ───
  async getMonthlyActivity() {
    return db.query`
      SELECT
        FORMAT(createdAt, 'yyyy-MM') AS month,
        COUNT(*)                      AS totalTransactions,
        SUM(CASE WHEN status = 'SUCCESSFUL' THEN 1 ELSE 0 END) AS successful,
        SUM(CASE WHEN status = 'CANCELLED'  THEN 1 ELSE 0 END) AS cancelled
      FROM transactions
      WHERE isDeleted = 0
      GROUP BY FORMAT(createdAt, 'yyyy-MM')
      ORDER BY month DESC
    `;
  }

  // ─── Q17: User Profile with Exchange Stats (raw SQL join) ───
  async getUserProfileStats(userId: string) {
    const result = await db.query`
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
      WHERE u.id = ${userId}
        AND u.isDeleted = 0
    `;
    return (result as any[])[0] || null;
  }

  // ─── Q18: User's Active Conversations ───
  async getUserConversations(userId: string) {
    return db.query`
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
          WHEN t.requesterId = ${userId} THEN t.offererId
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
          WHERE senderId != ${userId} AND isRead = 0 AND isDeleted = 0
          GROUP BY transactionId
      ) unread ON unread.transactionId = t.id
      WHERE (t.requesterId = ${userId} OR t.offererId = ${userId})
        AND t.isDeleted = 0
        AND t.status = 'IN_PROGRESS'
      ORDER BY lastMsg.createdAt DESC
    `;
  }
}

export const viewRepository = new ViewRepository();
