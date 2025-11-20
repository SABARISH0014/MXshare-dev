import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30', 10);

export const signAccessToken = (user) => {
  const payload = { sub: user._id.toString(), name: user.name, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshTokenString = () => {
  return crypto.randomBytes(48).toString('hex'); 
};

export const hashToken = async (token) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(token, salt);
};

export const verifyRefreshTokenHash = async (token, tokenHash) => {
  return bcrypt.compare(token, tokenHash);
};

export const addRefreshTokenToUser = async (userId, plainRefreshToken) => {
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  const tokenHash = await hashToken(plainRefreshToken);
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { tokenHash, createdAt: new Date(), expiresAt } }
  }, { new: true });
  return { tokenHash, expiresAt };
};

export const removeRefreshTokenHash = async (userId, tokenHashToRemove) => {
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { tokenHash: tokenHashToRemove } }
  });
};

export const rotateRefreshToken = async (userId, currentTokenHash, newPlainToken) => {
  const newHash = await hashToken(newPlainToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000);
  
  // Mark old as replaced
  await User.updateOne(
    { _id: userId, 'refreshTokens.tokenHash': currentTokenHash },
    { $set: { 'refreshTokens.$.replacedByTokenHash': newHash } }
  );
  // Add new
  await User.findByIdAndUpdate(userId, {
    $push: { refreshTokens: { tokenHash: newHash, createdAt: new Date(), expiresAt } }
  });
  // Cleanup old (optional immediate removal vs keeping history)
  await User.findByIdAndUpdate(userId, {
    $pull: { refreshTokens: { tokenHash: currentTokenHash } }
  });
  return { newHash, expiresAt };
};