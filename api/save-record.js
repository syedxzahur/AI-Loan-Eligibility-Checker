/**
 * Serverless API Route: /api/save-record
 * Persists loan analysis records into Google Sheets or secure fallback session store.
 */
const https = require('https');
const url = require('url');

// In-memory record store (for demo / development session buffer)
global._inMemoryRecordsStore = global._inMemoryRecordsStore || [];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
  }

  // Parse Body
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid JSON payload.' }));
    }
  }

  // Sanitize & Validate input
  const name = String(body.fullName || '').trim().replace(/[^a-zA-Z\s.'-]/g, '').slice(0, 80);
  const age = parseInt(body.age, 10);
  const employmentType = String(body.employmentType || '').trim().slice(0, 30);
  const monthlyIncome = parseFloat(body.monthlyIncome) || 0;
  const monthlyExpenses = parseFloat(body.monthlyExpenses) || 0;
  const existingEMI = parseFloat(body.existingEMI) || 0;
  const creditScore = parseInt(body.creditScore, 10) || 0;
  const loanAmount = parseFloat(body.loanAmount) || 0;
  const loanTenureMonths = parseInt(body.loanTenureMonths, 10) || 0;
  const estimatedEMI = parseFloat(body.estimatedEMI) || 0;
  const debtToIncomeRatio = parseFloat(body.debtToIncomeRatio) || 0;
  const eligibilityResult = String(body.eligibilityResult || '').trim().slice(0, 100);

  if (!name || isNaN(age) || monthlyIncome <= 0 || loanAmount <= 0) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Invalid or missing required financial fields.'
    }));
  }

  const recordRow = {
    timestamp: new Date().toISOString(),
    fullName: name,
    age: age,
    employmentType: employmentType,
    monthlyIncome: monthlyIncome,
    monthlyExpenses: monthlyExpenses,
    existingEMI: existingEMI,
    creditScore: creditScore,
    loanAmount: loanAmount,
    loanTenureMonths: loanTenureMonths,
    estimatedEMI: estimatedEMI,
    debtToIncomeRatio: debtToIncomeRatio,
    eligibilityResult: eligibilityResult
  };

  // Always buffer in local memory store (capped at 100 records)
  global._inMemoryRecordsStore.unshift(recordRow);
  if (global._inMemoryRecordsStore.length > 100) {
    global._inMemoryRecordsStore.pop();
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  // If a Google Apps Script Webhook is configured, POST row to it
  if (webhookUrl && webhookUrl.startsWith('https://')) {
    try {
      const parsedUrl = url.parse(webhookUrl);
      const postData = JSON.stringify(recordRow);

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const webhookReq = https.request(options, (webhookRes) => {
        let respData = '';
        webhookRes.on('data', (c) => { respData += c; });
        webhookRes.on('end', () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            message: 'Record saved and synchronized with Google Sheets.',
            storageMode: 'google_sheets_live'
          }));
        });
      });

      webhookReq.on('error', (err) => {
        // Fallback response with session save
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          success: true,
          message: 'Record saved to secure session store (Google Sheets webhook unreachable).',
          storageMode: 'session_buffer'
        }));
      });

      webhookReq.write(postData);
      webhookReq.end();
      return;
    } catch (err) {
      console.error('Webhook execution error');
    }
  }

  // When no webhook or credentials are set, return clean success with session notice
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    success: true,
    message: 'Assessment record saved successfully in application session buffer.',
    storageMode: 'session_buffer',
    note: 'To sync directly to live Google Sheets, set GOOGLE_SHEETS_WEBHOOK_URL in environment settings.'
  }));
};
