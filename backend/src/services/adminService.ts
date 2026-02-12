import { reportRepository } from '../repositories/reportRepository';
import { userRepository } from '../repositories/userRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { transactionService } from './transactionService';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { paginate, paginationMeta } from '../utils/helpers';

export class AdminService {
  // ─── User Management ───
  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const { skip, take } = paginate(page, limit);
    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }
    const { users, total } = await userRepository.findAll({ skip, take, where });
    return { users, pagination: paginationMeta(total, page, limit) };
  }

  async banUser(userId: string, reason: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    if (user.role === 'ADMIN') throw new ForbiddenError('Cannot ban an admin');

    await userRepository.update(userId, { isBanned: true, banReason: reason });

    await notificationRepository.create({
      userId,
      type: 'SYSTEM',
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}`,
    });

    return { message: 'User banned successfully' };
  }

  async unbanUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    await userRepository.update(userId, { isBanned: false, banReason: null });

    await notificationRepository.create({
      userId,
      type: 'SYSTEM',
      title: 'Account Reinstated',
      message: 'Your account has been reinstated.',
    });

    return { message: 'User unbanned successfully' };
  }

  // ─── Report Management ───
  async getReports(page: number = 1, limit: number = 20, status?: string) {
    const { skip, take } = paginate(page, limit);
    const where: any = {};
    if (status) where.status = status;
    const { reports, total } = await reportRepository.findAll({ skip, take, where });
    return { reports, pagination: paginationMeta(total, page, limit) };
  }

  async resolveReport(reportId: string, status: 'RESOLVED' | 'DISMISSED', adminNotes?: string) {
    const report = await reportRepository.findById(reportId);
    if (!report) throw new NotFoundError('Report not found');

    await reportRepository.update(reportId, {
      status,
      adminNotes,
      resolvedAt: new Date(),
    });

    await notificationRepository.create({
      userId: report.reporterId,
      type: 'REPORT_UPDATE',
      title: 'Report Updated',
      message: `Your report has been ${status.toLowerCase()}.`,
      data: JSON.stringify({ reportId }),
    });

    return { message: `Report ${status.toLowerCase()} successfully` };
  }

  // ─── Transaction Management ───
  async forceCancel(transactionId: string) {
    return transactionService.forceCancel(transactionId);
  }

  // ─── Dashboard Stats ───
  async getDashboardStats() {
    const [
      totalUsers, totalPosts, totalTransactions,
      activeTransactions, successfulTransactions,
      pendingReports,
    ] = await Promise.all([
      (await import('../prisma/client')).default.user.count({ where: { isDeleted: false } }),
      (await import('../prisma/client')).default.post.count({ where: { isDeleted: false } }),
      (await import('../prisma/client')).default.transaction.count({ where: { isDeleted: false } }),
      (await import('../prisma/client')).default.transaction.count({ where: { status: 'IN_PROGRESS' } }),
      (await import('../prisma/client')).default.transaction.count({ where: { status: 'SUCCESSFUL' } }),
      (await import('../prisma/client')).default.report.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalTransactions,
      activeTransactions,
      successfulTransactions,
      pendingReports,
    };
  }
}

export const adminService = new AdminService();
