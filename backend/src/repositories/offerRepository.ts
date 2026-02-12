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
          select: { id: true, title: true, userId: true, status: true },
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUser(userId: string, skip?: number, take?: number) {
    const [offers, total] = await Promise.all([
      prisma.offer.findMany({
        where: { userId, isDeleted: false },
        skip,
        take,
        include: {
          post: {
            select: { id: true, title: true, status: true, userId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.offer.count({ where: { userId, isDeleted: false } }),
    ]);
    return { offers, total };
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
}

export const offerRepository = new OfferRepository();
