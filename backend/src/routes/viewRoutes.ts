import { Router } from 'express';
import { viewController } from '../controllers/viewController';
import { authenticateUser, authorizeAdmin } from '../middlewares/auth';

const router = Router();

// ─── Public view-based endpoints (using $queryRaw) ───
router.get('/leaderboard', (req, res, next) => viewController.getLeaderboard(req, res, next));
router.get('/marketplace', (req, res, next) => viewController.getMarketplace(req, res, next));
router.get('/search', (req, res, next) => viewController.searchPosts(req, res, next));
router.get('/top-rated', (req, res, next) => viewController.getTopRatedUsers(req, res, next));
router.get('/categories', (req, res, next) => viewController.getPopularCategories(req, res, next));
router.get('/recent-exchanges', (req, res, next) => viewController.getRecentCompletedExchanges(req, res, next));
router.get('/expiring-posts', (req, res, next) => viewController.getExpiringPosts(req, res, next));

// ─── User-specific view endpoints (authenticated) ───
router.get('/user/:id/rating-stats', (req, res, next) => viewController.getUserRatingStats(req, res, next));
router.get('/user/:id/profile-stats', (req, res, next) => viewController.getUserProfileStats(req, res, next));
router.get('/user/:id/exchange-history', authenticateUser, (req, res, next) => viewController.getUserExchangeHistory(req, res, next));
router.get('/user/:id/conversations', authenticateUser, (req, res, next) => viewController.getUserConversations(req, res, next));
router.get('/user/:id/pending-offers', authenticateUser, (req, res, next) => viewController.getPendingOffersPerPost(req, res, next));

// ─── Transaction view endpoint ───
router.get('/transaction/:id/summary', authenticateUser, (req, res, next) => viewController.getTransactionSummary(req, res, next));

// ─── Admin view-based endpoints (using $queryRaw on SQL views) ───
router.get('/admin/dashboard', authenticateUser, authorizeAdmin, (req, res, next) => viewController.getAdminDashboard(req, res, next));
router.get('/admin/pending-reports', authenticateUser, authorizeAdmin, (req, res, next) => viewController.getPendingReports(req, res, next));
router.get('/admin/post-distribution', authenticateUser, authorizeAdmin, (req, res, next) => viewController.getPostStatusDistribution(req, res, next));
router.get('/admin/completion-rate', authenticateUser, authorizeAdmin, (req, res, next) => viewController.getTransactionCompletionRate(req, res, next));
router.get('/admin/monthly-activity', authenticateUser, authorizeAdmin, (req, res, next) => viewController.getMonthlyActivity(req, res, next));

export default router;
