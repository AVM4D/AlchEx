import { messageRepository } from '../repositories/messageRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';

export class ChatService {
  async sendMessage(senderId: string, transactionId: string, content: string) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) throw new NotFoundError('Transaction not found');

    if (transaction.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Chat is disabled for cancelled or completed transactions');
    }

    if (transaction.requesterId !== senderId && transaction.offererId !== senderId) {
      throw new ForbiddenError('Not part of this transaction');
    }

    return messageRepository.create({
      transaction: { connect: { id: transactionId } },
      sender: { connect: { id: senderId } },
      content,
    });
  }

  async getMessages(userId: string, transactionId: string, page: number = 1, limit: number = 50) {
    const transaction = await transactionRepository.findById(transactionId);
    if (!transaction) throw new NotFoundError('Transaction not found');

    if (transaction.requesterId !== userId && transaction.offererId !== userId) {
      throw new ForbiddenError('Not part of this transaction');
    }

    const skip = (page - 1) * limit;
    const result = await messageRepository.findByTransaction(transactionId, skip, limit);

    // Mark messages as read
    await messageRepository.markAsRead(transactionId, userId);

    return result;
  }

  async getUnreadCount(userId: string) {
    return messageRepository.getUnreadCount(userId);
  }
}

export const chatService = new ChatService();
