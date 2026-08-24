#!/usr/bin/env node

/**
 * Retail CRM Desktop — End-to-End Smoke Test
 * 
 * Verifies core functionality without external dependencies:
 * 1. MySQL connection connectivity
 * 2. Backend health check (HTTP connectivity)
 * 3. Super Admin / Admin login and JWT acquisition
 * 4. Protected endpoint access (Dashboard stats)
 * 5. Product creation with auto-generated SKU
 * 6. Product catalog listing & verification
 * 7. Clean up: delete test product
 * 
 * Usage:
 *   node smoke-test.js
 *   API_URL=http://127.0.0.1:3001/api ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=secret node smoke-test.js
 */

const http = require('http');
const https = require('https');
const net = require('net');
const { URL } = require('url');

// Configuration
const API_URL = (process.env.API_URL || 'http://127.0.0.1:3001/api').replace(/\/+$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@retailcrm.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123456!';
const MYSQL_HOST = process.env.MYSQL_HOST || '127.0.0.1';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306', 10);

// ANSI Colors for Terminal Output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const symbols = {
  pass: `${colors.green}✔${colors.reset}`,
  fail: `${colors.red}✖${colors.reset}`,
  info: `${colors.cyan}ℹ${colors.reset}`,
  arrow: `${colors.dim}→${colors.reset}`,
};

let testsPassed = 0;
let testsFailed = 0;
const totalTests = 7;

/**
 * Low-level HTTP/HTTPS Request Helper (Zero npm dependencies)
 */
function makeRequest(targetUrl, options = {}, bodyData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(targetUrl);
    const transport = parsedUrl.protocol === 'https:' ? https : http;

    const requestOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...options.headers,
      },
      timeout: options.timeout || 10000,
    };

    let serializedBody = null;
    if (bodyData !== null) {
      serializedBody = typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData);
      requestOptions.headers['Content-Type'] = 'application/json';
      requestOptions.headers['Content-Length'] = Buffer.byteLength(serializedBody);
    }

    const req = transport.request(requestOptions, (res) => {
      let rawData = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let parsedJson = null;
        try {
          if (rawData.trim()) {
            parsedJson = JSON.parse(rawData);
          }
        } catch (_) {
          parsedJson = null;
        }

        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: rawData,
          json: parsedJson,
        });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out after ${requestOptions.timeout}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (serializedBody) {
      req.write(serializedBody);
    }
    req.end();
  });
}

/**
 * Check TCP Socket Connectivity (e.g. MySQL Port)
 */
function checkTcpPort(host, port, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`Connection to ${host}:${port} timed out after ${timeoutMs}ms`));
    });

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.connect(port, host);
  });
}

function printHeader() {
  console.log('\n' + colors.bright + '===================================================' + colors.reset);
  console.log(colors.cyan + colors.bright + '      Retail CRM Desktop — Smoke Test Suite' + colors.reset);
  console.log(colors.bright + '===================================================' + colors.reset);
  console.log(`${symbols.info} Target API:      ${colors.bright}${API_URL}${colors.reset}`);
  console.log(`${symbols.info} Admin Email:     ${colors.bright}${ADMIN_EMAIL}${colors.reset}`);
  console.log(`${symbols.info} MySQL Target:    ${colors.bright}${MYSQL_HOST}:${MYSQL_PORT}${colors.reset}`);
  console.log('---------------------------------------------------\n');
}

