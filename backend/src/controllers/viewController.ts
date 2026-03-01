import { Request, Response, NextFunction } from 'express';
import { viewRepository } from '../repositories/viewRepository';
import { successResponse } from '../utils/helpers';
import { param } from '../utils/params';

// ─────────────────────────────────────────────────────────
// Controller for endpoints that use $queryRaw SQL views
// ─────────────────────────────────────────────────────────

export class ViewController {

  // GET /api/views/leaderboard?limit=10
  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await viewRepository.getLeaderboard(limit);
      res.json(successResponse(data, 'Leaderboard fetched'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/marketplace?category=TUTORING&page=1&limit=20
  async getMarketplace(req: Request, res: Response, next: NextFunction) {
    try {
      const category = req.query.category as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const data = await viewRepository.getActivePostsByCategory(category, offset, limit);
      res.json(successResponse(data, 'Marketplace posts fetched'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/search?q=programming
  async searchPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const keyword = req.query.q as string || '';
      const data = await viewRepository.searchPosts(keyword);
      res.json(successResponse(data, 'Search results'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/top-rated?limit=10
  async getTopRatedUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await viewRepository.getTopRatedUsers(limit);
      res.json(successResponse(data, 'Top rated users'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/categories
  async getPopularCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getPopularCategories();
      res.json(successResponse(data, 'Popular categories'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/user/:id/rating-stats
  async getUserRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getUserRatingStats(param(req, 'id'));
      res.json(successResponse(data, 'User rating stats'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/user/:id/profile-stats
  async getUserProfileStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getUserProfileStats(param(req, 'id'));
      res.json(successResponse(data, 'User profile stats'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/user/:id/exchange-history
  async getUserExchangeHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getUserExchangeHistory(param(req, 'id'));
      res.json(successResponse(data, 'User exchange history'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/user/:id/conversations
  async getUserConversations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getUserConversations(param(req, 'id'));
      res.json(successResponse(data, 'User conversations'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/user/:id/pending-offers
  async getPendingOffersPerPost(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getPendingOffersPerPost(param(req, 'id'));
      res.json(successResponse(data, 'Pending offers per post'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/recent-exchanges?limit=10
  async getRecentCompletedExchanges(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const data = await viewRepository.getRecentCompletedExchanges(limit);
      res.json(successResponse(data, 'Recent completed exchanges'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/expiring-posts
  async getExpiringPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getExpiringPosts();
      res.json(successResponse(data, 'Expiring posts'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/transaction/:id/summary
  async getTransactionSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getTransactionSummary(param(req, 'id'));
      res.json(successResponse(data, 'Transaction summary'));
    } catch (error) {
      next(error);
    }
  }

  // ──── Admin-level raw SQL view endpoints ────

  // GET /api/views/admin/dashboard
  async getAdminDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getAdminDashboard();
      res.json(successResponse(data, 'Admin dashboard stats'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/admin/pending-reports
  async getPendingReports(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getPendingReports();
      res.json(successResponse(data, 'Pending reports'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/admin/post-distribution
  async getPostStatusDistribution(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getPostStatusDistribution();
      res.json(successResponse(data, 'Post status distribution'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/admin/completion-rate
  async getTransactionCompletionRate(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getTransactionCompletionRate();
      res.json(successResponse(data, 'Transaction completion rate'));
    } catch (error) {
      next(error);
    }
  }

  // GET /api/views/admin/monthly-activity
  async getMonthlyActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await viewRepository.getMonthlyActivity();
      res.json(successResponse(data, 'Monthly activity'));
    } catch (error) {
      next(error);
    }
  }
}

export const viewController = new ViewController();
