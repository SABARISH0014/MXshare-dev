import { io } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3001'; 

export const socket = io(API_BASE_URL, {
  transports: ["websocket"]
});