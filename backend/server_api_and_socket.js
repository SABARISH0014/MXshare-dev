import dotenv from 'dotenv';
dotenv.config(); // Call this once at the very top

import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
// 1. IMPORT THE ENGINE
import gamificationEngine from './services/GamificationEngine.js'; 
import gamificationRoutes from './routes/gamificationRoutes.js';
// --- Config ---
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev_cookie_secret';

// --- App + Server ---
const app = express();
const server = http.createServer(app);

// --- Database ---
connectDB();

const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174'
];
// --- Middleware ---
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));

// --- Socket.IO ---
const io = new SocketIoServer(server, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'], credentials: true }
});

// 2. INITIALIZE ENGINE WITH SOCKET
// This allows the engine to push updates (XP gain, Quest Complete) instantly
gamificationEngine.initialize(io);

// Inject IO into Request object for Controllers (Optional now, but good to keep)
app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} → ${req.method} ${req.path}`);
  next();
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/gamification', gamificationRoutes);
// --- Socket Connection Logging ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // 3. LISTEN FOR USER ROOM JOIN
  // The Frontend will emit this when the user logs in.
  // This enables us to say io.to(userId).emit(...)
  socket.on('join_user_room', (userId) => {
      socket.join(userId); 
      console.log(`User ${userId} joined room for live notifications`);
  });

  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Express + Socket.IO server listening on port ${PORT}`);
});