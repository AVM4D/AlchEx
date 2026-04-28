import { transactionRepository } from '../repositories/transactionRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import db from '../db/connection';
import { paginate, paginationMeta } from '../utils/helpers';

export class TransactionService {
  async getById(id: string, userId: string) {
    const transaction = await transactionRepository.findById(id);
    if (!transaction) throw new NotFoundError('Transaction not found');
    if (transaction.requesterId !== userId && transaction.offererId !== userId) {
      throw new ForbiddenError('Not authorized to view this transaction');
    }
    return transaction;
  }

  async markComplete(transactionId: string, userId: string) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) throw new NotFoundError('Transaction not found');
    if (transaction.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Transaction is not in progress');
    }

    const isRequester = transaction.requesterId === userId;
    const isOfferer = transaction.offererId === userId;
    if (!isRequester && !isOfferer) throw new ForbiddenError('Not authorized');

    // Call stored procedure — handles both-done logic + reputation recalculation
    try {
      const result = await db.callProcedure('sp_CompleteTransaction', {
        transactionId,
        userId,
      }, {
        bothDone: { type: db.types.Bit },
      });

      const bothDone = result.output.bothDone;

      // Notify the other party
      const otherUserId = isRequester ? transaction.offererId : transaction.requesterId;
      if (bothDone) {
        await notificationRepository.create({
          userId: otherUserId,
          type: 'TRANSACTION_COMPLETE',
          title: 'Exchange Complete!',
          message: 'The exchange has been marked as successful. Please leave a rating.',
          data: JSON.stringify({ transactionId }),
        });
      } else {
        await notificationRepository.create({
          userId: otherUserId,
          type: 'TRANSACTION_COMPLETE',
          title: 'Partner Marked Complete',
          message: 'Your exchange partner has marked their side as complete.',
          data: JSON.stringify({ transactionId }),
        });
      }
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to complete transaction');
    }

    return transactionRepository.findById(transactionId);
  }

  async cancel(transactionId: string, userId: string) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) throw new NotFoundError('Transaction not found');
    if (transaction.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Transaction is not in progress');
    }

    const isRequester = transaction.requesterId === userId;
    const isOfferer = transaction.offererId === userId;
    if (!isRequester && !isOfferer) throw new ForbiddenError('Not authorized');

    // Call stored procedure — atomically cancels transaction + updates post
    try {
      await db.callProcedure('sp_CancelTransaction', {
        transactionId,
        userId,
        isAdmin: false,
      });
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to cancel transaction');
    }

    const otherUserId = isRequester ? transaction.offererId : transaction.requesterId;
    await notificationRepository.create({
      userId: otherUserId,
      type: 'SYSTEM',
      title: 'Exchange Cancelled',
      message: 'The exchange has been cancelled by the other party.',
      data: JSON.stringify({ transactionId }),
    });

    return transactionRepository.findById(transactionId);
  }

  async forceCancel(transactionId: string) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) throw new NotFoundError('Transaction not found');

    try {
      await db.callProcedure('sp_CancelTransaction', {
        transactionId,
        userId: transaction.requesterId, // admin context
        isAdmin: true,
      });
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to force cancel');
    }

    // Notify both users
    for (const uid of [transaction.requesterId, transaction.offererId]) {
      await notificationRepository.create({
        userId: uid,
        type: 'SYSTEM',
        title: 'Exchange Force-Cancelled',
        message: 'An admin has cancelled this exchange.',
        data: JSON.stringify({ transactionId }),
      });
    }

    return transactionRepository.findById(transactionId);
  }

  async getByUser(userId: string, page: number = 1, limit: number = 20) {
    const { skip, take } = paginate(page, limit);
    const { transactions, total } = await transactionRepository.findByUser(userId, skip, take);
    return { transactions, pagination: paginationMeta(total, page, limit) };
  }

  async getAll(page: number = 1, limit: number = 20, status?: string) {
    const { skip, take } = paginate(page, limit);
    const where: any = {};
    if (status) where.status = status;
    const { transactions, total } = await transactionRepository.findAll(skip, take, where);
    return { transactions, pagination: paginationMeta(total, page, limit) };
  }
}

export const transactionService = new TransactionService();
