import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class MessageRepository {
  async create(data: Prisma.MessageCreateInput) {
    return prisma.message.create({
      data,
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, profilePicture: true },
        },
      },
    });
  }

  async findByTransaction(transactionId: string, skip: number = 0, take: number = 50) {
    const messages = await prisma.$queryRaw`
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

    const countResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM messages
      WHERE transactionId = ${transactionId} AND isDeleted = 0
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

  async markAsRead(transactionId: string, userId: string) {
    return prisma.message.updateMany({
      where: {
        transactionId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string) {
    const result: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS unreadCount
      FROM messages m
      JOIN transactions t ON t.id = m.transactionId
      WHERE m.senderId != ${userId}
        AND m.isRead = 0
        AND m.isDeleted = 0
        AND (t.requesterId = ${userId} OR t.offererId = ${userId})
        AND t.status = 'IN_PROGRESS'
    `;
    return Number(result[0]?.unreadCount ?? 0);
  }
}

export const messageRepository = new MessageRepository();
