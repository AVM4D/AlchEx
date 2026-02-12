import { Router } from 'express';
import authRoutes from './authRoutes';
import postRoutes from './postRoutes';
import offerRoutes from './offerRoutes';
import transactionRoutes from './transactionRoutes';
import chatRoutes from './chatRoutes';
import userRoutes from './userRoutes';
import miscRoutes from './miscRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/posts', postRoutes);
router.use('/offers', offerRoutes);
router.use('/transactions', transactionRoutes);
router.use('/chat', chatRoutes);
router.use('/users', userRoutes);
router.use('/', miscRoutes);
router.use('/admin', adminRoutes);

export default router;
