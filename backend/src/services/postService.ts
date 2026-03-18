import { postRepository } from '../repositories/postRepository';
import { offerRepository } from '../repositories/offerRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { userRepository } from '../repositories/userRepository';
import db from '../db/connection';
import {
  BadRequestError, ForbiddenError, NotFoundError, ConflictError
} from '../utils/errors';
import { CreatePostInput, UpdatePostInput, MarketplaceQuery } from '../utils/validators';
import { paginate, paginationMeta } from '../utils/helpers';

export class PostService {
  async create(userId: string, input: CreatePostInput) {
    const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const post = await postRepository.create({
      user: { connect: { id: userId } },
      title: input.title,
      description: input.description,
      whatINeed: input.whatINeed,
      whatIOffer: input.whatIOffer,
      category: input.category,
      tags: input.tags ? JSON.stringify(input.tags) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : defaultExpiry,
      notifyOnOffers: input.notifyOnOffers ?? true,
    });
    return post;
  }

  async getById(id: string) {
    const post = await postRepository.findById(id);
    if (!post) throw new NotFoundError('Post not found');
    return post;
  }

  async update(id: string, userId: string, input: UpdatePostInput) {
    const post = await postRepository.findById(id);
    if (!post) throw new NotFoundError('Post not found');
    if (post.userId !== userId) throw new ForbiddenError('Not authorized to update this post');
    if (post.status !== 'ACTIVE') throw new BadRequestError('Only active posts can be updated');

    return postRepository.update(id, {
      ...input,
      tags: input.tags ? JSON.stringify(input.tags) : undefined,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    });
  }

  async delete(id: string, userId: string, isAdmin: boolean = false) {
    const post = await postRepository.findById(id);
    if (!post) throw new NotFoundError('Post not found');
    if (!isAdmin && post.userId !== userId) {
      throw new ForbiddenError('Not authorized to delete this post');
    }
    return postRepository.softDelete(id);
  }

  async getMarketplace(query: MarketplaceQuery, userId?: string) {
    const { skip, take } = paginate(query.page, query.limit);
    const where: any = { status: query.status || 'ACTIVE' };

    if (query.category) where.category = query.category;
    if (query.search) {
      where.search = query.search;
    }

    const { posts, total } = await postRepository.findAll({
      skip,
      take,
      where,
      orderBy: { [query.sortBy]: query.sortOrder } as any,
    });

    // If authenticated, attach the caller's offer (if any) to each post
    let postsWithMyOffer = posts as any[];
    if (userId) {
      const postIds = posts.map((p: any) => p.id);
      let myOffers: any[] = [];
      if (postIds.length > 0) {
        const idList = postIds.map((pid: string) => `'${pid}'`).join(',');
        myOffers = await db.queryUnsafe(`
          SELECT id, postId, proposalDescription, counterExchange, status, createdAt, expiresAt
          FROM offers
          WHERE postId IN (${idList}) AND userId = @v0 AND isDeleted = 0
        `, userId) as any[];
      }
      const offerMap = new Map(myOffers.map((o: any) => [o.postId, o]));
      postsWithMyOffer = posts.map((p: any) => ({
        ...p,
        myOffer: offerMap.get(p.id) || null,
      }));
    }

    return {
      posts: postsWithMyOffer,
      pagination: paginationMeta(total, query.page, query.limit),
    };
  }

  async getByUser(userId: string, page: number = 1, limit: number = 20) {
    const { skip, take } = paginate(page, limit);
    const { posts, total } = await postRepository.findByUserId(userId, skip, take);
    return { posts, pagination: paginationMeta(total, page, limit) };
  }

  async getCategories() {
    return [
      'Tutoring', 'Notes & Study Material', 'Lab Help',
      'Project Collaboration', 'Design Work', 'Coding Help',
      'Writing & Editing', 'Translation', 'Research Help',
      'Skill Exchange', 'Equipment Lending', 'Event Help',
      'Career Mentoring', 'Other',
    ];
  }
}

export const postService = new PostService();
