import { Request, Response, NextFunction } from 'express';
import { ratingService } from '../services/ratingService';
import { successResponse } from '../utils/helpers';

export class RatingController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { transactionId, score, review } = req.body;
      const rating = await ratingService.create(req.user!.userId, transactionId, score, review);
      res.status(201).json(successResponse(rating, 'Rating submitted'));
    } catch (error) {
      next(error);
    }
  }

  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await ratingService.getByUser(req.params.userId, page, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export const ratingController = new RatingController();
