import mongoose from 'mongoose';

// --- Refresh Token Schema (Kept as is) ---
const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  replacedByTokenHash: { type: String, default: null } 
}, { _id: false });

// --- Quest Sub-schema (Kept as is) ---
const QuestProgressSchema = new mongoose.Schema({
  questId: { type: String, required: true },
  label: { type: String, required: true },
  description: { type: String, default: '' },
  eventTrigger: { type: String, required: true },
  targetCount: { type: Number, required: true },
  xpReward: { type: Number, required: true },
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
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
  
  // ==================================================
  // NEW: SECURITY & AI MODERATION FIELDS
  // ==================================================
  role: { 
    type: String, 
    enum: ['user', 'admin'], 
    default: 'user' 
    // 'admin' gets access to /admin/dashboard to review flagged content
  },
  
  trustScore: { 
    type: Number, 
    default: 100,
    min: 0,
    max: 100
    // Logic: If AI flags a user's upload as "Blocked" -> Deduct 10 points.
    // If score < 50, require manual approval for ALL uploads.
  },

  isBanned: { type: Boolean, default: false }, // "Kill switch" for malicious users

  // ==================================================
  // GAMIFICATION ENGINE FIELDS
  // ==================================================
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  
  dailyQuestProgress: {
    lastReset: { type: Date, default: Date.now },
    quests: { type: [QuestProgressSchema], default: [] },
    completedHistory: { type: [QuestProgressSchema], default: [] },
    streak: { type: Number, default: 0 },
    rerollsLeft: { type: Number, default: 1 }
  }

}, { timestamps: true });

// --- Helper Method: Calculate Level ---
UserSchema.methods.calculateLevel = function() {
    return Math.floor(this.xp / 100) + 1;
};

export const User = mongoose.model('User', UserSchema);