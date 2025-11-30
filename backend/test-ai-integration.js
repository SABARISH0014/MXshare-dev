import * as AIService from './services/AIService.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log("\n🤖 STARTING HYBRID AI SYSTEM CHECK (Gemini + TensorFlow.js)...\n");

  // 1. Check Env Variables
  if(!process.env.GOOGLE_API_KEY) {
      console.error("❌ ERROR: GOOGLE_API_KEY is missing in .env");
      process.exit(1);
  }
  
  const sampleText = `
    Introduction to Machine Learning.
    Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.
    It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.
  `;

  // --- TEST 1: MODERATION (Gemini) ---
  console.log("1️⃣  Testing Moderation (Gemini 2.0 Flash)...");
  try {
    const start = Date.now();
    // Note: Function name changed to moderateContent in new AIService
    const result = await AIService.moderateContent(sampleText, 'text/plain');
    const duration = Date.now() - start;
    
    if (result.isSafe !== undefined) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   🛡️  Safe:", result.isSafe);
      console.log("   📊  Categories:", result.categories || []);
    } else {
      console.error("   ❌ FAILED: Invalid response structure.", result);
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  await wait(1000);

  // --- TEST 2: METADATA SUGGESTION (Gemini Multimodal) ---
  console.log("\n2️⃣  Testing Metadata Suggestion (Gemini Vision)...");
  try {
    const start = Date.now();
    // Create a mock buffer from string to simulate a file upload
    const mockBuffer = Buffer.from(sampleText, 'utf-8');
    
    const suggestions = await AIService.suggestMetadata(mockBuffer, 'text/plain');
    const duration = Date.now() - start;

    if (suggestions.title && (suggestions.tags || suggestions.semester)) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   🏷️  Title:", suggestions.title);
      console.log("   🏷️  Tags:", suggestions.tags ? suggestions.tags.join(", ") : "None");
    } else {
      console.error("   ❌ FAILED: No valid metadata returned.");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  await wait(1000);

  // --- TEST 3: SUMMARY (Gemini) ---
  console.log("\n3️⃣  Testing Summary (Gemini 2.0 Flash)...");
  try {
    const start = Date.now();
    const summary = await AIService.summarizeContent(sampleText);
    const duration = Date.now() - start;

    if (summary && summary.length > 10) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   📝 Summary:", summary.substring(0, 80).replace(/\n/g, ' ') + "...");
    } else {
      console.error("   ❌ FAILED: Invalid summary.");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  await wait(1000);

  // --- TEST 4: EMBEDDINGS (TensorFlow.js) ---
  console.log("\n4️⃣  Testing Embeddings (Local TensorFlow.js)...");
  try {
    const start = Date.now();
    // Note: First run might be slow as it loads the model
    const vector = await AIService.embedText("Vector search test.");
    const duration = Date.now() - start;

    // TensorFlow Universal Sentence Encoder outputs 512 dimensions
    if (Array.isArray(vector) && vector.length === 512) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   📐 Dimensions:", vector.length, "(Matches MongoDB 512 Index)");
      console.log("   🔢 Sample:", vector.slice(0, 3));
    } else {
      console.error("   ❌ FAILED: Invalid vector.");
      console.log("   Received Length:", vector ? vector.length : "null");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n🏁 ALL SYSTEMS CHECK COMPLETE.");
}

runTests();