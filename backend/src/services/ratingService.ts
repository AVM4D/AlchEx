import { ratingRepository } from '../repositories/ratingRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { userRepository } from '../repositories/userRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../utils/errors';
import db from '../db/connection';

export class RatingService {
  async create(giverId: string, transactionId: string, score: number, review?: string) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) throw new NotFoundError('Transaction not found');
    if (transaction.status !== 'SUCCESSFUL') {
      throw new BadRequestError('Can only rate successful exchanges');
    }

    const isRequester = transaction.requesterId === giverId;
    const isOfferer = transaction.offererId === giverId;
    if (!isRequester && !isOfferer) throw new ForbiddenError('Not part of this transaction');

    const existing = await ratingRepository.findByTransactionAndGiver(transactionId, giverId);
    if (existing) throw new ConflictError('You have already rated this exchange');

    const receiverId = isRequester ? transaction.offererId : transaction.requesterId;
    const ratingId = crypto.randomUUID();

    // Call stored procedure — creates rating + recalculates reputation + sends notification
    try {
      await db.callProcedure('sp_CreateRating', {
        ratingId,
        transactionId,
        giverId,
        receiverId,
        score,
        review: review ?? null,
      });
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to create rating');
    }

    return ratingRepository.findById(ratingId);
  }

  async getByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return ratingRepository.findByReceiver(userId, skip, limit);
  }

  async getById(ratingId: string) {
    const rating = await ratingRepository.findById(ratingId);
    if (!rating) throw new NotFoundError('Rating not found');
    return rating;
  }

  async update(ratingId: string, userId: string, data: { score?: number; review?: string }) {
    const rating = await ratingRepository.findById(ratingId);
    if (!rating) throw new NotFoundError('Rating not found');
    if (rating.giverId !== userId) throw new ForbiddenError('Not authorized to edit this rating');

    const updateData: any = {};
    if (data.score !== undefined) updateData.score = data.score;
    if (data.review !== undefined) updateData.review = data.review;

    const updated = await ratingRepository.update(ratingId, updateData);

    // Recalculate receiver reputation after rating update (via SP)
    try {
      await db.callProcedure('sp_RecalculateReputation', { userId: rating.receiverId });
    } catch { /* ignore */ }

    return updated;
  }

  async delete(ratingId: string, userId: string) {
    const rating = await ratingRepository.findById(ratingId);
    if (!rating) throw new NotFoundError('Rating not found');
    if (rating.giverId !== userId) throw new ForbiddenError('Not authorized to delete this rating');

    await ratingRepository.softDelete(ratingId);

    // Recalculate receiver reputation after rating deletion (via SP)
    try {
      await db.callProcedure('sp_RecalculateReputation', { userId: rating.receiverId });
    } catch { /* ignore */ }

    return { message: 'Rating deleted successfully' };
  }

  async getStats(userId: string) {
    return ratingRepository.getStats(userId);
  }
}

export const ratingService = new RatingService();
