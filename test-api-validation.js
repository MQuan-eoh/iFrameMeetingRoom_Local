/**
 * Background API Validation Test
 * Run this to test if background API endpoints are working
 */

// Test configuration
const API_BASE_URL = "http://localhost:3000";
const TEST_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

// Test functions
async function testEndpoint(name, url, options = {}) {
  console.log(`\n🧪 Testing ${name}:`);
  console.log(`   URL: ${url}`);

  try {
    const response = await fetch(url, options);
    console.log(`   Status: ${response.status} ${response.statusText}`);

    const responseText = await response.text();
    console.log(`   Response length: ${responseText.length} characters`);

    try {
      const json = JSON.parse(responseText);
      console.log(`   ✅ ${name} SUCCESS:`, json);
      return { success: true, data: json };
    } catch (parseError) {
      console.log(
        `   ❌ ${name} FAILED - Non-JSON response:`,
        responseText.substring(0, 200)
      );
      return {
        success: false,
        error: "Non-JSON response",
        response: responseText,
      };
    }
  } catch (error) {
    console.log(`   ❌ ${name} ERROR:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log("🚀 Starting Background API Tests...");
  console.log("📍 API Base URL:", API_BASE_URL);

  // Test 1: GET backgrounds
  await testEndpoint("GET Backgrounds", `${API_BASE_URL}/api/backgrounds`);

  // Test 2: POST upload
  await testEndpoint("POST Upload", `${API_BASE_URL}/api/backgrounds/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "main",
      imageData: TEST_IMAGE,
    }),
  });

  // Test 3: DELETE reset
  await testEndpoint("DELETE Reset", `${API_BASE_URL}/api/backgrounds/main`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  console.log("\n✅ All tests completed!");
}

// Auto-run if in browser
if (typeof window !== "undefined") {
  console.log("🌐 Running in browser environment");
  runAllTests();
} else {
  console.log("📦 Node.js environment - export functions");
  module.exports = { runAllTests, testEndpoint };
}
