import mongoose from 'mongoose';

// --- Refresh Token Schema (unchanged) ---
const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  replacedByTokenHash: { type: String, default: null } 
}, { _id: false });

// --- UPDATED: Quest Sub-schema ---
const QuestProgressSchema = new mongoose.Schema({
  questId: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  eventTrigger: { type: String, required: true },
  targetCount: { type: Number, required: true },
  xpReward: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  
  // NEW: Tracks when a quest was moved to history
  completedAt: { type: Date } 
}, { _id: false });

const UserSchema = new mongoose.Schema({
  // --- Basic Auth Fields ---
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, required: true, unique: true },
  password: { type: String, default: null },
  isOAuth: { type: Boolean, default: true },
  
  // --- Token Storage ---
  accessToken: { type: String }, 
  googleRefreshToken: { type: String }, 
  refreshTokens: { type: [RefreshTokenSchema], default: [] },

  // --- Profile Fields ---
  bio: { type: String, default: '' },
  interests: { type: String, default: '' }, 
  strengths: { type: String, default: '' }, 
  
  // --- GAMIFICATION ENGINE FIELDS ---
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  
  dailyQuestProgress: {
    lastReset: { type: Date, default: Date.now },
    
    // The Active Quests (Visible on Dashboard)
    quests: { type: [QuestProgressSchema], default: [] },

    // NEW: The History (Quests disappear from 'quests' and move here)
    completedHistory: { type: [QuestProgressSchema], default: [] },

    // NEW: Tracks consecutive days logged in/active
    streak: { type: Number, default: 0 },

    // NEW: Allows user to swap 1 quest per day
    rerollsLeft: { type: Number, default: 1 }
  }

}, { timestamps: true });

// --- Helper Method: Calculate Level ---
// This uses a linear progression (Level up every 100 XP)
UserSchema.methods.calculateLevel = function() {
    return Math.floor(this.xp / 100) + 1;
};

export const User = mongoose.model('User', UserSchema);