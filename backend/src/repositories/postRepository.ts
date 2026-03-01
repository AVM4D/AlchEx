import prisma from '../prisma/client';
import { Prisma } from '@prisma/client';

export class PostRepository {
  async findById(id: string) {
    return prisma.post.findUnique({
      where: { id, isDeleted: false },
      include: {
        user: {
          select: {
            id: true, firstName: true, lastName: true, profilePicture: true,
            university: true, reputationScore: true,
          },
        },
        offers: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true, firstName: true, lastName: true, profilePicture: true,
                reputationScore: true,
              },
            },
          },
        },
        _count: { select: { offers: { where: { isDeleted: false } } } },
      },
    });
  }

  async create(data: Prisma.PostCreateInput) {
    return prisma.post.create({ data });
  }

  async update(id: string, data: Prisma.PostUpdateInput) {
    return prisma.post.update({ where: { id }, data });
  }

  async softDelete(id: string) {
    return prisma.post.update({ where: { id }, data: { isDeleted: true } });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.PostWhereInput;
    orderBy?: Prisma.PostOrderByWithRelationInput;
  }) {
    const { skip = 0, take = 20, where, orderBy } = params;

    // Build dynamic WHERE conditions
    const conditions: string[] = ['p.isDeleted = 0'];
    const values: any[] = [];

    if (where?.status) {
      conditions.push(`p.status = '${where.status}'`);
    }
    if (where?.userId) {
      values.push(where.userId);
    }
    if (where?.category) {
      conditions.push(`p.category = '${where.category}'`);
    }
    if (where?.OR && Array.isArray(where.OR)) {
      const orParts: string[] = [];
      for (const cond of where.OR as any[]) {
        if (cond.title?.contains) orParts.push(`p.title LIKE '%${cond.title.contains}%'`);
        if (cond.description?.contains) orParts.push(`p.description LIKE '%${cond.description.contains}%'`);
        if (cond.whatINeed?.contains) orParts.push(`p.whatINeed LIKE '%${cond.whatINeed.contains}%'`);
        if (cond.whatIOffer?.contains) orParts.push(`p.whatIOffer LIKE '%${cond.whatIOffer.contains}%'`);
      }
      if (orParts.length > 0) {
        conditions.push(`(${orParts.join(' OR ')})`);
      }
    }

    if (where?.userId) {
      conditions.push(`p.userId = '${where.userId}'`);
    }

    const whereClause = conditions.join(' AND ');

    // Determine ORDER BY
    let orderClause = 'p.createdAt DESC';
    if (orderBy) {
      const key = Object.keys(orderBy)[0];
      const dir = (orderBy as any)[key];
      orderClause = `p.${key} ${dir === 'asc' ? 'ASC' : 'DESC'}`;
    }

    const posts = await prisma.$queryRawUnsafe(`
      SELECT
        p.id, p.userId, p.title, p.description, p.whatINeed, p.whatIOffer,
        p.category, p.tags, p.status, p.notifyOnOffers, p.expiresAt,
        p.isDeleted, p.createdAt, p.updatedAt,
        u.id AS [user.id], u.firstName AS [user.firstName], u.lastName AS [user.lastName],
        u.profilePicture AS [user.profilePicture], u.university AS [user.university],
        u.reputationScore AS [user.reputationScore],
        ISNULL(oc.offerCount, 0) AS offerCount
      FROM posts p
      JOIN users u ON u.id = p.userId
      LEFT JOIN (
        SELECT postId, COUNT(*) AS offerCount
        FROM offers WHERE isDeleted = 0
        GROUP BY postId
      ) oc ON oc.postId = p.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      OFFSET ${skip} ROWS FETCH NEXT ${take} ROWS ONLY
    `);

    const countResult: any[] = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total FROM posts p WHERE ${whereClause}
    `);
    const total = countResult[0]?.total ?? 0;

    // Restructure to match Prisma's nested shape
    const formatted = (posts as any[]).map((row: any) => ({
      id: row.id, userId: row.userId, title: row.title, description: row.description,
      whatINeed: row.whatINeed, whatIOffer: row.whatIOffer, category: row.category,
      tags: row.tags, status: row.status, notifyOnOffers: row.notifyOnOffers,
      expiresAt: row.expiresAt, isDeleted: row.isDeleted,
      createdAt: row.createdAt, updatedAt: row.updatedAt,
      user: {
        id: row['user.id'], firstName: row['user.firstName'], lastName: row['user.lastName'],
        profilePicture: row['user.profilePicture'], university: row['user.university'],
        reputationScore: row['user.reputationScore'],
      },
      _count: { offers: row.offerCount },
    }));

    return { posts: formatted, total: Number(total) };
  }

  async findByUserId(userId: string, skip?: number, take?: number) {
    return this.findAll({ skip, take, where: { userId } });
  }

  async expirePosts() {
    return prisma.post.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lte: new Date() },
        isDeleted: false,
      },
      data: { status: 'EXPIRED' },
    });
  }
}

export const postRepository = new PostRepository();
