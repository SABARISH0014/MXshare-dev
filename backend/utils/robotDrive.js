import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// Use credentials from .env to act as the Robot User
const oauth2Client = new google.auth.OAuth2(
  process.env.ROBOT_CLIENT_ID,
  process.env.ROBOT_CLIENT_SECRET,
  process.env.ROBOT_REDIRECT_URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.ROBOT_REFRESH_TOKEN
});

// This drive instance now has full access to mxshare.official's Drive
export const robotDrive = google.drive({ version: 'v3', auth: oauth2Client });