import { OAuth2Client } from 'google-auth-library';

// Lazy initialization - create client when needed
let client = null;

/**
 * Get or create OAuth2 client
 * @returns {OAuth2Client}
 */
const getClient = () => {
  if (!client) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
    const callbackURL = (process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/v1/auth/google/callback').trim();

    if (!clientId || !clientSecret) {
      console.error('❌ Google OAuth configuration error:');
      console.error('   GOOGLE_CLIENT_ID:', clientId ? 'EXISTS' : 'MISSING');
      console.error('   GOOGLE_CLIENT_SECRET:', clientSecret ? 'EXISTS' : 'MISSING');
      throw new Error('Google OAuth not configured. Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
    }

    if (clientId.includes('your-google-client-id') || clientSecret.includes('your-google-client-secret')) {
      throw new Error('Google OAuth credentials are placeholders. Please set real values in .env');
    }

    client = new OAuth2Client(clientId, clientSecret, callbackURL);
    console.log('✅ Google OAuth client initialized');
  }
  return client;
};

/**
 * Get Google OAuth authorization URL
 * @returns {string} Authorization URL
 */
export const getAuthUrl = () => {
  const oauthClient = getClient();
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });
};

/**
 * Verify Google OAuth token and get user info
 * @param {string} code - Authorization code from Google
 * @returns {Promise<Object>} User profile information
 */
export const verifyToken = async (code) => {
  try {
    const oauthClient = getClient();
    
    // Exchange code for tokens
    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    // Get user info
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    return {
      googleId: payload.sub,
      name: payload.name,
      email: payload.email,
      profilePhoto: payload.picture,
    };
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error(`Failed to verify Google token: ${error.message}`);
  }
};

export default getClient;

