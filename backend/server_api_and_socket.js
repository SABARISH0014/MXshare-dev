import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

dotenv.config();

// --- Config ---
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'dev_cookie_secret';

// --- App + Server ---
const app = express();
const server = http.createServer(app);

// --- Database ---
connectDB();

// --- Middleware ---
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(COOKIE_SECRET));

// --- Socket.IO ---
const io = new SocketIoServer(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true }
});

// Inject IO into Request object for Controllers
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

// --- Socket Connection Logging ---
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`Socket disconnected: ${socket.id}`));
});

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`Express + Socket.IO server listening on port ${PORT}`);
});