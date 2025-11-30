import Tesseract from "tesseract.js";

// ⚙ Optional: Custom logger for progress UI
function logProgress(m) {
  if (m.status === "recognizing text") {
    console.log(`[OCR] ${Math.round(m.progress * 100)}%`);
  }
}

export async function runOCR(buffer) {
  try {
    console.log("[OCR] 🔍 Starting OCR fallback...");

    const result = await Tesseract.recognize(buffer, "eng", {
      logger: logProgress
    });

    const text = result?.data?.text || "";
    console.log("[OCR] 📝 Extracted:", text.slice(0, 100) + "...");

    return text.trim();
  } catch (err) {
    console.error("[OCR] ❌ Error:", err);
    return "";
  }
}
