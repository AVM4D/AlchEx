import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class OfferRepository {
  async findById(id: string) {
    return prisma.offer.findUnique({
      where: { id, isDeleted: false },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, profilePicture: true,
            reputationScore: true,
          },
        },
        post: {
          select: { id: true, title: true, userId: true, status: true, notifyOnOffers: true, expiresAt: true },
        },
      },
    });
  }

  async create(data: Prisma.OfferCreateInput) {
    return prisma.offer.create({ data });
  }

  async update(id: string, data: Prisma.OfferUpdateInput) {
    return prisma.offer.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.offer.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async findByPostAndUser(postId: string, userId: string) {
    return prisma.offer.findUnique({
      where: { postId_userId: { postId, userId } },
    });
  }

  async findByPost(postId: string) {
    return prisma.offer.findMany({
      where: { postId, isDeleted: false },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, profilePicture: true,
            reputationScore: true,
          },
        },
        transaction: {
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string, skip: number = 0, take: number = 20) {
    const offers = await prisma.$queryRaw`
      SELECT
        o.id, o.postId, o.userId, o.proposalDescription, o.counterExchange,
        o.status, o.expiresAt, o.isDeleted, o.createdAt, o.updatedAt,
        p.id AS [post.id], p.title AS [post.title], p.status AS [post.status], p.userId AS [post.userId],
        t.id AS [transaction.id]
      FROM offers o
      JOIN posts p ON p.id = o.postId
      LEFT JOIN transactions t ON t.offerId = o.id AND t.isDeleted = 0
      WHERE o.userId = ${userId} AND o.isDeleted = 0
      ORDER BY o.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;

    const countResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM offers WHERE userId = ${userId} AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (offers as any[]).map((row: any) => ({
      id: row.id, postId: row.postId, userId: row.userId,
      proposalDescription: row.proposalDescription, counterExchange: row.counterExchange,
      status: row.status, expiresAt: row.expiresAt, isDeleted: row.isDeleted,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      post: { id: row['post.id'], title: row['post.title'], status: row['post.status'], userId: row['post.userId'] },
      transaction: row['transaction.id'] ? { id: row['transaction.id'] } : null,
    }));

    return { offers: formatted, total };
  }

  async rejectOtherOffers(postId: string, acceptedOfferId: string) {
    return prisma.offer.updateMany({
      where: {
        postId,
        id: { not: acceptedOfferId },
        status: 'PENDING',
      },
      data: { status: 'REJECTED' },
    });
  }

  async expireOffers() {
    return prisma.offer.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lte: new Date() },
        isDeleted: false,
      },
      data: { status: 'EXPIRED' },
    });
  }
}

export const offerRepository = new OfferRepository();
