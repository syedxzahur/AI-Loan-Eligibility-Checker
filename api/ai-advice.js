/**
 * Serverless API Route: /api/ai-advice
 * Secure Anthropic Claude API proxy with BFSI compliance guardrails.
 */
const https = require('https');

const SYSTEM_PROMPT = `You are a certified BFSI Financial Decision-Support Assistant.
Your mission is to provide clear, educational, and responsible financial guidance to retail borrowers.

STRICT COMPLIANCE INSTRUCTIONS:
1. Provide educational financial guidance only. Explain the mechanics of compounding interest, Debt-to-Income (DTI / FOIR), and credit scores.
2. Clearly explain all assumptions.
3. Avoid claiming certainty. Always use probabilistic or educational language (e.g., "typically", "often", "indicative").
4. Avoid pretending to be a bank, lender, official financial advisor, or credit bureau.
5. Never guarantee loan approval, sanction, or specific interest rates.
6. Avoid fabricating financial data or interest figures.
7. Clearly identify when applicant information is insufficient for a comprehensive assessment.
8. Strongly encourage users to verify important borrowing decisions with qualified financial professionals or official financial institutions.
9. Format responses clearly with concise paragraphs and bullet points where appropriate. Keep answers focused and actionable under 250 words.`;

/**
 * Intelligent educational fallback when API key is not yet configured
 */
function getEducationalFallback(prompt, context) {
  var p = (prompt || '').toLowerCase();
  var loan = context && context.loan ? context.loan : null;

  if (p.includes('improve') || p.includes('eligibility')) {
    return `### Educational Strategies to Enhance Loan Eligibility:
1. **Optimize Debt-to-Income (FOIR):** Aim to keep total monthly loan obligations under 40%–50% of verifiable income. Prepaying smaller credit card balances or personal loans directly frees up borrowing capacity.
2. **Add a Co-Borrower:** Adding an employed spouse or parent with independent income pools total household earnings, significantly increasing the sanctioned loan ceiling.
3. **Opt for a Longer Tenure:** Extending tenure reduces monthly EMI, bringing the DTI ratio into an acceptable tier (though it increases total cumulative interest).
4. **Maintain Credit Health:** Rectify any erroneous credit bureau inquiries and maintain 100% on-time EMI repayments.

*(Note: Live Claude 3.5 responses will activate automatically when ANTHROPIC_API_KEY is configured in your environment variables.)*`;
  }

  if (p.includes('reduce') || p.includes('burden') || p.includes('emi')) {
    return `### Ways to Lessen Monthly EMI Obligations:
1. **Loan Balance Transfer:** Evaluate refinancing existing high-cost loans to lenders offering lower benchmark spreads.
2. **Partial Prepayments:** Direct annual bonuses or tax refunds toward principal prepayment; requesting the lender to lower the monthly EMI rather than reducing the tenure.
3. **Tenure Extension:** Request a loan restructuring with your lending institution to extend installment duration.
4. **Debt Consolidation:** Consolidate multiple revolving credit card balances (often 36%–42% p.a.) into a single lower-rate personal or top-up loan (11%–14% p.a.).

*(Note: Live Claude 3.5 responses will activate automatically when ANTHROPIC_API_KEY is configured in your environment variables.)*`;
  }

  if (p.includes('credit') || p.includes('score') || p.includes('profile')) {
    return `### Key Drivers of Your Credit Profile:
* **Payment History (35% Weight):** Consistent, uninterrupted on-time payments form the strongest pillar of your rating.
* **Credit Utilization (30% Weight):** Keep revolving card usage strictly below 30% of total sanctioned limits.
* **Credit Age (15% Weight):** Avoid closing older credit accounts, as average credit age demonstrates repayment longevity.
* **Inquiry Discipline (10% Weight):** Multiple hard loan inquiries in quick succession trigger risk alerts.

*(Note: Live Claude 3.5 responses will activate automatically when ANTHROPIC_API_KEY is configured in your environment variables.)*`;
  }

  // General or number analysis response
  var scenarioInfo = loan
    ? `For your current scenario with monthly income of ₹${Number(loan.income || 0).toLocaleString('en-IN')}, requested amount of ₹${Number(loan.desiredAmount || 0).toLocaleString('en-IN')}, and score of ${loan.creditScore}:`
    : 'Based on standard retail underwriting practices:';

  return `### Financial Advisory Perspective:
${scenarioInfo}
* **Affordability Rule:** Ensure your total living expenses plus proposed installments do not exceed 75% of net monthly earnings, leaving at least a 25% emergency liquidity reserve.
* **Interest Sensitivity:** Even a 0.5% rate reduction on a long-term loan saves substantial cumulative interest over the loan life cycle.
* **Verification:** Always verify processing fees, foreclosure charges, and official sanction terms directly with your prospective lending institution.

*(Note: Live Claude 3.5 responses will activate automatically when ANTHROPIC_API_KEY is configured in your environment variables.)*`;
}

module.exports = async function handler(req, res) {
  // CORS & Security Headers
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
      return res.end(JSON.stringify({ error: 'Invalid JSON body.' }));
    }
  }

  const prompt = body && body.prompt ? String(body.prompt).trim().slice(0, 1000) : '';
  const context = body && body.context ? body.context : {};

  if (!prompt) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Prompt is required.' }));
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // If no live Anthropic API key is configured, return the compliant educational fallback
  if (!apiKey || apiKey.includes('your_anthropic_api_key_here')) {
    const fallbackReply = getEducationalFallback(prompt, context);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      reply: fallbackReply,
      model: 'claude-3-5-sonnet-fallback',
      mode: 'educational_mode',
      isConfigured: false
    }));
  }

  // Prepare Claude API Request
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const userContent = [
    context && Object.keys(context).length > 0 ? `Current User Financial Context: ${JSON.stringify(context)}\n\n` : '',
    `User Question: ${prompt}`
  ].join('');

  const requestPayload = JSON.stringify({
    model: model,
    max_tokens: 600,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userContent }
    ]
  });

  const options = {
    hostname: 'api.anthropic.com',
    port: 443,
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(requestPayload)
    }
  };

  const anthropicReq = https.request(options, (anthropicRes) => {
    let data = '';
    anthropicRes.on('data', (chunk) => { data += chunk; });
    anthropicRes.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        if (anthropicRes.statusCode >= 200 && anthropicRes.statusCode < 300) {
          const replyText = parsed.content && parsed.content[0] ? parsed.content[0].text : '';
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            reply: replyText,
            model: model,
            mode: 'live'
          }));
        } else {
          // Log error internally without exposing keys
          console.error('Claude API Error status:', anthropicRes.statusCode);
          // Return fallback on provider error
          const fallback = getEducationalFallback(prompt, context);
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            reply: fallback,
            model: 'claude-fallback-on-error',
            mode: 'educational_fallback'
          }));
        }
      } catch (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({
          error: 'AI guidance is temporarily unavailable. Please try again later.'
        }));
      }
    });
  });

  anthropicReq.on('error', (err) => {
    console.error('Anthropic request network error');
    const fallback = getEducationalFallback(prompt, context);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      reply: fallback,
      model: 'claude-fallback-offline',
      mode: 'offline_fallback'
    }));
  });

  anthropicReq.write(requestPayload);
  anthropicReq.end();
};
