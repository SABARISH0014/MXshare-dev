import { google } from 'googleapis';
import { User } from '../models/User.js';
import { 
  signAccessToken, generateRefreshTokenString, addRefreshTokenToUser, 
  verifyRefreshTokenHash, rotateRefreshToken, removeRefreshTokenHash 
} from '../utils/tokenService.js';
import { oAuth2ClientForCodeExchange } from '../utils/googleClient.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const REDIRECT_URL = process.env.REDIRECT_URL || `${FRONTEND_URL}/auth/google/callback`;

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-refreshTokens -googleRefreshToken -accessToken -password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ authenticated: true, user });
  } catch (err) {
    console.error('Auth/me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const googleCallback = async (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ message: 'Auth code not provided.' });

  try {
    const tempClient = oAuth2ClientForCodeExchange(REDIRECT_URL);
    const { tokens } = await tempClient.getToken({ code, redirect_uri: REDIRECT_URL });
    tempClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: tempClient, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data || !data.email) return res.status(400).json({ message: 'Failed to fetch Google user data.' });

    let user = await User.findOne({ $or: [{ googleId: data.id }, { email: data.email }] });

    if (!user) {
      user = new User({
        name: data.name,
        email: data.email,
        googleId: data.id,
        isOAuth: true,
        accessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null
      });
    } else {
      user.name = data.name || user.name;
      user.googleId = data.id;
      user.isOAuth = true;
      if (tokens.access_token) user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
    }

    await user.save();

    const accessToken = signAccessToken(user);
    const appRefreshToken = generateRefreshTokenString();
    await addRefreshTokenToUser(user._id, appRefreshToken);

    return res.status(200).json({
      message: "Login Successful",
      user: { _id: user._id, name: user.name, email: user.email, googleId: user.googleId },
      accessToken,
      refreshToken: appRefreshToken,
      googleAccessToken: tokens.access_token || null,
      googleRefreshToken: tokens.refresh_token || user.googleRefreshToken || null
    });
  } catch (err) {
    console.error('Google callback error:', err);
    return res.status(500).json({ message: 'Authentication failed.', detail: err.message });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ message: 'Missing refresh token' });

  try {
    const candidateUsers = await User.find({ 'refreshTokens.0': { $exists: true } });
    let foundUser = null;
    let matchingTokenHash = null;
    
    for (const u of candidateUsers) {
      for (const rt of u.refreshTokens) {
        if (rt.expiresAt && rt.expiresAt < new Date()) continue;
        const ok = await verifyRefreshTokenHash(refreshToken, rt.tokenHash);
        if (ok) {
          foundUser = u;
          matchingTokenHash = rt.tokenHash;
          break;
        }
      }
      if (foundUser) break;
    }

    if (!foundUser) return res.status(401).json({ message: 'Invalid refresh token' });

    const newPlainRefreshToken = generateRefreshTokenString();
    await rotateRefreshToken(foundUser._id, matchingTokenHash, newPlainRefreshToken);
    const accessToken = signAccessToken(foundUser);

    return res.status(200).json({ accessToken, refreshToken: newPlainRefreshToken });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ message: 'Failed to refresh token.' });
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body || {};
  const authHeader = req.headers.authorization || '';
  try {
    if (refreshToken) {
      const candidateUsers = await User.find({ 'refreshTokens.0': { $exists: true } });
      for (const u of candidateUsers) {
        for (const rt of u.refreshTokens) {
          const ok = await verifyRefreshTokenHash(refreshToken, rt.tokenHash);
          if (ok) {
            await removeRefreshTokenHash(u._id, rt.tokenHash);
            return res.status(200).json({ message: 'Logged out (refresh token revoked)' });
          }
        }
      }
      return res.status(200).json({ message: 'Refresh token not found (already revoked?)' });
    }

    if (authHeader.startsWith('Bearer ')) {
      // Optional: Verify and clear all tokens
      return res.status(200).json({ message: 'Logged out' });
    }
    return res.status(400).json({ message: 'No refresh token provided' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Logout failed.' });
  }
};