import { ratingRepository } from '../repositories/ratingRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { userRepository } from '../repositories/userRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from '../utils/errors';

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

    const rating = await ratingRepository.create({
      transaction: { connect: { id: transactionId } },
      giver: { connect: { id: giverId } },
      receiver: { connect: { id: receiverId } },
      score,
      review,
    });

    // Update receiver reputation
    await userRepository.updateReputation(receiverId);

    if (rating) {
      await notificationRepository.create({
        userId: receiverId,
        type: 'SYSTEM',
        title: 'New Rating Received',
        message: `You received a ${score}-star rating!`,
        data: JSON.stringify({ transactionId, ratingId: rating.id }),
      });
    }

    return rating;
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

    // Recalculate receiver reputation after rating update
    await userRepository.updateReputation(rating.receiverId);

    return updated;
  }

  async delete(ratingId: string, userId: string) {
    const rating = await ratingRepository.findById(ratingId);
    if (!rating) throw new NotFoundError('Rating not found');
    if (rating.giverId !== userId) throw new ForbiddenError('Not authorized to delete this rating');

    await ratingRepository.softDelete(ratingId);

    // Recalculate receiver reputation after rating deletion
    await userRepository.updateReputation(rating.receiverId);

    return { message: 'Rating deleted successfully' };
  }

  async getStats(userId: string) {
    return ratingRepository.getStats(userId);
  }
}

export const ratingService = new RatingService();
