import { Router } from 'express';
import { reportController } from '../controllers/reportController';
import { notificationController } from '../controllers/notificationController';
import { authenticateUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createReportSchema } from '../utils/validators';

const router = Router();

// Reports
router.post('/reports', authenticateUser, validate(createReportSchema), (req, res, next) => reportController.create(req, res, next));

// Notifications
router.get('/notifications', authenticateUser, (req, res, next) => notificationController.getMyNotifications(req, res, next));
router.patch('/notifications/:id/read', authenticateUser, (req, res, next) => notificationController.markAsRead(req, res, next));
router.patch('/notifications/read-all', authenticateUser, (req, res, next) => notificationController.markAllAsRead(req, res, next));

export default router;
