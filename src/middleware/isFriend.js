import User from '../models/User.js';

// Check if two users are friends
export const isFriend = async (req, res, next) => {
  try {
    const { userId } = req.params; // The other user's ID
    const currentUser = req.user; // Current authenticated user

    // Check if users are friends
    const user = await User.findById(currentUser._id);
    const isFriends = user.friends.includes(userId);

    if (!isFriends) {
      return res.status(403).json({
        success: false,
        error: 'You can only chat with friends',
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

