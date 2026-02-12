import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authenticateUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../utils/validators';

const router = Router();

router.post('/register', validate(registerSchema), (req, res, next) => authController.register(req, res, next));
router.post('/login', validate(loginSchema), (req, res, next) => authController.login(req, res, next));
router.post('/refresh', (req, res, next) => authController.refresh(req, res, next));
router.post('/logout', authenticateUser, (req, res, next) => authController.logout(req, res, next));
router.get('/me', authenticateUser, (req, res, next) => authController.me(req, res, next));

export default router;
