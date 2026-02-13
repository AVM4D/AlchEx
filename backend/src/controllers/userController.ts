import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { ratingService } from '../services/ratingService';
import { successResponse } from '../utils/helpers';
import { param } from '../utils/params';

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getProfile(req.user!.userId);
      res.json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.updateProfile(req.user!.userId, req.body);
      res.json(successResponse(profile, 'Profile updated'));
    } catch (error) {
      next(error);
    }
  }

  async getPublicProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.getPublicProfile(param(req, 'id'));
      res.json(successResponse(profile));
    } catch (error) {
      next(error);
    }
  }

  async getRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await ratingService.getStats(param(req, 'id'));
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'ALL_TIME';
      const limit = parseInt(req.query.limit as string) || 50;
      const leaderboard = await userService.getLeaderboard(period, limit);
      res.json(successResponse(leaderboard));
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
