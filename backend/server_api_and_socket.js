/**
 * server.js — MXShare backend (JWT + Refresh token)
 *
 * - Access tokens are JWTs (short lived).
 * - Refresh tokens are random strings stored hashed in DB.
 * - Uses Google Picker API: Frontend uploads file, Backend saves link/metadata.
 */

import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

dotenv.config();

// --- Config ---
const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev_cookie_secret';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const REDIRECT_URL = process.env.REDIRECT_URL || `${FRONTEND_URL}/auth/google/callback`;

// --- App + Server ---
const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));

// --- Socket.IO (for progress events) ---
const io = new SocketIoServer(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true }
});

// --- MongoDB connection ---
if (!MONGO_URI) {
  console.error('MONGO_URI not provided. Exiting.');
  process.exit(1);
}
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 20000,
  connectTimeoutMS: 30000
})
  .then(() => console.log('MongoDB connected.'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// -----------------------------
// --- Models
// -----------------------------
const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  replacedByTokenHash: { type: String, default: null } 
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  isOAuth: { type: Boolean, default: true },
  accessToken: { type: String }, 
  googleRefreshToken: { type: String }, 
  refreshTokens: { type: [RefreshTokenSchema], default: [] } 
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

// --- MODIFIED NOTE SCHEMA ---
const NoteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Changed to optional because video links don't have a file ID
  googleDriveFileId: { type: String, required: false }, 
  
  websiteUrl: { type: String, trim: true, default: '' },
  videoUrl: { type: String, trim: true, default: '' },
  
  // Added Tags
  tags: { type: [String], default: [] },
  
  downloads: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }
}, { timestamps: true });

const Note = mongoose.model('Note', NoteSchema);

const ReviewSchema = new mongoose.Schema({
  note: { type: mongoose.Schema.Types.ObjectId, ref: 'Note', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 }
}, { timestamps: true });
const Review = mongoose.model('Review', ReviewSchema);

// -----------------------------
// --- Helpers: tokens
// -----------------------------

const signAccessToken = (user) => {
  const payload = { sub: user._id.toString(), name: user.name, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const generateRefreshTokenString = () => {
  return crypto.randomBytes(48).toString('hex'); 
};

const hashToken = async (token) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
};

const verifyRefreshTokenHash = async (token, tokenHash) => {
  return bcrypt.compare(token, tokenHash);
};

const addRefreshTokenToUser = async (userId, plainRefreshToken) => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  const tokenHash = await hashToken(plainRefreshToken);
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { tokenHash, createdAt: new Date(), expiresAt } }
  }, { new: true });
  return { tokenHash, expiresAt };
};

const removeRefreshTokenHash = async (userId, tokenHashToRemove) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { tokenHash: tokenHashToRemove } }
  });
};

const rotateRefreshToken = async (userId, currentTokenHash, newPlainToken) => {
  const newHash = await hashToken(newPlainToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  await User.updateOne(
    { _id: userId, 'refreshTokens.tokenHash': currentTokenHash },
    { $set: { 'refreshTokens.$.replacedByTokenHash': newHash } }
  );
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { tokenHash: newHash, createdAt: new Date(), expiresAt } }
  });
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { tokenHash: currentTokenHash } }
  });
  return { newHash, expiresAt };
};

