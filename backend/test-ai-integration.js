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
  console.log("\n🤖 STARTING AI SYSTEM CHECK (OpenRouter + Google)...\n");

  // 1. Check Env Variables
  if(!process.env.OPENROUTER_API_KEY) {
      console.error("❌ ERROR: OPENROUTER_API_KEY is missing in .env");
      process.exit(1);
  }
  // Note: OpenRouter Nomic embedding doesn't need Google Key, 
  // but if you kept Google logic for fallback, check it.
  
  const sampleText = `
    Introduction to Machine Learning.
    Machine learning (ML) is a field of inquiry devoted to understanding and building methods that 'learn', that is, methods that leverage data to improve performance on some set of tasks.
    It is seen as a part of artificial intelligence. Machine learning algorithms build a model based on sample data, known as training data, in order to make predictions or decisions without being explicitly programmed to do so.
  `;

  // --- TEST 1: MODERATION ---
  console.log("1️⃣  Testing Moderation (OpenRouter)...");
  try {
    const start = Date.now();
    const result = await AIService.moderate(sampleText);
    const duration = Date.now() - start;
    
    if (result.isSafe !== undefined) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   🛡️  Safe:", result.isSafe);
    } else {
      console.error("   ❌ FAILED: Invalid response structure.", result);
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  await wait(1000);

  // --- TEST 2: METADATA SUGGESTION ---
  console.log("\n2️⃣  Testing Metadata Suggestion (OpenRouter)...");
  try {
    const start = Date.now();
    const suggestions = await AIService.suggestMetadata({
        rawText: sampleText, 
        originalFilename: "ml_intro.pdf"
    });
    const duration = Date.now() - start;

    if (suggestions.title && Array.isArray(suggestions.tags)) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   🏷️  Title:", suggestions.title);
      console.log("   🏷️  Tags:", suggestions.tags.join(", "));
    } else {
      console.error("   ❌ FAILED: No valid metadata returned.");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  await wait(1000);

  // --- TEST 3: SUMMARY ---
  console.log("\n3️⃣  Testing Summary (OpenRouter)...");
  try {
    const start = Date.now();
    const summary = await AIService.summarize({ content: sampleText, type: 'text' });
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

  // --- TEST 4: EMBEDDINGS ---
  console.log("\n4️⃣  Testing Embeddings (OpenRouter Nomic)...");
  try {
    const start = Date.now();
    const vector = await AIService.embedText("Vector search test.");
    const duration = Date.now() - start;

    // OpenRouter Nomic model output is 768 dimensions
    if (Array.isArray(vector) && vector.length === 768) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   📐 Dimensions:", vector.length, "(Matches Index)");
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