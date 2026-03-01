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

  async findByUser(userId: string, skip: number = 0, take: number = 20) {
    const transactions = await prisma.$queryRaw`
      SELECT
        t.id, t.postId, t.offerId, t.requesterId, t.offererId,
        t.status, t.requesterDone, t.offererDone, t.requesterCancel, t.offererCancel,
        t.completedAt, t.cancelledAt, t.expiresAt, t.isDeleted, t.createdAt, t.updatedAt,
        p.id AS [post.id], p.title AS [post.title],
        req.id AS [requester.id], req.firstName AS [requester.firstName],
        req.lastName AS [requester.lastName], req.profilePicture AS [requester.profilePicture],
        off2.id AS [offerer.id], off2.firstName AS [offerer.firstName],
        off2.lastName AS [offerer.lastName], off2.profilePicture AS [offerer.profilePicture]
      FROM transactions t
      JOIN posts p ON p.id = t.postId
      JOIN users req ON req.id = t.requesterId
      JOIN users off2 ON off2.id = t.offererId
      WHERE (t.requesterId = ${userId} OR t.offererId = ${userId})
        AND t.isDeleted = 0
      ORDER BY t.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;

    const countResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM transactions
      WHERE (requesterId = ${userId} OR offererId = ${userId}) AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (transactions as any[]).map((row: any) => ({
      id: row.id, postId: row.postId, offerId: row.offerId, requesterId: row.requesterId,
      offererId: row.offererId, status: row.status, requesterDone: row.requesterDone,
      offererDone: row.offererDone, requesterCancel: row.requesterCancel, offererCancel: row.offererCancel,
      completedAt: row.completedAt, cancelledAt: row.cancelledAt, expiresAt: row.expiresAt,
      isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      post: { id: row['post.id'], title: row['post.title'] },
      requester: { id: row['requester.id'], firstName: row['requester.firstName'], lastName: row['requester.lastName'], profilePicture: row['requester.profilePicture'] },
      offerer: { id: row['offerer.id'], firstName: row['offerer.firstName'], lastName: row['offerer.lastName'], profilePicture: row['offerer.profilePicture'] },
    }));

    return { transactions: formatted, total };
  }

  async softDelete(id: string) {
    return prisma.transaction.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async findAll(skip: number = 0, take: number = 20, where?: Prisma.TransactionWhereInput) {
    // Build dynamic WHERE for optional status filter
    const statusFilter = where?.status ? `AND t.status = '${where.status}'` : '';

    const transactions = await prisma.$queryRawUnsafe(`
      SELECT
        t.id, t.postId, t.offerId, t.requesterId, t.offererId,
        t.status, t.requesterDone, t.offererDone, t.requesterCancel, t.offererCancel,
        t.completedAt, t.cancelledAt, t.expiresAt, t.isDeleted, t.createdAt, t.updatedAt,
        p.id AS [post.id], p.title AS [post.title],
        req.id AS [requester.id], req.firstName AS [requester.firstName],
        req.lastName AS [requester.lastName], req.profilePicture AS [requester.profilePicture],
        off2.id AS [offerer.id], off2.firstName AS [offerer.firstName],
        off2.lastName AS [offerer.lastName], off2.profilePicture AS [offerer.profilePicture]
      FROM transactions t
      JOIN posts p ON p.id = t.postId
      JOIN users req ON req.id = t.requesterId
      JOIN users off2 ON off2.id = t.offererId
      WHERE t.isDeleted = 0 ${statusFilter}
      ORDER BY t.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);

    const countResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total FROM transactions t WHERE t.isDeleted = 0 ${statusFilter}
    `);
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (transactions as any[]).map((row: any) => ({
      id: row.id, postId: row.postId, offerId: row.offerId, requesterId: row.requesterId,
      offererId: row.offererId, status: row.status, requesterDone: row.requesterDone,
      offererDone: row.offererDone, requesterCancel: row.requesterCancel, offererCancel: row.offererCancel,
      completedAt: row.completedAt, cancelledAt: row.cancelledAt, expiresAt: row.expiresAt,
      isDeleted: row.isDeleted, createdAt: row.createdAt, updatedAt: row.updatedAt,
      post: { id: row['post.id'], title: row['post.title'] },
      requester: { id: row['requester.id'], firstName: row['requester.firstName'], lastName: row['requester.lastName'], profilePicture: row['requester.profilePicture'] },
      offerer: { id: row['offerer.id'], firstName: row['offerer.firstName'], lastName: row['offerer.lastName'], profilePicture: row['offerer.profilePicture'] },
    }));

    return { transactions: formatted, total };
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
