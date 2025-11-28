import * as AIService from './services/AIService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function runTests() {
  console.log("🤖 STARTING AI SYSTEM CHECK...\n");

  // --- TEST 1: TEXT ANALYSIS (Gemini) ---
  console.log("1️⃣  Testing Text Analysis (Gemini)...");
  try {
    const textResult = await AIService.analyzeTextContent(
      "React is a JavaScript library for building user interfaces. It is maintained by Facebook."
    );
    
    if (textResult.moderation && textResult.summary) {
      console.log("   ✅ SUCCESS!");
      console.log("   📝 Summary:", textResult.summary);
      console.log("   🛡️  Moderation Label:", textResult.moderation.overall.label);
    } else {
      console.error("   ❌ FAILED: Unexpected response structure.", textResult);
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n---------------------------------------------------\n");

  // --- TEST 2: EMBEDDINGS (Hugging Face) ---
  console.log("2️⃣  Testing Embeddings (Hugging Face API)...");
  try {
    const vector = await AIService.generateEmbedding("This is a test sentence for vector search.");
    
    if (Array.isArray(vector) && vector.length === 384) {
      console.log("   ✅ SUCCESS!");
      console.log("   📐 Vector Dimensions:", vector.length);
      console.log("   🔢 Sample:", vector.slice(0, 5), "...");
    } else {
      console.error("   ❌ FAILED: Invalid vector returned.");
      console.log("   Received:", vector ? (Array.isArray(vector) ? `Array[${vector.length}]` : typeof vector) : "null");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n---------------------------------------------------\n");

  // --- TEST 3: IMAGE ANALYSIS (Gemini Vision) ---
  console.log("3️⃣  Testing Vision (Gemini)...");
  try {
    // A tiny 1x1 pixel transparent GIF in Base64 (valid image data)
    const sampleBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    const visionResult = await AIService.analyzeImage(sampleBase64);

    if (visionResult.isSafe !== undefined) {
      console.log("   ✅ SUCCESS!");
      console.log("   👁️  Safe:", visionResult.isSafe);
      console.log("   📝 Description:", visionResult.description);
    } else {
      console.error("   ❌ FAILED: Unexpected response.", visionResult);
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n🏁 TEST COMPLETE.");
}

runTests();