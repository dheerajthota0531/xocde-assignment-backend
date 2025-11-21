import express from 'express';
import {
  initiateGoogleAuth,
  googleCallback,
  getMe,
  logout,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Google OAuth routes (public routes)
router.get('/google', initiateGoogleAuth);
router.get('/google/callback', googleCallback);

// Get current user - route -> middleware -> controller
router.get('/me', protect, getMe);

// Logout - route -> middleware -> controller
router.post('/logout', protect, logout);

export default router;
