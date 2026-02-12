import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class TransactionRepository {
  async findById(id: string) {
    return prisma.transaction.findUnique({
      where: { id, isDeleted: false },
      include: {
        post: { select: { id: true, title: true, description: true } },
        offer: { select: { id: true, proposalDescription: true, counterExchange: true } },
        requester: {
          select: {
            id: true, firstName: true, lastName: true, profilePicture: true,
            reputationScore: true,
          },
        },
        offerer: {
          select: {
            id: true, firstName: true, lastName: true, profilePicture: true,
            reputationScore: true,
          },
        },
        ratings: true,
      },
    });
  }

  async create(data: Prisma.TransactionCreateInput) {
    return prisma.transaction.create({ data });
  }

  async update(id: string, data: Prisma.TransactionUpdateInput) {
    return prisma.transaction.update({ where: { id }, data });
  }

  async findByUser(userId: string, skip?: number, take?: number) {
    const where: Prisma.TransactionWhereInput = {
      OR: [{ requesterId: userId }, { offererId: userId }],
      isDeleted: false,
    };
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take,
        include: {
          post: { select: { id: true, title: true } },
          requester: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
          offerer: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.count({ where }),
    ]);
    return { transactions, total };
  }

  async expireTransactions() {
    return prisma.transaction.updateMany({
      where: {
        status: 'IN_PROGRESS',
        expiresAt: { lte: new Date() },
        isDeleted: false,
      },
      data: { status: 'EXPIRED' },
    });
  }
}

export const transactionRepository = new TransactionRepository();
