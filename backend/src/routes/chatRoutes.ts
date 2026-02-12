import { Router } from 'express';
import { chatController } from '../controllers/chatController';
import { authenticateUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { sendMessageSchema } from '../utils/validators';

const router = Router();

router.get('/unread', authenticateUser, (req, res, next) => chatController.getUnreadCount(req, res, next));
router.get('/:transactionId', authenticateUser, (req, res, next) => chatController.getMessages(req, res, next));
router.post('/', authenticateUser, validate(sendMessageSchema), (req, res, next) => chatController.sendMessage(req, res, next));

export default router;
