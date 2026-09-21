/**
 * Serverless API Route: /api/health
 * Health check & environmental diagnostics.
 */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  const hasClaudeKey = !!(process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your_anthropic'));
  const hasGoogleSheets = !!(process.env.GOOGLE_SHEETS_WEBHOOK_URL || (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_SHEET_ID));
  const hasAdminToken = !!(process.env.RECORDS_ADMIN_TOKEN && !process.env.RECORDS_ADMIN_TOKEN.includes('generate_a_random'));

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: 'AI Loan Eligibility Checker (BFSI Engine)',
    services: {
      claudeAI: {
        configured: hasClaudeKey,
        mode: hasClaudeKey ? 'live' : 'educational_fallback',
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022'
      },
      googleSheets: {
        configured: hasGoogleSheets,
        mode: hasGoogleSheets ? 'live_sync' : 'session_buffer'
      },
      recordsAccessControl: {
        adminTokenActive: hasAdminToken
      }
    }
  }));
};
