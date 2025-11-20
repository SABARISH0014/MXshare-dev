import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

export const authenticateJWT = (req, res, next) => {
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