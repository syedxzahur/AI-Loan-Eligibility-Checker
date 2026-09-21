/**
 * Test Suite: Form Validation Engine
 */
const assert = require('assert');
const AppValidation = require('../public/js/validation');

function run() {
  console.log('\n--- Testing AppValidation (validation.js) ---');
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

  const validSample = {
    fullName: 'Rahul Deshmukh',
    age: 30,
    employmentType: 'salaried',
    employmentDuration: 3,
    monthlyIncome: 75000,
    existingEMI: 10000,
    monthlyExpenses: 25000,
    creditScore: 750,
    desiredLoanAmount: 2000000,
    loanTenureMonths: 120,
    existingLoansCount: 1
  };

  test('Fully valid loan form payload passes validation', () => {
    const res = AppValidation.validateLoanForm(validSample);
    assert.strictEqual(res.isValid, true);
    assert.strictEqual(Object.keys(res.errors).length, 0);
  });

  test('Missing or single character name fails validation', () => {
    const res1 = AppValidation.validateLoanForm({ ...validSample, fullName: '' });
    assert.strictEqual(res1.isValid, false);
    assert.ok(res1.errors.fullName);

    const res2 = AppValidation.validateLoanForm({ ...validSample, fullName: 'A' });
    assert.strictEqual(res2.isValid, false);
    assert.ok(res2.errors.fullName);
  });

  test('Age boundaries enforced strictly (21 to 65)', () => {
    const underage = AppValidation.validateLoanForm({ ...validSample, age: 19 });
    assert.strictEqual(underage.isValid, false);
    assert.ok(underage.errors.age);

    const overage = AppValidation.validateLoanForm({ ...validSample, age: 70 });
    assert.strictEqual(overage.isValid, false);
    assert.ok(overage.errors.age);

    const minValid = AppValidation.validateLoanForm({ ...validSample, age: 21 });
    assert.strictEqual(minValid.isValid, true);

    const maxValid = AppValidation.validateLoanForm({ ...validSample, age: 65 });
    assert.strictEqual(maxValid.isValid, true);
  });

  test('Negative or zero income rejected', () => {
    const res = AppValidation.validateLoanForm({ ...validSample, monthlyIncome: -5000 });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.monthlyIncome);
  });

  test('Existing EMI cannot equal or exceed monthly income', () => {
    const res = AppValidation.validateLoanForm({
      ...validSample,
      monthlyIncome: 50000,
      existingEMI: 55000
    });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.existingEMI);
  });

  test('Credit score out of 300-900 range rejected', () => {
    const low = AppValidation.validateLoanForm({ ...validSample, creditScore: 250 });
    assert.strictEqual(low.isValid, false);
    assert.ok(low.errors.creditScore);

    const high = AppValidation.validateLoanForm({ ...validSample, creditScore: 950 });
    assert.strictEqual(high.isValid, false);
    assert.ok(high.errors.creditScore);
  });

  test('Credit analyzer validation catches invalid utilization', () => {
    const res = AppValidation.validateCreditForm({
      creditScore: 750,
      creditUtilization: 120, // Invalid >100%
      creditHistoryLength: 5,
      recentInquiries: 2
    });
    assert.strictEqual(res.isValid, false);
    assert.ok(res.errors.creditUtilization);
  });

  test('EMI input validator verifies principal, rate, and tenure', () => {
    const valid = AppValidation.validateEMIInputs(1000000, 8.5, 120);
    assert.strictEqual(valid.isValid, true);

    const invalidRate = AppValidation.validateEMIInputs(1000000, 45, 120);
    assert.strictEqual(invalidRate.isValid, false);
    assert.ok(invalidRate.errors.annualRate);
  });

  return { passed, failed };
}

module.exports = { run };
