import { Request, Response, NextFunction } from 'express';
import { ratingService } from '../services/ratingService';
import { successResponse } from '../utils/helpers';
import { param } from '../utils/params';

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

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const rating = await ratingService.getById(param(req, 'id'));
      res.json(successResponse(rating));
    } catch (error) {
      next(error);
    }
  }

  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await ratingService.getByUser(param(req, 'id'), page, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { score, review } = req.body;
      const rating = await ratingService.update(param(req, 'id'), req.user!.userId, { score, review });
      res.json(successResponse(rating, 'Rating updated'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ratingService.delete(param(req, 'id'), req.user!.userId);
      res.json(successResponse(result, 'Rating deleted'));
    } catch (error) {
      next(error);
    }
  }
}

export const ratingController = new RatingController();
