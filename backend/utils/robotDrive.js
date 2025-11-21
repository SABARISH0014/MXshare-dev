import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

// 1. Setup OAuth2 Client with Robot Credentials
const oauth2Client = new google.auth.OAuth2(
  process.env.ROBOT_CLIENT_ID,
  process.env.ROBOT_CLIENT_SECRET,
  process.env.ROBOT_REDIRECT_URI // usually https://developers.google.com/oauthplayground
);

// 2. Set the "Forever" Refresh Token
// This allows the backend to generate new Access Tokens automatically
oauth2Client.setCredentials({
  refresh_token: process.env.ROBOT_REFRESH_TOKEN
});

// 3. Export the Drive Instance
export const robotDrive = google.drive({ version: 'v3', auth: oauth2Client });