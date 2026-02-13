import { Router } from 'express';
import { postController } from '../controllers/postController';
import { authenticateUser, optionalAuth } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createPostSchema, updatePostSchema, marketplaceQuerySchema } from '../utils/validators';

const router = Router();

router.get('/categories', (req, res, next) => postController.getCategories(req, res, next));
router.get('/marketplace', optionalAuth, validate(marketplaceQuerySchema, 'query'), (req, res, next) => postController.getMarketplace(req, res, next));
router.get('/my', authenticateUser, (req, res, next) => postController.getMyPosts(req, res, next));
router.get('/:id', (req, res, next) => postController.getById(req, res, next));
router.post('/', authenticateUser, validate(createPostSchema), (req, res, next) => postController.create(req, res, next));
router.put('/:id', authenticateUser, validate(updatePostSchema), (req, res, next) => postController.update(req, res, next));
router.delete('/:id', authenticateUser, (req, res, next) => postController.delete(req, res, next));

export default router;
