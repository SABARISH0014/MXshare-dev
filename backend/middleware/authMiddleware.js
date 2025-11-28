import jwt from 'jsonwebtoken';
import { User } from '../models/User.js'; // Import User to check current role

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

// 1. Authenticate & Fetch User Role
export const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers?.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing access token' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // We fetch the user from DB to ensure we have the LATEST role
    // (Important if you just promoted yourself to Admin via script)
    const user = await User.findById(payload.sub || payload.id);

    if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
    }

    // Attach full user (including .role) to request
    req.user = user; 
    return next();

  } catch (err) {
    console.error("Auth Error:", err.message);
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

// 2. Admin Guard
export const restrictToAdmin = (req, res, next) => {
  // req.user is set by authenticateJWT above
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      message: 'Access denied. Administrators only.' 
    });
  }
  next();
};