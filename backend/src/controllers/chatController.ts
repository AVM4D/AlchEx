import { Request, Response, NextFunction } from 'express';
import { chatService } from '../services/chatService';
import { successResponse } from '../utils/helpers';

export class ChatController {
  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const result = await chatService.getMessages(
        req.user!.userId, req.params.transactionId, page, limit
      );
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const message = await chatService.sendMessage(
        req.user!.userId, req.body.transactionId, req.body.content
      );
      res.status(201).json(successResponse(message, 'Message sent'));
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const count = await chatService.getUnreadCount(req.user!.userId);
      res.json(successResponse({ count }));
    } catch (error) {
      next(error);
    }
  }
}

export const chatController = new ChatController();
