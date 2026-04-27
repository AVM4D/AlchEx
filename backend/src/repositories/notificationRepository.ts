import db from '../db/connection';

// ─── Notification Repository — All Raw SQL (BCNF Schema) ───────────────────
// New schema uses referenceId + referenceType instead of JSON data column.
// The create() method accepts the old `data` param for backward-compat and
// parses it into referenceId/referenceType automatically.

export class NotificationRepository {

  // INSERT new notification
  async create(data: {
    userId: string; type: string; title: string; message: string; data?: string;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();

    // Extract referenceId and referenceType from JSON data if present
    let referenceId: string | null = null;
    let referenceType: string | null = null;
    if (data.data) {
      try {
        const parsed = JSON.parse(data.data);
        if (parsed.transactionId) { referenceId = parsed.transactionId; referenceType = 'TRANSACTION'; }
        else if (parsed.postId) { referenceId = parsed.postId; referenceType = 'POST'; }
        else if (parsed.offerId) { referenceId = parsed.offerId; referenceType = 'OFFER'; }
        else if (parsed.reportId) { referenceId = parsed.reportId; referenceType = 'REPORT'; }
      } catch { /* ignore parse errors */ }
    }

    await db.execute`
      INSERT INTO notifications (id, userId, type, title, message, referenceId, referenceType, isRead, createdAt)
      VALUES (${id}, ${data.userId}, ${data.type}, ${data.title}, ${data.message},
              ${referenceId}, ${referenceType}, 0, ${now})
    `;
    const rows: any[] = await db.query`
      SELECT * FROM notifications WHERE id = ${id}
    `;
    return rows[0] || null;
  }

  // SELECT notifications for a user with pagination + counts
  async findByUser(userId: string, skip: number = 0, take: number = 20) {
    const notifications = await db.query`
      SELECT id, userId, type, title, message, referenceId, referenceType, isRead, createdAt
      FROM notifications
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;
    const countResult: any[] = await db.query`
      SELECT COUNT(*) AS total FROM notifications WHERE userId = ${userId}
    `;
    const unreadResult: any[] = await db.query`
      SELECT COUNT(*) AS unreadCount FROM notifications WHERE userId = ${userId} AND isRead = 0
    `;

    // Map referenceId/referenceType back to `data` JSON for frontend backward-compat
    const mapped = (notifications as any[]).map((n: any) => {
      let data: string | null = null;
      if (n.referenceId && n.referenceType) {
        const key = n.referenceType === 'TRANSACTION' ? 'transactionId'
          : n.referenceType === 'POST' ? 'postId'
          : n.referenceType === 'OFFER' ? 'offerId'
          : n.referenceType === 'REPORT' ? 'reportId' : 'id';
        data = JSON.stringify({ [key]: n.referenceId });
      }
      return { ...n, data };
    });

    return {
      notifications: mapped,
      total: Number(countResult[0]?.total ?? 0),
      unreadCount: Number(unreadResult[0]?.unreadCount ?? 0),
    };
  }

  // UPDATE — mark single notification as read
  async markAsRead(id: string, userId: string) {
    await db.execute`
      UPDATE notifications SET isRead = 1 WHERE id = ${id} AND userId = ${userId}
    `;
    const rows: any[] = await db.query`
      SELECT * FROM notifications WHERE id = ${id}
    `;
    return rows[0] || null;
  }

  // UPDATE — mark all notifications as read
  async markAllAsRead(userId: string) {
    const result = await db.execute`
      UPDATE notifications SET isRead = 1 WHERE userId = ${userId} AND isRead = 0
    `;
    return { count: result };
  }

  // DELETE notification (hard delete)
  async delete(id: string, userId: string) {
    await db.execute`
      DELETE FROM notifications WHERE id = ${id} AND userId = ${userId}
    `;
    return { id };
  }
}

export const notificationRepository = new NotificationRepository();
