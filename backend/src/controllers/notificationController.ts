import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notificationRepository';
import { successResponse } from '../utils/helpers';
import { param } from '../utils/params';

export class NotificationController {
  async getMyNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;
      const result = await notificationRepository.findByUser(req.user!.userId, skip, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markAsRead(param(req, 'id'), req.user!.userId);
      res.json(successResponse(null, 'Marked as read'));
    } catch (error) {
      next(error);
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepository.markAllAsRead(req.user!.userId);
      res.json(successResponse(null, 'All marked as read'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await notificationRepository.delete(param(req, 'id'), req.user!.userId);
      res.json(successResponse(null, 'Notification deleted'));
    } catch (error) {
      next(error);
    }
  }
}

export const notificationController = new NotificationController();
