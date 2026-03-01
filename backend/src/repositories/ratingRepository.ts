import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class RatingRepository {
  async create(data: Prisma.RatingCreateInput) {
    return prisma.rating.create({ data });
  }

  async findById(id: string) {
    return prisma.rating.findUnique({
      where: { id, isDeleted: false },
      include: {
        giver: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        transaction: { select: { id: true, status: true } },
      },
    });
  }

  async update(id: string, data: Prisma.RatingUpdateInput) {
    return prisma.rating.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.rating.update({
      where: { id },
      data: { isDeleted: true },
    });
  }

  async findByTransactionAndGiver(transactionId: string, giverId: string) {
    return prisma.rating.findUnique({
      where: { transactionId_giverId: { transactionId, giverId } },
    });
  }

  async findByReceiver(receiverId: string, skip: number = 0, take: number = 20) {
    const ratings = await prisma.$queryRaw`
      SELECT
        r.id, r.transactionId, r.giverId, r.receiverId, r.score, r.review,
        r.isDeleted, r.createdAt,
        g.id AS [giver.id], g.firstName AS [giver.firstName],
        g.lastName AS [giver.lastName], g.profilePicture AS [giver.profilePicture]
      FROM ratings r
      JOIN users g ON g.id = r.giverId
      WHERE r.receiverId = ${receiverId} AND r.isDeleted = 0
      ORDER BY r.createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `;

    const countResult: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS total FROM ratings WHERE receiverId = ${receiverId} AND isDeleted = 0
    `;
    const total = Number(countResult[0]?.total ?? 0);

    const formatted = (ratings as any[]).map((row: any) => ({
      id: row.id, transactionId: row.transactionId, giverId: row.giverId,
      receiverId: row.receiverId, score: row.score, review: row.review,
      isDeleted: row.isDeleted, createdAt: row.createdAt,
      giver: {
        id: row['giver.id'], firstName: row['giver.firstName'],
        lastName: row['giver.lastName'], profilePicture: row['giver.profilePicture'],
      },
    }));

    return { ratings: formatted, total };
  }

  async getStats(receiverId: string) {
    // Aggregate: AVG and COUNT
    const aggregate: any[] = await prisma.$queryRaw`
      SELECT
        ISNULL(AVG(CAST(score AS FLOAT)), 0) AS averageRating,
        COUNT(score) AS totalRatings
      FROM ratings
      WHERE receiverId = ${receiverId} AND isDeleted = 0
    `;

    // Distribution: GROUP BY score
    const distribution: any[] = await prisma.$queryRaw`
      SELECT score, COUNT(score) AS count
      FROM ratings
      WHERE receiverId = ${receiverId} AND isDeleted = 0
      GROUP BY score
      ORDER BY score DESC
    `;

    return {
      averageRating: aggregate[0]?.averageRating ?? 0,
      totalRatings: Number(aggregate[0]?.totalRatings ?? 0),
      distribution: distribution.map((d: any) => ({
        score: d.score,
        count: Number(d.count),
      })),
    };
  }
}

export const ratingRepository = new RatingRepository();
