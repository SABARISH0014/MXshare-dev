import { OAuth2Client } from 'google-auth-library';

export const oAuth2ClientForCodeExchange = (redirectUri) => {
  // Access process.env INSIDE the function to ensure dotenv has loaded
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env file");
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
};