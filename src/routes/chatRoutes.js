import express from 'express';
import {
  sendMessage,
  getMessages,
  getConversations,
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateMessage } from '../middleware/validator.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Send message - route -> validation -> middleware -> controller
router.post('/message', validateMessage, sendMessage);

// Get messages with a user - route -> middleware -> controller
router.get('/messages/:userId', getMessages);

// Get all conversations - route -> middleware -> controller
router.get('/conversations', getConversations);

export default router;
