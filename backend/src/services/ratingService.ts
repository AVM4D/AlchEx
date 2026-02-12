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

    await notificationRepository.create({
      userId: receiverId,
      type: 'SYSTEM',
      title: 'New Rating Received',
      message: `You received a ${score}-star rating!`,
      data: JSON.stringify({ transactionId, ratingId: rating.id }),
    });

    return rating;
  }

  async getByUser(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    return ratingRepository.findByReceiver(userId, skip, limit);
  }

  async getStats(userId: string) {
    return ratingRepository.getStats(userId);
  }
}

export const ratingService = new RatingService();
