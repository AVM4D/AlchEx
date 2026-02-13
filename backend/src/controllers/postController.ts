import { Request, Response, NextFunction } from 'express';
import { postService } from '../services/postService';
import { successResponse } from '../utils/helpers';
import { param } from '../utils/params';

export class PostController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.create(req.user!.userId, req.body);
      res.status(201).json(successResponse(post, 'Post created successfully'));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.getById(param(req, 'id'));
      res.json(successResponse(post));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const post = await postService.update(param(req, 'id'), req.user!.userId, req.body);
      res.json(successResponse(post, 'Post updated'));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const isAdmin = req.user!.role === 'ADMIN';
      await postService.delete(param(req, 'id'), req.user!.userId, isAdmin);
      res.json(successResponse(null, 'Post deleted'));
    } catch (error) {
      next(error);
    }
  }

  async getMarketplace(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const result = await postService.getMarketplace(req.query as any, userId);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getMyPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await postService.getByUser(req.user!.userId, page, limit);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await postService.getCategories();
      res.json(successResponse(categories));
    } catch (error) {
      next(error);
    }
  }
}

export const postController = new PostController();
