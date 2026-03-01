import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticateUser, authorizeAdmin } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { banUserSchema, resolveReportSchema } from '../utils/validators';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticateUser, authorizeAdmin);

router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/users', (req, res, next) => adminController.getUsers(req, res, next));
router.post('/users/ban', validate(banUserSchema), (req, res, next) => adminController.banUser(req, res, next));
router.post('/users/:id/unban', (req, res, next) => adminController.unbanUser(req, res, next));
router.get('/reports', (req, res, next) => adminController.getReports(req, res, next));
router.post('/reports/resolve', validate(resolveReportSchema), (req, res, next) => adminController.resolveReport(req, res, next));
router.delete('/reports/:id', (req, res, next) => adminController.deleteReport(req, res, next));
router.get('/transactions', (req, res, next) => adminController.getAllTransactions(req, res, next));
router.post('/transactions/:id/force-cancel', (req, res, next) => adminController.forceCancel(req, res, next));

export default router;
