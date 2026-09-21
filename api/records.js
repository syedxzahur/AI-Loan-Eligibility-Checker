/**
 * Serverless API Route: /api/records
 * Protected summary query endpoint.
 * STRICT SECURITY: Never exposes private financial records publicly.
 */
global._inMemoryRecordsStore = global._inMemoryRecordsStore || [];

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed. Use GET.' }));
  }

  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const configuredAdminToken = process.env.RECORDS_ADMIN_TOKEN;

  // Strict check: token must match configured secret
  if (!configuredAdminToken || !token || token !== configuredAdminToken) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Unauthorized. Protected BFSI endpoint: Admin authentication token required to inspect stored records.',
      status: 401
    }));
  }

  // If authorized, return masked records to prevent full PII exposure
  const maskedRecords = global._inMemoryRecordsStore.map((r) => ({
    timestamp: r.timestamp,
    applicantMasked: r.fullName ? r.fullName.charAt(0) + '*** ' + (r.fullName.split(' ')[1] ? r.fullName.split(' ')[1].charAt(0) + '***' : '') : 'A***',
    age: r.age,
    employmentType: r.employmentType,
    loanAmount: r.loanAmount,
    estimatedEMI: r.estimatedEMI,
    debtToIncomeRatio: r.debtToIncomeRatio,
    eligibilityResult: r.eligibilityResult
  }));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    totalCount: maskedRecords.length,
    records: maskedRecords
  }));
};
