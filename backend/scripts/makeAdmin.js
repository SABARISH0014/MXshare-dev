import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// --- FIX: ROBUST PATH RESOLUTION ---
// This ensures we find .env relative to THIS file, not the terminal location
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const EMAIL = 'admin@psgtech.ac.in';
const PASSWORD = 'admin@123'; 

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is undefined. Check your .env path!");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("🔌 Connected to DB.");

    let user = await User.findOne({ email: EMAIL });

    if (user) {
      console.log(`User ${EMAIL} found. Promoting to Admin...`);
      user.role = 'admin';
      
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(PASSWORD, salt);
      
      // Ensure Google Auth doesn't block password login if previously used
      if (user.isOAuth && !user.password) {
          user.isOAuth = false; 
      }
      
      await user.save();
    } else {
      console.log(`User ${EMAIL} not found. Creating new Admin...`);
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(PASSWORD, salt);
      
      user = new User({
        name: "System Admin",
        email: EMAIL,
        password: hashedPassword,
        role: 'admin',
        googleId: `admin_${Date.now()}`,
        isOAuth: false
      });
      await user.save();
    }

    console.log(`✅ SUCCESS: ${EMAIL} is now an Admin with password: ${PASSWORD}`);
  } catch (err) {
    console.error("❌ Script Failed:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected.");
  }
};

run();