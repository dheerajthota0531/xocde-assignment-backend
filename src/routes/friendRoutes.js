import express from 'express';
import {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests,
  getAllFriendRequests,
  getFriends,
  checkFriendship,
} from '../controllers/friendController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication - route -> middleware -> controller
router.use(protect);

// Send friend request
router.post('/request/:userId', sendFriendRequest);

// Accept friend request
router.put('/accept/:requestId', acceptFriendRequest);

// Reject friend request
router.put('/reject/:requestId', rejectFriendRequest);

// Get friend requests (received)
router.get('/requests', getFriendRequests);

// Get all friend requests (sent and received, all statuses)
router.get('/requests/all', getAllFriendRequests);

// Get friends list
router.get('/', getFriends);

// Check if users are friends
router.get('/check/:userId', checkFriendship);

export default router;
