import { Request, Response, NextFunction } from 'express';
import { offerService } from '../services/offerService';
import { successResponse } from '../utils/helpers';
import { param } from '../utils/params';

export class OfferController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId, proposalDescription, counterExchange } = req.body;
      const offer = await offerService.create(
        req.user!.userId, postId, proposalDescription, counterExchange
      );
      res.status(201).json(successResponse(offer, 'Offer submitted'));
    } catch (error) {
      next(error);
    }
  }

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const transaction = await offerService.accept(param(req, 'id'), req.user!.userId);
      res.json(successResponse(transaction, 'Offer accepted. Transaction started.'));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const offer = await offerService.update(param(req, 'id'), req.user!.userId, req.body);
      res.json(successResponse(offer, 'Offer updated'));
    } catch (error) {
      next(error);
    }
  }

  async withdraw(req: Request, res: Response, next: NextFunction) {
    try {
      await offerService.withdraw(param(req, 'id'), req.user!.userId);
      res.json(successResponse(null, 'Offer withdrawn'));
    } catch (error) {
      next(error);
    }
  }

  async getByPost(req: Request, res: Response, next: NextFunction) {
    try {
      const offers = await offerService.getByPost(param(req, 'postId'));
      res.json(successResponse(offers));
    } catch (error) {
      next(error);
    }
  }

  async getMyOffers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await offerService.getByUser(req.user!.userId, page, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }
}

export const offerController = new OfferController();
