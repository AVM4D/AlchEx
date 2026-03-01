import db from '../db/connection';

// ─── Message Repository — All Raw SQL ──────────────────────────────────────

export class MessageRepository {

  // INSERT new message (returns message with sender info)
  async create(data: {
    transaction: { connect: { id: string } }; sender: { connect: { id: string } }; content: string;
  }) {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.execute`
      INSERT INTO messages (id, transactionId, senderId, content, messageType, isRead, isDeleted, createdAt)
      VALUES (${id}, ${data.transaction.connect.id}, ${data.sender.connect.id}, ${data.content}, 'TEXT', 0, 0, ${now})
    `;
    // Return with sender info
    const rows: any[] = await db.query`
      SELECT
        m.id, m.transactionId, m.senderId, m.content, m.messageType, m.isRead, m.isDeleted, m.createdAt,
        u.id AS [sender.id], u.firstName AS [sender.firstName],
        u.lastName AS [sender.lastName], u.profilePicture AS [sender.profilePicture]
      FROM messages m
      JOIN users u ON u.id = m.senderId
      WHERE m.id = ${id}
    `;
    const r = rows[0];
    return {
      id: r.id, transactionId: r.transactionId, senderId: r.senderId,
      content: r.content, messageType: r.messageType, isRead: r.isRead,
      isDeleted: r.isDeleted, createdAt: r.createdAt,
      sender: {
        id: r['sender.id'], firstName: r['sender.firstName'],
        lastName: r['sender.lastName'], profilePicture: r['sender.profilePicture'],
      },
    };
  }

  // SELECT messages for a transaction with pagination
  async findByTransaction(transactionId: string, skip: number = 0, take: number = 50) {
    const messages = await db.query`
      SELECT
        m.id, m.transactionId, m.senderId, m.content, m.messageType,
        m.isRead, m.isDeleted, m.createdAt,
        u.id AS [sender.id], u.firstName AS [sender.firstName],
        u.lastName AS [sender.lastName], u.profilePicture AS [sender.profilePicture]
      FROM messages m
      JOIN users u ON u.id = m.senderId
      WHERE m.transactionId = ${transactionId} AND m.isDeleted = 0
      ORDER BY m.createdAt ASC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;
    const countResult: any[] = await db.query`
      SELECT COUNT(*) AS total FROM messages WHERE transactionId = ${transactionId} AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (messages as any[]).map((row: any) => ({
      id: row.id, transactionId: row.transactionId, senderId: row.senderId,
      content: row.content, messageType: row.messageType, isRead: row.isRead,
      isDeleted: row.isDeleted, createdAt: row.createdAt,
      sender: {
        id: row['sender.id'], firstName: row['sender.firstName'],
        lastName: row['sender.lastName'], profilePicture: row['sender.profilePicture'],
      },
    }));
    return { messages: formatted, total };
  }

  // UPDATE — mark all messages from other user as read
  async markAsRead(transactionId: string, userId: string) {
    const result = await db.execute`
      UPDATE messages SET isRead = 1
      WHERE transactionId = ${transactionId} AND senderId != ${userId} AND isRead = 0
    `;
    return { count: result };
  }

  // SELECT unread count for a user across all active transactions
  async getUnreadCount(userId: string) {
    const result: any[] = await db.query`
      SELECT COUNT(*) AS unreadCount
      FROM messages m
      JOIN transactions t ON t.id = m.transactionId
      WHERE m.senderId != ${userId}
        AND m.isRead = 0 AND m.isDeleted = 0
        AND (t.requesterId = ${userId} OR t.offererId = ${userId})
        AND t.status = 'IN_PROGRESS'
    `;
    return Number(result[0]?.unreadCount ?? 0);
  }
}

export const messageRepository = new MessageRepository();
