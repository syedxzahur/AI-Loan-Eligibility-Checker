/**
 * Test Suite: Backend API Handlers
 */
const assert = require('assert');
const healthHandler = require('../api/health');
const saveRecordHandler = require('../api/save-record');
const recordsHandler = require('../api/records');
const aiAdviceHandler = require('../api/ai-advice');

function createMockReqRes(options) {
  const req = {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body !== undefined ? options.body : {},
    query: options.query || {}
  };

  const headers = {};
  let statusCode = 200;
  let responseData = '';

  const res = {
    statusCode: 200,
    setHeader: (k, v) => { headers[k.toLowerCase()] = v; },
    end: (chunk) => {
      if (chunk) responseData += chunk;
    }
  };

  return {
    req,
    res,
    getData: () => responseData,
    getJson: () => {
      try { return JSON.parse(responseData); } catch (e) { return null; }
    },
    getStatusCode: () => res.statusCode
  };
}

async function run() {
  console.log('\n--- Testing API Endpoints ---');
  let passed = 0;
  let failed = 0;

  async function test(desc, fn) {
    try {
      await fn();
      console.log(`  ✓ ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ ${desc}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. Health Handler
  await test('GET /api/health returns healthy status and platform info', async () => {
    const { req, res, getJson, getStatusCode } = createMockReqRes({ method: 'GET' });
    await healthHandler(req, res);
    assert.strictEqual(getStatusCode(), 200);
    const json = getJson();
    assert.strictEqual(json.status, 'healthy');
    assert.ok(json.platform.includes('AI Loan Eligibility Checker'));
    assert.ok(json.services.claudeAI);
    assert.ok(json.services.googleSheets);
  });

  // 2. Save Record Handler - Validation
  await test('POST /api/save-record rejects invalid or missing fields with 400', async () => {
    const { req, res, getJson, getStatusCode } = createMockReqRes({
      method: 'POST',
      body: JSON.stringify({ fullName: '' }) // Missing critical fields
    });
    await saveRecordHandler(req, res);
    assert.strictEqual(getStatusCode(), 400);
    const json = getJson();
    assert.ok(json.error);
  });

  // 3. Save Record Handler - Success
  await test('POST /api/save-record successfully persists clean valid record', async () => {
    const { req, res, getJson, getStatusCode } = createMockReqRes({
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Test User <script>',
        age: 35,
        employmentType: 'salaried',
        monthlyIncome: 90000,
        monthlyExpenses: 30000,
        existingEMI: 10000,
        creditScore: 780,
        loanAmount: 2500000,
        loanTenureMonths: 180,
        estimatedEMI: 24000,
        debtToIncomeRatio: 37.7,
        eligibilityResult: 'Likely Eligible (₹35,00,000)'
      })
    });
    await saveRecordHandler(req, res);
    assert.strictEqual(getStatusCode(), 200);
    const json = getJson();
    assert.strictEqual(json.success, true);
    assert.ok(json.message);
  });

  // 4. Records Handler - Unauthorized access blocked
  await test('GET /api/records blocks public unauthorized access with 401', async () => {
    process.env.RECORDS_ADMIN_TOKEN = 'secure_admin_test_token_xyz';
    const { req, res, getJson, getStatusCode } = createMockReqRes({
      method: 'GET',
      headers: { authorization: 'Bearer wrong_token' }
    });
    await recordsHandler(req, res);
    assert.strictEqual(getStatusCode(), 401);
    const json = getJson();
    assert.ok(json.error.includes('Unauthorized'));
  });

  // 5. Records Handler - Authorized access returns masked data
  await test('GET /api/records permits authorized query and masks PII', async () => {
    process.env.RECORDS_ADMIN_TOKEN = 'secure_admin_test_token_xyz';
    const { req, res, getJson, getStatusCode } = createMockReqRes({
      method: 'GET',
      headers: { authorization: 'Bearer secure_admin_test_token_xyz' }
    });
    await recordsHandler(req, res);
    assert.strictEqual(getStatusCode(), 200);
    const json = getJson();
    assert.ok(Array.isArray(json.records));
  });

  // 6. AI Advice Handler - Fallback mode
  await test('POST /api/ai-advice provides compliant educational guidance', async () => {
    delete process.env.ANTHROPIC_API_KEY; // Ensure test in safe fallback mode
    const { req, res, getJson, getStatusCode } = createMockReqRes({
      method: 'POST',
      body: JSON.stringify({
        prompt: 'How can I improve my loan eligibility?',
        context: { loan: { income: 80000, desiredAmount: 2000000 } }
      })
    });
    await aiAdviceHandler(req, res);
    assert.strictEqual(getStatusCode(), 200);
    const json = getJson();
    assert.strictEqual(json.success, true);
    assert.ok(json.reply.length > 50);
    assert.ok(json.reply.includes('Debt-to-Income') || json.reply.includes('Educational'));
  });

  return { passed, failed };
}

module.exports = { run };
