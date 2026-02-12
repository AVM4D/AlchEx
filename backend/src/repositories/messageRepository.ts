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

  async findByTransaction(transactionId: string, skip?: number, take?: number) {
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { transactionId, isDeleted: false },
        skip,
        take,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, profilePicture: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.message.count({ where: { transactionId, isDeleted: false } }),
    ]);
    return { messages, total };
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
    return prisma.message.count({
      where: {
        senderId: { not: userId },
        isRead: false,
        transaction: {
          OR: [{ requesterId: userId }, { offererId: userId }],
          status: 'IN_PROGRESS',
        },
      },
    });
  }
}

export const messageRepository = new MessageRepository();
