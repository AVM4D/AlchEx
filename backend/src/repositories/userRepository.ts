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
    const { skip = 0, take = 20, where } = params;

    // Build dynamic WHERE
    const conditions: string[] = ['isDeleted = 0'];
    if (where?.OR && Array.isArray(where.OR)) {
      const orParts: string[] = [];
      for (const cond of where.OR as any[]) {
        if (cond.firstName?.contains) orParts.push(`firstName LIKE '%${cond.firstName.contains}%'`);
        if (cond.lastName?.contains) orParts.push(`lastName LIKE '%${cond.lastName.contains}%'`);
        if (cond.email?.contains) orParts.push(`email LIKE '%${cond.email.contains}%'`);
      }
      if (orParts.length > 0) conditions.push(`(${orParts.join(' OR ')})`);
    }
    const whereClause = conditions.join(' AND ');

    const users = await prisma.$queryRawUnsafe(`
      SELECT id, email, firstName, lastName, profilePicture, bio, batch, program,
             section, university, campus, role, isBanned, reputationScore,
             totalExchanges, createdAt
      FROM users
      WHERE ${whereClause}
      ORDER BY createdAt DESC
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);

    const countResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total FROM users WHERE ${whereClause}
    `);
    const total = Number(countResult[0]?.total ?? 0);

    return { users: users as any[], total };
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
    // Step 1: Get average rating and count using raw SQL aggregate
    const ratingStats: any[] = await prisma.$queryRaw`
      SELECT
        ISNULL(AVG(CAST(score AS FLOAT)), 0) AS avgRating,
        COUNT(score) AS ratingCount
      FROM ratings
      WHERE receiverId = ${userId} AND isDeleted = 0
    `;
    const avgRating = ratingStats[0]?.avgRating ?? 0;
    const ratingCount = ratingStats[0]?.ratingCount ?? 0;

    // Step 2: Count successful exchanges with OR condition
    const exchangeStats: any[] = await prisma.$queryRaw`
      SELECT COUNT(*) AS exchangeCount
      FROM transactions
      WHERE (requesterId = ${userId} OR offererId = ${userId})
        AND status = 'SUCCESSFUL'
    `;
    const exchangeCount = Number(exchangeStats[0]?.exchangeCount ?? 0);

    // Step 3: Compute weighted reputation: 60% rating + 40% volume (normalized)
    const normalizedExchanges = Math.min(exchangeCount / 50, 1) * 5;
    const reputationScore = (avgRating * 0.6 + normalizedExchanges * 0.4);
    const roundedScore = Math.round(reputationScore * 100) / 100;

    // Step 4: Update the user record
    await prisma.$executeRaw`
      UPDATE users
      SET reputationScore = ${roundedScore},
          totalExchanges = ${exchangeCount},
          updatedAt = GETDATE()
      WHERE id = ${userId}
    `;

    return prisma.user.findUnique({ where: { id: userId } });
  }
}

export const userRepository = new UserRepository();