// -----------------------------
// --- Google OAuth helper
// -----------------------------
const oAuth2ClientForCodeExchange = (redirectUri = REDIRECT_URL) => {
  return new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, redirectUri);
};

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} → ${req.method} ${req.path}`);
  next();
});

// -----------------------------
// --- Auth middleware (JWT)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers?.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return res.status(401).json({ message: 'Missing access token' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

// -----------------------------
// --- Routes
// -----------------------------

// 1) /api/auth/me
app.get('/api/auth/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-refreshTokens -googleRefreshToken -accessToken -password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ authenticated: true, user });
  } catch (err) {
    console.error('Auth/me error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// 2) Google OAuth code exchange
app.post('/api/auth/google/callback', async (req, res) => {
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
});

// 3) Refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
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

    return res.status(200).json({
      accessToken,
      refreshToken: newPlainRefreshToken
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    return res.status(500).json({ message: 'Failed to refresh token.' });
  }
});

// 4) Logout
app.post('/api/auth/logout', async (req, res) => {
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
      try {
        const payload = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        const userId = payload.sub;
        await User.findByIdAndUpdate(userId, { $set: { refreshTokens: [] } });
        return res.status(200).json({ message: 'Logged out (all refresh tokens revoked)' });
      } catch (_) {
        return res.status(200).json({ message: 'No valid access token provided; nothing revoked' });
      }
    }

    return res.status(400).json({ message: 'No refresh token provided' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Logout failed.' });
  }
});

const requireAuth = (req, res, next) => authenticateJWT(req, res, next);

// Notes endpoints
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().populate('uploader', 'name').sort({ createdAt: -1 });
    return res.status(200).json(notes);
  } catch (err) {
    console.error('Fetch notes error:', err);
    return res.status(500).json({ message: 'Failed to fetch notes.' });
  }
});

app.get('/api/notes/homepage', async (req, res) => {
  try {
    const topNotes = await Note.find().populate('uploader', 'name').sort({ avgRating: -1 }).limit(3);
    const latestNotes = await Note.find().populate('uploader', 'name').sort({ createdAt: -1 }).limit(3);
    return res.status(200).json({ topNotes, latestNotes });
  } catch (err) {
    console.error('Homepage notes error:', err);
    return res.status(500).json({ message: 'Failed to fetch homepage notes.' });
  }
});

// --- NEW UPLOAD ROUTE (Handles Picker, Video Links & Tags) ---
// Replaces the old stream-based upload route
app.post('/api/notes/save-drive-reference', requireAuth, async (req, res) => {
  try {
    const { fileId, name, mimeType, iconUrl, googleToken, subject, semester, videoUrl, tags } = req.body;
    const userId = req.user.id;

    if (!fileId && !videoUrl) {
      return res.status(400).json({ message: 'You must provide either a File or a Video Link.' });
    }

    let driveWebLink = '';

    // Only process Drive logic if a fileId exists
    if (fileId) {
      const auth = new google.auth.OAuth2();
      // Use token from frontend for immediate action
      auth.setCredentials({ access_token: googleToken });
      const drive = google.drive({ version: 'v3', auth });

      // Attempt to make file public (Reader/Anyone)
      try {
        await drive.permissions.create({
          fileId: fileId,
          requestBody: { role: 'reader', type: 'anyone' },
        });
      } catch (permErr) {
        console.warn('Permission warning (user might be in restricted org):', permErr.message);
      }

      // Get the public web view link
      const fileInfo = await drive.files.get({
        fileId: fileId,
        fields: 'webViewLink',
      });
      driveWebLink = fileInfo.data.webViewLink;
    }

    // Create the Note record
    const newNote = new Note({
      title: name || 'Reference Video', // Fallback if no file name
      subject: subject || 'General',
      semester: semester || 'sem1',
      uploader: userId,
      googleDriveFileId: fileId || undefined,
      websiteUrl: driveWebLink,
      videoUrl: videoUrl || '',
      tags: Array.isArray(tags) ? tags : [], // Save tags
      downloads: 0,
      avgRating: 0,
      reviewCount: 0
    });

    await newNote.save();

    const populatedNote = await Note.findById(newNote._id).populate('uploader', 'name');

    io.emit('fileUploaded', {
      message: `${populatedNote.uploader.name} shared: "${populatedNote.title}"`,
      note: populatedNote
    });

    return res.status(201).json({ message: 'Saved successfully.', note: populatedNote });

  } catch (err) {
    console.error('Save Drive Reference Error:', err);
    return res.status(500).json({ message: 'Server error saving note.', detail: err.message });
  }
});
// --- END NEW UPLOAD ROUTE ---


// Reviews endpoints
app.get('/api/notes/:noteId/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ note: req.params.noteId }).populate('user', 'name').sort({ createdAt: -1 });
    return res.status(200).json(reviews);
  } catch (err) {
    console.error('Get reviews error:', err);
    return res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

app.post('/api/notes/:noteId/review', requireAuth, async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    const noteId = req.params.noteId;
    const userId = req.user.id;

    const newReview = new Review({ note: noteId, user: userId, rating, comment });
    await newReview.save();

    const stats = await Review.aggregate([
      { $match: { note: new mongoose.Types.ObjectId(noteId) } },
      { $group: { _id: '$note', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
    ]);

    if (stats.length > 0) {
      await Note.findByIdAndUpdate(noteId, {
        avgRating: Number(stats[0].avgRating.toFixed(1)),
        reviewCount: stats[0].reviewCount
      });
    }

    const populatedReview = await Review.findById(newReview._id).populate('user', 'name');
    return res.status(201).json(populatedReview);
  } catch (err) {
    console.error('Post review error:', err);
    return res.status(500).json({ message: 'Failed to save review.' });
  }
});

// Socket.io connection logging
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

// Start server
server.listen(PORT, () => {
  console.log(`Express + Socket.IO server listening on port ${PORT}`);
});