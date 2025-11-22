import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { 
  signAccessToken, generateRefreshTokenString, addRefreshTokenToUser, 
  verifyRefreshTokenHash, rotateRefreshToken, removeRefreshTokenHash 
} from '../utils/tokenService.js';
import { oAuth2ClientForCodeExchange } from '../utils/googleClient.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const REDIRECT_URL = process.env.REDIRECT_URL || `${FRONTEND_URL}/auth/google/callback`;

// ==========================================
// 1. STANDARD SIGNUP
// ==========================================
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      googleId: `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      isOAuth: false,
      accessToken: null,
      googleRefreshToken: null,
      bio: '', interests: '', strengths: ''
    });

    await newUser.save();

    // Return success. Do not generate tokens yet to force login flow.
    return res.status(201).json({
      message: "Account created! Please log in.",
    });

  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ message: `Signup failed: ${err.message}` });
  }
};

// ==========================================
// 2. STANDARD LOGIN (The Unified Logic)
// ==========================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials." });

    if (!user.password) {
        return res.status(400).json({ message: "Please login with Google." });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials." });

    // 1. Generate App Tokens (JWT)
    const accessToken = signAccessToken(user);
    const refreshToken = generateRefreshTokenString();
    await addRefreshTokenToUser(user._id, refreshToken);

    // 2. UNIFICATION STEP: Auto-Fetch Google Token
    // If this standard user has linked Drive before, get a fresh token NOW.
    let freshGoogleToken = null;
    
    if (user.googleRefreshToken) {
        try {
            const client = oAuth2ClientForCodeExchange();
            client.setCredentials({ refresh_token: user.googleRefreshToken });
            
            // Ask Google for a new Access Token silently
            const response = await client.getAccessToken();
            freshGoogleToken = response.token;
        } catch (gErr) {
            console.warn("Could not auto-refresh Google Token:", gErr.message);
            // We don't fail the login, we just don't send the token.
            // The UI will show the "Connect Drive" button again.
        }
    }

    // 3. Send response
    const fullUser = user.toObject();
    delete fullUser.password;
    delete fullUser.refreshTokens;
    delete fullUser.accessToken;
    delete fullUser.googleRefreshToken;

    return res.status(200).json({
      message: "Login Successful",
      user: fullUser,
      accessToken,
      refreshToken,
      // Send the Google Token to frontend immediately!
      googleAccessToken: freshGoogleToken, 
      googleRefreshToken: user.googleRefreshToken ? "linked" : null
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed." });
  }
};

// ==========================================
// 3. GOOGLE OAUTH (Login/Link) - DYNAMIC URI FIX
// ==========================================
export const googleCallback = async (req, res) => {
  const { code, redirect_uri } = req.body || {}; // <--- Extract redirect_uri from body
  
  if (!code) return res.status(400).json({ message: 'Auth code not provided.' });

  try {
    // DYNAMIC LOGIC:
    // If frontend sent 'postmessage', use that. Otherwise fall back to the ENV variable.
    const usedRedirectUri = redirect_uri || REDIRECT_URL;
    
    console.log(`[DEBUG] Swapping code using redirect_uri: ${usedRedirectUri}`);

    const tempClient = oAuth2ClientForCodeExchange(usedRedirectUri);
    const { tokens } = await tempClient.getToken({ code, redirect_uri: usedRedirectUri });
    tempClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: tempClient, version: 'v2' });
    const { data } = await oauth2.userinfo.get();

    if (!data || !data.email) return res.status(400).json({ message: 'Failed to fetch Google user data.' });

    let user = await User.findOne({ $or: [{ googleId: data.id }, { email: data.email }] });

    if (!user) {
      // New Google User
      user = new User({
        name: data.name,
        email: data.email,
        googleId: data.id,
        isOAuth: true,
        accessToken: tokens.access_token || null,
        googleRefreshToken: tokens.refresh_token || null
      });
    } else {
      // Existing User (Linking or Logging in)
      if (user.googleId.startsWith('std_')) {
          user.googleId = data.id; 
      }
      user.isOAuth = true;
      
      if (tokens.access_token) user.accessToken = tokens.access_token;
      if (tokens.refresh_token) user.googleRefreshToken = tokens.refresh_token;
    }

    await user.save();

    const accessToken = signAccessToken(user);
    const appRefreshToken = generateRefreshTokenString();
    await addRefreshTokenToUser(user._id, appRefreshToken);

    const fullUser = user.toObject();
    delete fullUser.password;
    delete fullUser.refreshTokens;
    delete fullUser.accessToken;
    delete fullUser.googleRefreshToken;

    return res.status(200).json({
      message: "Login/Link Successful",
      user: fullUser,
      accessToken,
      refreshToken: appRefreshToken,
      googleAccessToken: tokens.access_token,
      googleRefreshToken: user.googleRefreshToken ? "linked" : null
    });
  } catch (err) {
    console.error('Google callback error:', err);
    return res.status(500).json({ message: 'Authentication failed.', detail: err.message });
  }
};

// ... imports remain the same

// ==========================================
// 4. UTILS (Me, Refresh, Logout, Update)
// ==========================================

// ==========================================
// 4. UTILS (Me, Refresh, Logout, Update)
// ==========================================

export const getMe = async (req, res) => {
  try {
    // 1. Fetch User (Exclude sensitive data like passwords)
    // We DO need to check 'googleRefreshToken' internally, but we don't send it to client.
    const user = await User.findById(req.user.id).select('-password -refreshTokens -accessToken');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    let freshGoogleToken = null;
    
    // 2. THE FIX: Check if DB has a Refresh Token
    if (user.googleRefreshToken) {
        try {
            // Import the helper to exchange tokens
            // Note: Ensure oAuth2ClientForCodeExchange is imported at the top of this file!
            const client = oAuth2ClientForCodeExchange();
            
            // Set the stored Refresh Token
            client.setCredentials({ refresh_token: user.googleRefreshToken });
            
            // Ask Google for a brand new Access Token
            const response = await client.getAccessToken();
            freshGoogleToken = response.token;
            
            console.log(`[DEBUG] Auto-generated Google Token for user: ${user.email}`);
        } catch (gErr) {
            console.warn("Auto-refresh Google token failed on /me:", gErr.message);
            // If this fails, the user might have revoked access.
            // We continue, but 'freshGoogleToken' stays null, so buttons won't show.
        }
    }

    // 3. Return User + The Fresh Token
    return res.status(200).json({ 
        authenticated: true, 
        user,
        // The frontend needs this to show the "Upload" buttons
        googleAccessToken: freshGoogleToken 
    });

  } catch (err) {
    console.error('Auth/me error:', err);
    return res.status(500).json({ message: 'Server error' });
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
            return res.status(200).json({ message: 'Logged out' });
          }
        }
      }
      return res.status(200).json({ message: 'Refresh token not found' });
    }

    if (authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ message: 'Logged out' });
    }
    return res.status(400).json({ message: 'No refresh token provided' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Logout failed.' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { bio, interests, strengths } = req.body;
    const userId = req.user.id; 
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { bio, interests, strengths },
      { new: true } 
    ).select('-password -refreshTokens -googleRefreshToken -accessToken');
    if (!updatedUser) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Failed to update profile" });
  }
};