import mongoose from 'mongoose';

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

export const User = mongoose.model('User', UserSchema);