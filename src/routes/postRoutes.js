import express from 'express';
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validatePost } from '../middleware/validator.js';
import upload from '../utils/upload.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Create post - route -> validation -> middleware (already applied) -> controller
router.post(
  '/',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  validatePost,
  createPost
);

// Get all posts - route -> middleware -> controller
router.get('/', getPosts);

// Get single post - route -> middleware -> controller
router.get('/:id', getPost);

// Update post - route -> validation -> middleware -> controller
router.put(
  '/:id',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  validatePost,
  updatePost
);

// Delete post - route -> middleware -> controller
router.delete('/:id', deletePost);

export default router;
