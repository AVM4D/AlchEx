import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transactionService';
import { successResponse } from '../utils/helpers';

export class TransactionController {
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.getById(req.params.id, req.user!.userId);
      res.json(successResponse(tx));
    } catch (error) {
      next(error);
    }
  }

  async markComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.markComplete(req.params.id, req.user!.userId);
      res.json(successResponse(tx, 'Marked as complete'));
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.cancel(req.params.id, req.user!.userId);
      res.json(successResponse(tx, 'Transaction cancelled'));
    } catch (error) {
      next(error);
    }
  }

  async getMyTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await transactionService.getByUser(req.user!.userId, page, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
