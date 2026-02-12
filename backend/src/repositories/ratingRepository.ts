import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class RatingRepository {
  async create(data: Prisma.RatingCreateInput) {
    return prisma.rating.create({ data });
  }

  async findByTransactionAndGiver(transactionId: string, giverId: string) {
    return prisma.rating.findUnique({
      where: { transactionId_giverId: { transactionId, giverId } },
    });
  }

  async findByReceiver(receiverId: string, skip?: number, take?: number) {
    const [ratings, total] = await Promise.all([
      prisma.rating.findMany({
        where: { receiverId, isDeleted: false },
        skip,
        take,
        include: {
          giver: { select: { id: true, firstName: true, lastName: true, profilePicture: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rating.count({ where: { receiverId, isDeleted: false } }),
    ]);
    return { ratings, total };
  }

  async getStats(receiverId: string) {
    const aggregate = await prisma.rating.aggregate({
      where: { receiverId, isDeleted: false },
      _avg: { score: true },
      _count: { score: true },
    });

    const distribution = await prisma.rating.groupBy({
      by: ['score'],
      where: { receiverId, isDeleted: false },
      _count: { score: true },
    });

    return {
      averageRating: aggregate._avg.score || 0,
      totalRatings: aggregate._count.score || 0,
      distribution: distribution.map((d) => ({
        score: d.score,
        count: d._count.score,
      })),
    };
  }
}

export const ratingRepository = new RatingRepository();