async function runSmokeTests() {
  printHeader();

  let authToken = null;
  let createdProductId = null;
  let testCategoryId = null;

  // -------------------------------------------------------------
  // Test 1: Check MySQL connectivity
  // -------------------------------------------------------------
  process.stdout.write(`1. Testing MySQL Connectivity (${MYSQL_HOST}:${MYSQL_PORT})... `);
  try {
    await checkTcpPort(MYSQL_HOST, MYSQL_PORT, 4000);
    console.log(`${symbols.pass} ${colors.green}MySQL is listening and reachable${colors.reset}`);
    testsPassed++;
  } catch (err) {
    console.log(`${symbols.fail} ${colors.red}MySQL connection failed: ${err.message}${colors.reset}`);
    testsFailed++;
  }

  // -------------------------------------------------------------
  // Test 2: Check backend health
  // -------------------------------------------------------------
  process.stdout.write(`2. Testing Backend Health (${API_URL})... `);
  try {
    const res = await makeRequest(API_URL);
    // Any valid HTTP response (even 200, 404, or 403) confirms the backend server is running
    if (res.statusCode >= 200 && res.statusCode < 500) {
      console.log(`${symbols.pass} ${colors.green}Backend is responsive (HTTP ${res.statusCode})${colors.reset}`);
      testsPassed++;
    } else {
      console.log(`${symbols.fail} ${colors.red}Backend returned error status HTTP ${res.statusCode}${colors.reset}`);
      testsFailed++;
    }
  } catch (err) {
    console.log(`${symbols.fail} ${colors.red}Backend connection failed: ${err.message}${colors.reset}`);
    testsFailed++;
  }

  // -------------------------------------------------------------
  // Test 3: Login with admin credentials
  // -------------------------------------------------------------
  process.stdout.write(`3. Testing Admin Login (${ADMIN_EMAIL})... `);
  try {
    const loginRes = await makeRequest(`${API_URL}/auth/login`, {
      method: 'POST',
    }, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (loginRes.statusCode === 200 && loginRes.json && loginRes.json.access_token) {
      authToken = loginRes.json.access_token;
      const userRole = loginRes.json.user?.role || 'Authenticated';
      console.log(`${symbols.pass} ${colors.green}Login successful (Role: ${userRole}, JWT received)${colors.reset}`);
      testsPassed++;
    } else {
      const errMsg = loginRes.json?.message || loginRes.statusMessage || `Status ${loginRes.statusCode}`;
      console.log(`${symbols.fail} ${colors.red}Login failed: ${errMsg}${colors.reset}`);
      testsFailed++;
    }
  } catch (err) {
    console.log(`${symbols.fail} ${colors.red}Login request error: ${err.message}${colors.reset}`);
    testsFailed++;
  }

  // -------------------------------------------------------------
  // Test 4: Get dashboard stats (authenticated)
  // -------------------------------------------------------------
  process.stdout.write(`4. Testing Dashboard Stats (GET /dashboard/stats)... `);
  if (!authToken) {
    console.log(`${symbols.fail} ${colors.yellow}Skipped (Requires valid auth token from Step 3)${colors.reset}`);
    testsFailed++;
  } else {
    try {
      const statsRes = await makeRequest(`${API_URL}/dashboard/stats`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (statsRes.statusCode === 200 && statsRes.json) {
        console.log(`${symbols.pass} ${colors.green}Dashboard stats retrieved successfully${colors.reset}`);
        testsPassed++;
      } else {
        const errMsg = statsRes.json?.message || `Status ${statsRes.statusCode}`;
        console.log(`${symbols.fail} ${colors.red}Failed to retrieve stats: ${errMsg}${colors.reset}`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`${symbols.fail} ${colors.red}Dashboard stats request error: ${err.message}${colors.reset}`);
      testsFailed++;
    }
  }

  // -------------------------------------------------------------
  // Test 5: Create a test product
  // -------------------------------------------------------------
  process.stdout.write(`5. Testing Product Creation (POST /products)... `);
  if (!authToken) {
    console.log(`${symbols.fail} ${colors.yellow}Skipped (Requires auth token)${colors.reset}`);
    testsFailed++;
  } else {
    try {
      // Find or create a category first to satisfy categoryId requirement
      const catRes = await makeRequest(`${API_URL}/products/categories`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (catRes.statusCode === 200 && Array.isArray(catRes.json) && catRes.json.length > 0) {
        testCategoryId = catRes.json[0].id;
      } else {
        // Create a default category
        const newCatRes = await makeRequest(`${API_URL}/products/categories`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
        }, { name: `SmokeTest-${Date.now()}` });

        if (newCatRes.statusCode === 201 || newCatRes.statusCode === 200) {
          testCategoryId = newCatRes.json.id;
        }
      }

      if (!testCategoryId) {
        throw new Error('Unable to resolve a product category for creation');
      }

      // Create product with auto-generated SKU
      const productPayload = {
        name: `Smoke Test Product ${Date.now()}`,
        categoryId: testCategoryId,
        costPrice: 5.00,
        sellingPrice: 10.00,
        quantity: 100,
        minStock: 5,
        description: 'Temporary item created during automated smoke testing',
      };

      const createRes = await makeRequest(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` },
      }, productPayload);

      if ((createRes.statusCode === 201 || createRes.statusCode === 200) && createRes.json && createRes.json.id) {
        createdProductId = createRes.json.id;
        const generatedSku = createRes.json.sku || 'N/A';
        console.log(`${symbols.pass} ${colors.green}Product created (ID: ${createdProductId}, SKU: ${generatedSku})${colors.reset}`);
        testsPassed++;
      } else {
        const errMsg = createRes.json?.message || `Status ${createRes.statusCode}`;
        console.log(`${symbols.fail} ${colors.red}Product creation failed: ${errMsg}${colors.reset}`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`${symbols.fail} ${colors.red}Product creation error: ${err.message}${colors.reset}`);
      testsFailed++;
    }
  }

  // -------------------------------------------------------------
  // Test 6: List products & verify created product exists
  // -------------------------------------------------------------
  process.stdout.write(`6. Testing Product Listing & Verification (GET /products)... `);
  if (!authToken || !createdProductId) {
    console.log(`${symbols.fail} ${colors.yellow}Skipped (Requires created product from Step 5)${colors.reset}`);
    testsFailed++;
  } else {
    try {
      const listRes = await makeRequest(`${API_URL}/products?limit=100`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (listRes.statusCode === 200 && listRes.json) {
        const productList = Array.isArray(listRes.json) ? listRes.json : (listRes.json.data || []);
        const exists = productList.some(p => p.id === createdProductId);

        if (exists) {
          console.log(`${symbols.pass} ${colors.green}Test product confirmed in catalog listing${colors.reset}`);
          testsPassed++;
        } else {
          console.log(`${symbols.fail} ${colors.red}Created product ID ${createdProductId} was not found in listing${colors.reset}`);
          testsFailed++;
        }
      } else {
        const errMsg = listRes.json?.message || `Status ${listRes.statusCode}`;
        console.log(`${symbols.fail} ${colors.red}Failed to list products: ${errMsg}${colors.reset}`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`${symbols.fail} ${colors.red}Product listing error: ${err.message}${colors.reset}`);
      testsFailed++;
    }
  }

  // -------------------------------------------------------------
  // Test 7: Clean up (Delete test product)
  // -------------------------------------------------------------
  process.stdout.write(`7. Testing Cleanup & Product Deletion (DELETE /products/:id)... `);
  if (!authToken || !createdProductId) {
    console.log(`${symbols.fail} ${colors.yellow}Skipped (No product to delete)${colors.reset}`);
    testsFailed++;
  } else {
    try {
      const delRes = await makeRequest(`${API_URL}/products/${createdProductId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authToken}` },
      });

      if (delRes.statusCode === 200 || delRes.statusCode === 204) {
        console.log(`${symbols.pass} ${colors.green}Test product cleaned up successfully${colors.reset}`);
        testsPassed++;
      } else {
        const errMsg = delRes.json?.message || `Status ${delRes.statusCode}`;
        console.log(`${symbols.fail} ${colors.red}Cleanup failed: ${errMsg}${colors.reset}`);
        testsFailed++;
      }
    } catch (err) {
      console.log(`${symbols.fail} ${colors.red}Cleanup error: ${err.message}${colors.reset}`);
      testsFailed++;
    }
  }

  // -------------------------------------------------------------
  // Summary Report
  // -------------------------------------------------------------
  console.log('\n---------------------------------------------------');
  const allPassed = testsPassed === totalTests && testsFailed === 0;
  if (allPassed) {
    console.log(colors.green + colors.bright + `RESULTS: ${testsPassed}/${totalTests} Tests Passed! All systems operational.` + colors.reset);
  } else {
    console.log(colors.red + colors.bright + `RESULTS: ${testsPassed}/${totalTests} Tests Passed, ${testsFailed} Failed.` + colors.reset);
  }
  console.log('---------------------------------------------------\n');

  process.exit(allPassed ? 0 : 1);
}

// Execute tests
runSmokeTests().catch((err) => {
  console.error('\n' + colors.red + colors.bright + 'Fatal smoke test failure:' + colors.reset, err);
  process.exit(1);
});
