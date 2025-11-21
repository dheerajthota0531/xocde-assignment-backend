import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import * as authService from '../services/authService.js';

// Debug: Check if env vars are loaded
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Only configure Google OAuth if credentials are provided and not placeholders
const hasValidOAuthConfig = 
  clientID && 
  clientSecret &&
  clientID.trim() !== '' &&
  clientSecret.trim() !== '' &&
  !clientID.includes('your-google-client-id') &&
  !clientSecret.includes('your-google-client-secret');

if (hasValidOAuthConfig) {
  // Configure Google OAuth Strategy
  passport.use(
    'google',
    new GoogleStrategy(
      {
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/v1/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Use service to get or create user
          const user = await authService.getOrCreateUser(profile);
          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth configured');
} else {
  console.warn('⚠️  Google OAuth not configured.');
  if (!clientID) console.warn('   - Missing GOOGLE_CLIENT_ID');
  if (!clientSecret) console.warn('   - Missing GOOGLE_CLIENT_SECRET');
  if (clientID && clientID.includes('your-google-client-id')) console.warn('   - GOOGLE_CLIENT_ID is a placeholder');
  if (clientSecret && clientSecret.includes('your-google-client-secret')) console.warn('   - GOOGLE_CLIENT_SECRET is a placeholder');
  console.warn('⚠️  Authentication will not work until Google OAuth is configured');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await authService.getUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
