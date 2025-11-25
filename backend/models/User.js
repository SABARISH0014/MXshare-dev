import mongoose from 'mongoose';

const RefreshTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  replacedByTokenHash: { type: String, default: null } 
}, { _id: false });

// --- UPDATED: Quest Sub-schema ---
// We store full details here so if the Quest Pool changes later, 
// the user's active quest for the day doesn't break.
const QuestProgressSchema = new mongoose.Schema({
  questId: { type: String, required: true },
  label: { type: String, required: true },       // e.g. "Research Marathon"
  description: { type: String, default: '' },    // e.g. "View 5 notes"
  eventTrigger: { type: String, required: true },// e.g. 'NOTE_VIEW'
  targetCount: { type: Number, required: true }, // e.g. 5
  xpReward: { type: Number, required: true },    // e.g. 100
  progress: { type: Number, default: 0 },
  completed: { type: Boolean, default: false }
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
    quests: { type: [QuestProgressSchema], default: [] }
  }

}, { timestamps: true });

// --- Helper Method: Calculate Level ---
UserSchema.methods.calculateLevel = function() {
    return Math.floor(this.xp / 100) + 1;
};

export const User = mongoose.model('User', UserSchema);