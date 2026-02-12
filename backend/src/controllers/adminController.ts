import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/adminService';
import { successResponse } from '../utils/helpers';

export class AdminController {
  async getDashboard(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();
      res.json(successResponse(stats));
    } catch (error) {
      next(error);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string;
      const result = await adminService.getAllUsers(page, limit, search);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async banUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.banUser(req.body.userId, req.body.reason);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.unbanUser(req.params.id);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const result = await adminService.getReports(page, limit, status);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async resolveReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { reportId, status, adminNotes } = req.body;
      const result = await adminService.resolveReport(reportId, status, adminNotes);
      res.json(successResponse(result));
    } catch (error) {
      next(error);
    }
  }

  async forceCancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.forceCancel(req.params.id);
      res.json(successResponse(result, 'Transaction force-cancelled'));
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
