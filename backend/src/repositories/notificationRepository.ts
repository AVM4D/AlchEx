import prisma from '../prisma/client';

export class NotificationRepository {
  async create(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: string;
  }) {
    return prisma.notification.create({ data });
  }

  async findByUser(userId: string, skip: number = 0, take: number = 20) {
    // Main query: paginated notifications
    const notifications = await prisma.$queryRaw`
      SELECT id, userId, type, title, message, data, isRead, createdAt
      FROM notifications
      WHERE userId = ${userId}
      ORDER BY createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;

    // Total count
    const countResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM notifications WHERE userId = ${userId}
    `;
    const total = Number(countResult[0]?.total ?? 0);

    // Unread count
    const unreadResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS unreadCount FROM notifications WHERE userId = ${userId} AND isRead = 0
    `;
    const unreadCount = Number(unreadResult[0]?.unreadCount ?? 0);

    return { notifications: notifications as any[], total, unreadCount };
  }

  async markAsRead(id: string, userId: string) {
    return prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string, userId: string) {
    return prisma.notification.delete({
      where: { id, userId },
    });
  }
}

export const notificationRepository = new NotificationRepository();
