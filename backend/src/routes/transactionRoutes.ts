import { Router } from 'express';
import { transactionController } from '../controllers/transactionController';
import { authenticateUser } from '../middlewares/auth';

const router = Router();

router.get('/my', authenticateUser, (req, res, next) => transactionController.getMyTransactions(req, res, next));
router.get('/:id', authenticateUser, (req, res, next) => transactionController.getById(req, res, next));
router.post('/:id/complete', authenticateUser, (req, res, next) => transactionController.markComplete(req, res, next));
router.post('/:id/cancel', authenticateUser, (req, res, next) => transactionController.cancel(req, res, next));

export default router;
