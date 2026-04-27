import { offerRepository } from '../repositories/offerRepository';
import { postRepository } from '../repositories/postRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import {
  BadRequestError, ForbiddenError, NotFoundError, ConflictError
} from '../utils/errors';
import db from '../db/connection';

export class OfferService {
  async create(userId: string, postId: string, proposalDescription: string, counterExchange?: string) {
    const post = await postRepository.findById(postId);
    if (!post) throw new NotFoundError('Post not found');
    if (post.userId === userId) throw new BadRequestError('Cannot offer on your own post');
    if (post.status !== 'ACTIVE') throw new BadRequestError('Post is not accepting offers');
    if (post.expiresAt < new Date()) throw new BadRequestError('Post has expired');

    const existing = await offerRepository.findByPostAndUser(postId, userId);
    if (existing) throw new ConflictError('You have already submitted an offer on this post');

    // Offers expire after 48 hours to create urgency
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    const offer = await offerRepository.create({
      post: { connect: { id: postId } },
      user: { connect: { id: userId } },
      proposalDescription,
      counterExchange,
      expiresAt,
    });

    // Notify post owner only if they opted in
    if (post.notifyOnOffers !== false && offer) {
      await notificationRepository.create({
        userId: post.userId,
        type: 'OFFER_RECEIVED',
        title: 'New Offer Received',
        message: `You received a new offer on "${post.title}"`,
        data: JSON.stringify({ postId, offerId: offer.id }),
      });
    }

    return offer;
  }

  async accept(offerId: string, userId: string) {
    const offer = await offerRepository.findById(offerId);
    if (!offer) throw new NotFoundError('Offer not found');
    if (offer.post.userId !== userId) throw new ForbiddenError('Only the post owner can accept offers');
    if (offer.status !== 'PENDING') throw new BadRequestError('Offer is no longer pending');
    if (offer.post.status !== 'ACTIVE') throw new BadRequestError('Post is not active');
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) throw new BadRequestError('This offer has expired');

    // Call stored procedure — atomically accept, reject others, create transaction
    let txId: string;
    try {
      const result = await db.callProcedure('sp_AcceptOffer', {
        offerId,
        requesterId: userId,
      }, {
        txId: { type: require('mssql').NVarChar(36) },
      });
      txId = result.output.txId;
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to accept offer');
    }

    // Notify the offer creator
    await notificationRepository.create({
      userId: offer.userId,
      type: 'OFFER_ACCEPTED',
      title: 'Offer Accepted!',
      message: `Your offer on "${offer.post.title}" was accepted. Chat is now unlocked.`,
      data: JSON.stringify({ transactionId: txId }),
    });

    // Notify rejected offers
    const rejectedOffers = await offerRepository.findByPost(offer.postId);
    for (const rejected of rejectedOffers) {
      if (rejected.user.id !== offer.userId) {
        await notificationRepository.create({
          userId: rejected.user.id,
          type: 'OFFER_REJECTED',
          title: 'Offer Not Selected',
          message: `Another offer was selected for "${offer.post.title}"`,
        });
      }
    }

    return transactionRepository.findById(txId);
  }

  async update(offerId: string, userId: string, data: { proposalDescription?: string; counterExchange?: string }) {
    const offer = await offerRepository.findById(offerId);
    if (!offer) throw new NotFoundError('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenError('Not authorized');
    if (offer.status !== 'PENDING') throw new BadRequestError('Only pending offers can be edited');
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) throw new BadRequestError('This offer has expired');

    const updateData: any = {};
    if (data.proposalDescription !== undefined) updateData.proposalDescription = data.proposalDescription;
    if (data.counterExchange !== undefined) updateData.counterExchange = data.counterExchange;

    return offerRepository.update(offerId, updateData);
  }

  async withdraw(offerId: string, userId: string) {
    const offer = await offerRepository.findById(offerId);
    if (!offer) throw new NotFoundError('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenError('Not authorized');
    if (offer.status !== 'PENDING') throw new BadRequestError('Offer is no longer pending');

    return offerRepository.update(offerId, { status: 'WITHDRAWN' });
  }

  async delete(offerId: string, userId: string) {
    const offer = await offerRepository.findById(offerId);
    if (!offer) throw new NotFoundError('Offer not found');
    if (offer.userId !== userId) throw new ForbiddenError('Not authorized');
    if (offer.status !== 'PENDING' && offer.status !== 'WITHDRAWN') {
      throw new BadRequestError('Only pending or withdrawn offers can be deleted');
    }

    return offerRepository.softDelete(offerId);
  }

  async getByPost(postId: string) {
    return offerRepository.findByPost(postId);
  }

  async getByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return offerRepository.findByUser(userId, skip, limit);
  }
}

export const offerService = new OfferService();
