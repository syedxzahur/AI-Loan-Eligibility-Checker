/**
 * Test Suite: Financial Calculations Engine
 */
const assert = require('assert');
const FinancialEngine = require('../public/js/calculations');

function run() {
  console.log('--- Testing FinancialEngine (calculations.js) ---');
  let passed = 0;
  let failed = 0;

  function test(desc, fn) {
    try {
      fn();
      console.log(`  ✓ ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ✕ ${desc}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // 1. EMI Calculations
  test('Standard retail loan EMI (₹10,00,000 @ 9.5% for 60 months)', () => {
    const res = FinancialEngine.calculateEMI(1000000, 9.5, 60);
    // Expected EMI is ~₹21,002
    assert.strictEqual(res.monthlyEMI, 21002);
    assert.strictEqual(res.principalAmount, 1000000);
    assert.strictEqual(res.totalRepayment, 1260120);
    assert.strictEqual(res.totalInterest, 260120);
    assert.ok(res.principalPercent > 75 && res.principalPercent < 85);
  });

  test('0% interest flat rate calculation', () => {
    const res = FinancialEngine.calculateEMI(120000, 0, 12);
    assert.strictEqual(res.monthlyEMI, 10000);
    assert.strictEqual(res.totalInterest, 0);
    assert.strictEqual(res.principalPercent, 100);
  });

  test('Zero principal returns zero EMI safely', () => {
    const res = FinancialEngine.calculateEMI(0, 10, 12);
    assert.strictEqual(res.monthlyEMI, 0);
    assert.strictEqual(res.totalRepayment, 0);
  });

  // 2. FOIR / DTI
  test('FOIR / DTI percentage calculation', () => {
    const dti = FinancialEngine.calculateFOIR(15000, 25000, 100000);
    assert.strictEqual(dti, 40.0);
  });

  test('FOIR handles zero income without throwing division by zero', () => {
    const dti = FinancialEngine.calculateFOIR(10000, 10000, 0);
    assert.strictEqual(dti, 0);
  });

  // 3. Net Disposable Income (NDI)
  test('NDI correctly subtracts expenses and obligations', () => {
    const ndi = FinancialEngine.calculateNDI(100000, 30000, 20000);
    assert.strictEqual(ndi, 50000);
  });

  // 4. Benchmark Rate Mapping
  test('Benchmark rates properly scale with credit score', () => {
    assert.strictEqual(FinancialEngine.getBenchmarkRate(800), 8.5);
    assert.strictEqual(FinancialEngine.getBenchmarkRate(750), 8.85);
    assert.strictEqual(FinancialEngine.getBenchmarkRate(710), 9.5);
    assert.strictEqual(FinancialEngine.getBenchmarkRate(670), 10.75);
    assert.strictEqual(FinancialEngine.getBenchmarkRate(610), 12.0);
    assert.strictEqual(FinancialEngine.getBenchmarkRate(520), 14.5);
  });

  // 5. Loan Eligibility Evaluation
  test('High-income, prime credit profile results in Likely Eligible', () => {
    const res = FinancialEngine.evaluateLoanEligibility({
      fullName: 'Ananya Roy',
      age: 32,
      monthlyIncome: 180000,
      employmentType: 'salaried',
      employmentDuration: 5,
      existingEMI: 10000,
      monthlyExpenses: 40000,
      creditScore: 785,
      desiredLoanAmount: 2000000,
      loanTenureMonths: 180
    });
    assert.strictEqual(res.status, 'Likely Eligible');
    assert.strictEqual(res.statusCategory, 'high');
    assert.ok(res.estimatedEligibilityAmount >= 2000000);
    assert.ok(res.debtToIncomeRatio < 50);
  });

  test('Over-leveraged applicant results in Lower Eligibility', () => {
    const res = FinancialEngine.evaluateLoanEligibility({
      fullName: 'Ramesh Patel',
      age: 45,
      monthlyIncome: 35000,
      employmentType: 'salaried',
      employmentDuration: 2,
      existingEMI: 15000,
      monthlyExpenses: 18000,
      creditScore: 590,
      desiredLoanAmount: 5000000,
      loanTenureMonths: 60
    });
    assert.strictEqual(res.status, 'Lower Eligibility');
    assert.strictEqual(res.statusCategory, 'low');
  });

  // 6. Credit Profile Analyzer
  test('Credit score 780 classified as Excellent with minimal risk', () => {
    const analysis = FinancialEngine.analyzeCreditProfile({
      creditScore: 780,
      paymentHistory: 'on-time',
      creditUtilization: 20,
      creditHistoryLength: 6,
      activeLoans: 1,
      creditCards: 2,
      recentInquiries: 0
    });
    assert.strictEqual(analysis.category, 'Excellent');
    assert.strictEqual(analysis.riskLevel, 'Minimal Risk');
    assert.strictEqual(analysis.badgeClass, 'badge-excellent');
    assert.ok(analysis.strengths.length > 0);
  });

  test('Credit score 520 classified as Poor with attention areas', () => {
    const analysis = FinancialEngine.analyzeCreditProfile({
      creditScore: 520,
      paymentHistory: 'defaults',
      creditUtilization: 75,
      creditHistoryLength: 2,
      activeLoans: 3,
      creditCards: 4,
      recentInquiries: 5
    });
    assert.strictEqual(analysis.category, 'Poor');
    assert.strictEqual(analysis.riskLevel, 'Elevated Risk');
    assert.strictEqual(analysis.badgeClass, 'badge-poor');
    assert.ok(analysis.attentionAreas.length > 0);
  });

  return { passed, failed };
}

module.exports = { run };
