import { robotDrive } from './utils/robotDrive.js';

async function testDrive() {
  console.log("Testing Robot Drive Authentication...");
  try {
    const res = await robotDrive.files.list({ pageSize: 1 });
    console.log("✅ Connection Successful!");
    console.log("Found file:", res.data.files[0]?.name || "No files (but auth works)");
  } catch (error) {
    console.error("❌ Auth Failed:", error.message);
    if (error.message.includes('invalid_grant')) {
        console.log("👉 ACTION: You need to regenerate your ROBOT_REFRESH_TOKEN.");
    }
  }
}

testDrive();