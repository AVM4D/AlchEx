import { Router } from 'express';
import { userController } from '../controllers/userController';
import { ratingController } from '../controllers/ratingController';
import { authenticateUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { updateProfileSchema, createRatingSchema } from '../utils/validators';

const router = Router();

router.get('/profile', authenticateUser, (req, res, next) => userController.getProfile(req, res, next));
router.put('/profile', authenticateUser, validate(updateProfileSchema), (req, res, next) => userController.updateProfile(req, res, next));
router.get('/leaderboard', (req, res, next) => userController.getLeaderboard(req, res, next));
router.get('/:id', (req, res, next) => userController.getPublicProfile(req, res, next));
router.get('/:id/ratings', (req, res, next) => ratingController.getByUser(req, res, next));
router.get('/:id/rating-stats', (req, res, next) => userController.getRatingStats(req, res, next));
router.post('/ratings', authenticateUser, validate(createRatingSchema), (req, res, next) => ratingController.create(req, res, next));

export default router;
