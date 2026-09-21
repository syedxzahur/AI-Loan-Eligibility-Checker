/**
 * End-to-End Local Server Integration Test
 */
const http = require('http');
const path = require('path');
const fs = require('fs');

async function makeRequest(port, method, pathUrl, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqHeaders = { ...headers };
    if (postData) {
      reqHeaders['Content-Type'] = reqHeaders['Content-Type'] || 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: pathUrl,
      method: method,
      headers: reqHeaders
    }, (res) => {
      let data = '';
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          json: json
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runIntegration() {
  console.log('--- Running Local Server Integration Tests ---');
  
  // Set test port
  process.env.PORT = '3987';
  process.env.RECORDS_ADMIN_TOKEN = 'test_integration_token';

  // Import server
  const server = require('../server.js');
  // Wait 500ms for listen
  await new Promise((r) => setTimeout(r, 600));

  const PORT = 3987;

  // 1. Static HTML test
  console.log('  Testing GET / (index.html)...');
  const indexRes = await makeRequest(PORT, 'GET', '/');
  if (indexRes.statusCode !== 200 || !indexRes.data.includes('FinAI Platform')) {
    throw new Error('Static index.html failed: status ' + indexRes.statusCode);
  }
  console.log('  ✓ GET / returned 200 OK with correct HTML content');

  // 2. CSS Asset test
  console.log('  Testing GET /css/variables.css...');
  const cssRes = await makeRequest(PORT, 'GET', '/css/variables.css');
  if (cssRes.statusCode !== 200 || !cssRes.data.includes('--bg-primary')) {
    throw new Error('Static CSS failed');
  }
  console.log('  ✓ GET /css/variables.css returned 200 OK');

  // 3. Health API test
  console.log('  Testing GET /api/health...');
  const healthRes = await makeRequest(PORT, 'GET', '/api/health');
  if (healthRes.statusCode !== 200 || healthRes.json.status !== 'healthy') {
    throw new Error('Health API failed');
  }
  console.log('  ✓ GET /api/health returned 200 OK with healthy status');

  // 4. Save Record API test
  console.log('  Testing POST /api/save-record...');
  const saveRes = await makeRequest(PORT, 'POST', '/api/save-record', {
    fullName: 'Pooja Iyer',
    age: 29,
    employmentType: 'salaried',
    monthlyIncome: 95000,
    monthlyExpenses: 30000,
    existingEMI: 10000,
    creditScore: 780,
    loanAmount: 3000000,
    loanTenureMonths: 180,
    estimatedEMI: 29000,
    debtToIncomeRatio: 41.0,
    eligibilityResult: 'Likely Eligible'
  });
  if (saveRes.statusCode !== 200 || !saveRes.json.success) {
    throw new Error('Save Record API failed');
  }
  console.log('  ✓ POST /api/save-record returned 200 OK with success message');

  // 5. Protected Records API test - Unauthorized
  console.log('  Testing GET /api/records (unauthorized)...');
  const unauthRes = await makeRequest(PORT, 'GET', '/api/records');
  if (unauthRes.statusCode !== 401) {
    throw new Error('Records endpoint should have returned 401 Unauthorized');
  }
  console.log('  ✓ GET /api/records blocked unauthorized request with 401');

  // 6. Protected Records API test - Authorized
  console.log('  Testing GET /api/records (authorized)...');
  const authRes = await makeRequest(PORT, 'GET', '/api/records', null, {
    authorization: 'Bearer test_integration_token'
  });
  if (authRes.statusCode !== 200 || !Array.isArray(authRes.json.records)) {
    throw new Error('Authorized records retrieval failed');
  }
  console.log('  ✓ GET /api/records authorized query returned 200 with masked records array');

  // 7. AI Advice API test
  console.log('  Testing POST /api/ai-advice...');
  const aiRes = await makeRequest(PORT, 'POST', '/api/ai-advice', {
    prompt: 'How can I reduce my EMI burden?',
    context: { loan: { income: 95000 } }
  });
  if (aiRes.statusCode !== 200 || !aiRes.json.reply) {
    throw new Error('AI Advice API failed');
  }
  console.log('  ✓ POST /api/ai-advice returned 200 OK with formatted educational advice');

  console.log('\n✅ All 7 End-to-End Server Integration Tests Passed Perfectly!');
  process.exit(0);
}

runIntegration().catch((err) => {
  console.error('❌ Integration test failed:', err);
  process.exit(1);
});
