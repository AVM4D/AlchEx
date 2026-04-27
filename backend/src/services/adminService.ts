import { reportRepository } from '../repositories/reportRepository';
import { userRepository } from '../repositories/userRepository';
import { transactionRepository } from '../repositories/transactionRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { transactionService } from './transactionService';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { paginate, paginationMeta } from '../utils/helpers';
import db from '../db/connection';

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

    // Call stored procedure — atomically bans user + sends notification
    try {
      await db.callProcedure('sp_BanUser', { userId, reason });
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to ban user');
    }

    return { message: 'User banned successfully' };
  }

  async unbanUser(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    // Call stored procedure — atomically unbans user + sends notification
    try {
      await db.callProcedure('sp_UnbanUser', { userId });
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to unban user');
    }

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

    // Call stored procedure — resolves report + sends notification
    try {
      await db.callProcedure('sp_ResolveReport', {
        reportId,
        status,
        adminNotes: adminNotes ?? null,
      });
    } catch (err: any) {
      throw new BadRequestError(err.message || 'Failed to resolve report');
    }

    return { message: `Report ${status.toLowerCase()} successfully` };
  }

  // ─── Transaction Management ───
  async forceCancel(transactionId: string) {
    return transactionService.forceCancel(transactionId);
  }

  async getAllTransactions(page: number = 1, limit: number = 20, status?: string) {
    return transactionService.getAll(page, limit, status);
  }

  // ─── Report Management (Delete) ───
  async deleteReport(reportId: string) {
    const report = await reportRepository.findById(reportId);
    if (!report) throw new NotFoundError('Report not found');
    await reportRepository.softDelete(reportId);
    return { message: 'Report deleted successfully' };
  }

  // ─── Dashboard Stats (via Stored Procedure) ───
  async getDashboardStats() {
    try {
      const result = await db.callProcedure('sp_GetDashboardStats');
      const r = result.recordset[0];
      return {
        totalUsers: Number(r.totalUsers),
        totalPosts: Number(r.totalPosts),
        totalTransactions: Number(r.totalTransactions),
        activeTransactions: Number(r.activeTransactions),
        successfulTransactions: Number(r.successfulTransactions),
        pendingReports: Number(r.pendingReports),
      };
    } catch {
      // Fallback to inline SQL if SP not yet deployed
      const result: any[] = await db.query`
        SELECT
          (SELECT COUNT(*) FROM users WHERE isDeleted = 0) AS totalUsers,
          (SELECT COUNT(*) FROM posts WHERE isDeleted = 0) AS totalPosts,
          (SELECT COUNT(*) FROM transactions WHERE isDeleted = 0) AS totalTransactions,
          (SELECT COUNT(*) FROM transactions WHERE status = 'IN_PROGRESS') AS activeTransactions,
          (SELECT COUNT(*) FROM transactions WHERE status = 'SUCCESSFUL') AS successfulTransactions,
          (SELECT COUNT(*) FROM reports WHERE status = 'PENDING') AS pendingReports
      `;
      const r = result[0];
      return {
        totalUsers: Number(r.totalUsers),
        totalPosts: Number(r.totalPosts),
        totalTransactions: Number(r.totalTransactions),
        activeTransactions: Number(r.activeTransactions),
        successfulTransactions: Number(r.successfulTransactions),
        pendingReports: Number(r.pendingReports),
      };
    }
  }
}

export const adminService = new AdminService();
