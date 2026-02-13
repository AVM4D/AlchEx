import { Router } from 'express';
import { offerController } from '../controllers/offerController';
import { authenticateUser } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createOfferSchema, updateOfferSchema } from '../utils/validators';

const router = Router();

router.post('/', authenticateUser, validate(createOfferSchema), (req, res, next) => offerController.create(req, res, next));
router.put('/:id', authenticateUser, validate(updateOfferSchema), (req, res, next) => offerController.update(req, res, next));
router.post('/:id/accept', authenticateUser, (req, res, next) => offerController.accept(req, res, next));
router.post('/:id/withdraw', authenticateUser, (req, res, next) => offerController.withdraw(req, res, next));
router.get('/post/:postId', authenticateUser, (req, res, next) => offerController.getByPost(req, res, next));
router.get('/my', authenticateUser, (req, res, next) => offerController.getMyOffers(req, res, next));

export default router;
