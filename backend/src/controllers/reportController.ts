import { Request, Response, NextFunction } from 'express';
import { reportRepository } from '../repositories/reportRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { successResponse } from '../utils/helpers';

export class ReportController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, targetUserId, reason, description } = req.body;
      const report = await reportRepository.create({
        transaction: { connect: { id: transactionId } },
        reporter: { connect: { id: req.user!.userId } },
        targetUser: { connect: { id: targetUserId } },
        reason,
        description,
      });
      res.status(201).json(successResponse(report, 'Report submitted'));
    } catch (error) {
      next(error);
    }
  }
}

export const reportController = new ReportController();
