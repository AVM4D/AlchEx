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
    const { skip, take, where, orderBy } = params;
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { ...where, isDeleted: false },
        skip,
        take,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, profilePicture: true,
              university: true, reputationScore: true,
            },
          },
          _count: { select: { offers: { where: { isDeleted: false } } } },
        },
      }),
      prisma.post.count({ where: { ...where, isDeleted: false } }),
    ]);
    return { posts, total };
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
