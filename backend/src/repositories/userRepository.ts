import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class UserRepository {
  async findById(id: string) {
    return prisma.user.findUnique({ where: { id, isDeleted: false } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.user.update({ where: { id }, data: { isDeleted: true } });
  }

  async findAll(params: { skip?: number; take?: number; where?: Prisma.UserWhereInput }) {
    const { skip, take, where } = params;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { ...where, isDeleted: false },
        skip,
        take,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          profilePicture: true, bio: true, batch: true, program: true,
          section: true, university: true, campus: true, role: true,
          isBanned: true, reputationScore: true, totalExchanges: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where: { ...where, isDeleted: false } }),
    ]);
    return { users, total };
  }

  async getLeaderboard(limit: number, dateFilter?: Date) {
    const where: Prisma.UserWhereInput = {
      isDeleted: false,
      isBanned: false,
      totalExchanges: { gt: 0 },
    };

    return prisma.user.findMany({
      where,
      select: {
        id: true, firstName: true, lastName: true, profilePicture: true,
        university: true, reputationScore: true, totalExchanges: true,
      },
      orderBy: { reputationScore: 'desc' },
      take: limit,
    });
  }

  async updateReputation(userId: string) {
    const ratings = await prisma.rating.aggregate({
      where: { receiverId: userId, isDeleted: false },
      _avg: { score: true },
      _count: { score: true },
    });

    const exchangeCount = await prisma.transaction.count({
      where: {
        OR: [{ requesterId: userId }, { offererId: userId }],
        status: 'SUCCESSFUL',
      },
    });

    const avgRating = ratings._avg.score || 0;
    const ratingCount = ratings._count.score || 0;

    // Weighted reputation: 60% avg rating + 40% exchange volume (normalized)
    const normalizedExchanges = Math.min(exchangeCount / 50, 1) * 5;
    const reputationScore = (avgRating * 0.6 + normalizedExchanges * 0.4);

    return prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: Math.round(reputationScore * 100) / 100,
        totalExchanges: exchangeCount,
      },
    });
  }
}

export const userRepository = new UserRepository();
