MXShare Full-Stack Deployment Guide

This guide outlines the deployment strategy for the React frontend (Vercel) and the Node.js/Express/MongoDB/Socket.IO backend (Docker).

I. Backend Containerization (Docker)

The backend service is designed to be fully containerized for consistency and scalability.

1. Dockerfile for Backend (Assumes Node.js files are in backend/)

# Use a lighter official Node.js image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy the application code and .env
COPY backend/server_api_and_socket.js .
COPY backend/.env .

# Expose the port the app runs on
EXPOSE 3001

# Command to run the application
CMD ["node", "server_api_and_socket.js"]


2. Deployment Steps (Example: Using Docker Compose)

Build the Image:

docker build -t mxshare-backend .


Run the Container (with Environment Variables):
(For production, ensure all environment variables are properly passed at runtime, especially security secrets like MONGO_URI and HIVE_API_KEY.)

docker run -d \
  --name mxshare-api \
  -p 3001:3001 \
  --env-file ./backend/.env \
  mxshare-backend


II. Frontend Deployment (Vercel)

The React application is deployed as a static build on Vercel.

1. Project Setup:

Ensure your React project (using client/src/App.jsx) is configured for a standard build (using Vite as per the included package.json).

Connect your GitHub repository to Vercel.

2. Environment Variables (CRITICAL):
The frontend must know where to find the deployed backend/Socket.IO server. You must set the following environment variable in the Vercel project settings:

Variable Name

Value Example

Description

VITE_API_URL

https://api.mxshare.com:3001

The public, accessible URL of your deployed Node.js server.

3. Vercel Configuration:

Framework: Auto-detected (Vite/React).

Build Command: npm run build (or equivalent).

Root Directory: Ensure Vercel points to the client folder if you deploy the entire monorepo, or specifically configure the build to run from the client directory.

III. Production Communication Flow

Client Request: User clicks Login on Vercel frontend (https://your-frontend.vercel.app).

API Call: Frontend sends a POST request to the backend: VITE_API_URL/api/auth/login.

Real-Time: Upon successful API action (e.g., /api/notes/upload), the backend uses its Socket.IO server running on port 3001 to push the fileUploaded event.

Frontend Listen: The React NotificationProvider (Socket.IO client) is connected to the same VITE_API_URL:3001 and instantly displays the notification toast.