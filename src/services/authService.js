import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User object
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

/**
 * Get or create user from Google profile
 * @param {Object} googleProfile - Google OAuth profile (from verifyToken)
 * @returns {Promise<Object>} User object
 */
export const getOrCreateUser = async (googleProfile) => {
  // Check if user exists with Google ID
  let user = await User.findOne({ googleId: googleProfile.googleId });

  if (user) {
    return user;
  }

  // Check if user exists with same email
  user = await User.findOne({ email: googleProfile.email });

  if (user) {
    // Link Google account to existing user
    user.googleId = googleProfile.googleId;
    if (!user.profilePhoto && googleProfile.profilePhoto) {
      user.profilePhoto = googleProfile.profilePhoto;
    }
    await user.save();
    return user;
  }

  // Create new user
  user = await User.create({
    googleId: googleProfile.googleId,
    name: googleProfile.name,
    email: googleProfile.email,
    profilePhoto: googleProfile.profilePhoto || '',
  });

  return user;
};

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @returns {string} JWT token
 */
export const generateUserToken = (userId) => {
  return generateToken(userId);
};

/**
 * Update user online status
 * @param {string} userId - User ID
 * @param {boolean} isOnline - Online status
 * @returns {Promise<Object>} Updated user
 */
export const updateUserOnlineStatus = async (userId, isOnline) => {
  const updateData = { isOnline };
  if (!isOnline) {
    updateData.lastSeen = new Date();
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).select('-password');

  return user;
};

