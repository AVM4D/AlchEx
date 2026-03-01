import { transactionRepository } from '../repositories/transactionRepository';
import { userRepository } from '../repositories/userRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import prisma from '../prisma/client';
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

    const updateData: any = {};
    if (isRequester) updateData.requesterDone = true;
    if (isOfferer) updateData.offererDone = true;

    const newRequesterDone = isRequester ? true : transaction.requesterDone;
    const newOffererDone = isOfferer ? true : transaction.offererDone;

    // Both marked complete
    if (newRequesterDone && newOffererDone) {
      updateData.status = 'SUCCESSFUL';
      updateData.completedAt = new Date();

      // Also update post status
      await prisma.post.update({
        where: { id: transaction.postId },
        data: { status: 'SUCCESSFUL' },
      });

      // Update reputation for both users
      await userRepository.updateReputation(transaction.requesterId);
      await userRepository.updateReputation(transaction.offererId);

      // Notify both users
      const otherUserId = isRequester ? transaction.offererId : transaction.requesterId;
      await notificationRepository.create({
        userId: otherUserId,
        type: 'TRANSACTION_COMPLETE',
        title: 'Exchange Complete!',
        message: 'The exchange has been marked as successful. Please leave a rating.',
        data: JSON.stringify({ transactionId }),
      });
    } else {
      // Notify the other party
      const otherUserId = isRequester ? transaction.offererId : transaction.requesterId;
      await notificationRepository.create({
        userId: otherUserId,
        type: 'TRANSACTION_COMPLETE',
        title: 'Partner Marked Complete',
        message: 'Your exchange partner has marked their side as complete.',
        data: JSON.stringify({ transactionId }),
      });
    }

    return transactionRepository.update(transactionId, updateData);
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

    await prisma.$transaction(async (tx) => {
      const updateData: any = { cancelledAt: new Date() };
      if (isRequester) updateData.requesterCancel = true;
      if (isOfferer) updateData.offererCancel = true;
      updateData.status = 'CANCELLED';

      await tx.transaction.update({ where: { id: transactionId }, data: updateData });
      await tx.post.update({
        where: { id: transaction.postId },
        data: { status: 'CANCELLED' },
      });
    });

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

    await prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      await tx.post.update({
        where: { id: transaction.postId },
        data: { status: 'CANCELLED' },
      });
    });

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
