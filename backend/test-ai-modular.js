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
  console.log("\n🤖 STARTING MODULAR AI SYSTEM CHECK (OpenRouter + Google)...\n");

  if(!process.env.OPENROUTER_API_KEY) {
      console.error("❌ ERROR: OPENROUTER_API_KEY is missing in .env");
      process.exit(1);
  }
  if(!process.env.GOOGLE_API_KEY) {
      console.error("❌ ERROR: GOOGLE_API_KEY is missing in .env (Needed for Embeddings)");
      process.exit(1);
  }

  const sampleText = `
    Introduction to React Hooks.
    Hooks are a new addition in React 16.8. They let you use state and other React features without writing a class.
    The useState hook is the most common. It returns a pair: the current state value and a function that lets you update it.
    useEffect adds the ability to perform side effects from a function component.
    React is maintained by Facebook and a community of individual developers and companies.
  `;

  // --- TEST 1: TEXT MODERATION (OpenRouter/Llama) ---
  console.log("1️⃣  Testing Moderation (OpenRouter Llama)...");
  try {
    const start = Date.now();
    const result = await AIService.moderateContent(sampleText);
    const duration = Date.now() - start;
    
    // Check if it's a real result or a fallback
    const isFallback = !result.categories || Object.keys(result.categories).length === 0;

    if (result.overall && !isFallback) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   🛡️  Label:", result.overall.label);
    } else {
      console.warn(`   ⚠️  PARTIAL SUCCESS (Fallback Triggered)`);
      console.log("   🛡️  Label:", result.overall?.label || "Unknown");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n⏳ Cooling down (2s)...\n");
  await wait(2000);

  // --- TEST 2: TITLE SUGGESTION (OpenRouter/Llama) ---
  console.log("2️⃣  Testing Title Suggestion (OpenRouter Llama)...");
  try {
    const start = Date.now();
    const titles = await AIService.suggestTitles(sampleText);
    const duration = Date.now() - start;

    if (Array.isArray(titles) && titles.length > 0) {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   🏷️  Titles:", titles.join(" | "));
    } else {
      console.error("   ❌ FAILED: No titles returned.");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n⏳ Cooling down (2s)...\n");
  await wait(2000);

  // --- TEST 3: DOCUMENT SUMMARY (OpenRouter/Llama) ---
  console.log("3️⃣  Testing Summary (OpenRouter Llama)...");
  try {
    const start = Date.now();
    const summary = await AIService.generateSummary(sampleText);
    const duration = Date.now() - start;

    if (summary && summary.length > 10 && summary !== "Summary unavailable.") {
      console.log(`   ✅ SUCCESS (${duration}ms)`);
      console.log("   📝 Summary:", summary.substring(0, 80).replace(/\n/g, ' ') + "...");
    } else {
      console.error("   ❌ FAILED: Invalid summary.");
    }
  } catch (error) {
    console.error("   ❌ FAILED:", error.message);
  }

  console.log("\n⏳ Cooling down (1s)...\n");
  await wait(1000);

  // --- TEST 4: EMBEDDINGS (Google) ---
  console.log("4️⃣  Testing Embeddings (Google text-embedding-004)...");
  try {
    const start = Date.now();
    const vector = await AIService.generateEmbedding("Vector search test.");
    const duration = Date.now() - start;

    // UPDATED CHECK: Google uses 768 dimensions
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