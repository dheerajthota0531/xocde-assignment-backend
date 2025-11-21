import * as authService from '../services/authService.js';
import { getAuthUrl, verifyToken } from '../utils/googleOAuth.js';

// @desc    Initiate Google OAuth
// @route   GET /api/v1/auth/google
// @access  Public
export const initiateGoogleAuth = async (req, res, next) => {
  try {
    // Check if credentials are configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env',
      });
    }

    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google auth:', error);
    next(error);
  }
};

// @desc    Google OAuth callback
// @route   GET /api/v1/auth/google/callback
// @access  Public
export const googleCallback = async (req, res, next) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
    }

    // Verify token and get user info
    const googleProfile = await verifyToken(code);

    // Get or create user
    const user = await authService.getOrCreateUser(googleProfile);

    // Generate JWT token
    const token = authService.generateUserToken(user._id);

    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  } catch (error) {
    console.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
export const logout = async (req, res, next) => {
  try {
    await authService.updateUserOnlineStatus(req.user._id, false);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};
