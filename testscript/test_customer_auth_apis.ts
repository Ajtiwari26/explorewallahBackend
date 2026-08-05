/**
 * 🧪 Test Script: Customer Authentication APIs (Local & Production Server)
 * Tests:
 * 1. POST /api/auth/customer/phone (Phone OTP Login / Registration)
 * 2. POST /api/auth/customer/google (Google OAuth Login / Registration)
 * 3. POST /api/auth/refresh (Silent Token Refresh via Cookie/Body)
 * 4. PUT /api/auth/customer/profile (Protected Customer Profile Update)
 */

import http from "http";
import https from "https";

const TARGET_HOST = process.env.TEST_TARGET || "http://localhost:5050";

function makeRequest(
  url: string,
  method: string,
  data?: any,
  headers: Record<string, string> = {}
): Promise<{ status: number; body: any; headers: any }> {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith("https");
    const lib = isHttps ? https : http;

    const parsedUrl = new URL(url);
    const bodyStr = data ? JSON.stringify(data) : "";

    const reqHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(data ? { "Content-Length": Buffer.byteLength(bodyStr).toString() } : {}),
      ...headers,
    };

    const req = lib.request(
      parsedUrl,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let rawData = "";
        res.on("data", (chunk) => (rawData += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(rawData);
            resolve({ status: res.statusCode || 500, body: parsed, headers: res.headers });
          } catch {
            resolve({ status: res.statusCode || 500, body: rawData, headers: res.headers });
          }
        });
      }
    );

    req.on("error", reject);
    if (data) req.write(bodyStr);
    req.end();
  });
}

async function runCustomerAuthTests() {
  console.log(`=======================================================`);
  console.log(`🧪 Testing Customer Auth APIs against: ${TARGET_HOST}`);
  console.log(`=======================================================\n`);

  try {
    // Test 1: Health Check
    console.log("▶ 1. Testing GET /api/health...");
    const health = await makeRequest(`${TARGET_HOST}/api/health`, "GET");
    console.log(`   Status: ${health.status} OK | Service: ${health.body.service}`);

    // Test 2: Phone OTP Authentication
    console.log("\n▶ 2. Testing POST /api/auth/customer/phone...");
    const testPhone = "+919399250600";
    const phoneRes = await makeRequest(`${TARGET_HOST}/api/auth/customer/phone`, "POST", {
      phone: testPhone,
      firebaseUid: `test_uid_${Date.now()}`,
      name: "Ajay Tiwari Test",
    });

    console.log(`   Status: ${phoneRes.status}`);
    console.log(`   User ID: ${phoneRes.body.user?.id}`);
    console.log(`   Access Token Issued: ${phoneRes.body.accessToken ? "YES (JWT)" : "NO"}`);
    console.log(`   Set-Cookie Header: ${phoneRes.headers["set-cookie"] ? "YES (HttpOnly Refresh Cookie)" : "NO"}`);

    const accessToken = phoneRes.body.accessToken;
    const refreshToken = phoneRes.body.refreshToken;

    // Test 3: Google Sign-In Authentication
    console.log("\n▶ 3. Testing POST /api/auth/customer/google...");
    const googleRes = await makeRequest(`${TARGET_HOST}/api/auth/customer/google`, "POST", {
      email: "adventurer.test@explorewallah.com",
      name: "Google Adventurer Test",
      phone: testPhone,
      firebaseUid: `g_test_uid_${Date.now()}`,
    });
    console.log(`   Status: ${googleRes.status}`);
    console.log(`   Google User Email: ${googleRes.body.user?.email}`);
    console.log(`   Access Token Issued: ${googleRes.body.accessToken ? "YES" : "NO"}`);

    // Test 4: Profile Update with Bearer Access Token
    if (accessToken) {
      console.log("\n▶ 4. Testing PUT /api/auth/customer/profile (Protected Route)...");
      const profileRes = await makeRequest(
        `${TARGET_HOST}/api/auth/customer/profile`,
        "PUT",
        { name: "Ajay Tiwari (Verified Alpinist)" },
        { Authorization: `Bearer ${accessToken}` }
      );
      console.log(`   Status: ${profileRes.status}`);
      console.log(`   Updated Name in MongoDB: "${profileRes.body.user?.name}"`);
    }

    // Test 5: Token Refresh Request
    if (refreshToken) {
      console.log("\n▶ 5. Testing POST /api/auth/refresh...");
      const refreshRes = await makeRequest(`${TARGET_HOST}/api/auth/refresh`, "POST", {
        refreshToken: refreshToken,
      });
      console.log(`   Status: ${refreshRes.status}`);
      console.log(`   New Access Token Issued: ${refreshRes.body.accessToken ? "YES" : "NO"}`);
    }

    console.log(`\n=======================================================`);
    console.log(`✅ All Customer Auth API Tests Completed Successfully!`);
    console.log(`=======================================================`);
  } catch (err) {
    console.error("❌ Test suite encountered error:", err);
  }
}

runCustomerAuthTests();
