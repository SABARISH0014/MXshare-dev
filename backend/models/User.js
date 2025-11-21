import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  replacedByTokenHash: { type: String, default: null } 
}, { _id: false });

const UserSchema = new mongoose.Schema({
  // --- Basic Auth Fields ---
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  isOAuth: { type: Boolean, default: true },
  
  // --- Token Storage ---
  accessToken: { type: String }, 
  googleRefreshToken: { type: String }, 
  refreshTokens: { type: [RefreshTokenSchema], default: [] },

  // --- NEW PROFILE FIELDS (ADD THESE) ---
  // These must exist for the "Edit Profile" feature to work
  bio: { type: String, default: '' },
  interests: { type: String, default: '' }, 
  strengths: { type: String, default: '' }, 

}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);