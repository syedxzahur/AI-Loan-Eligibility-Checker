/**
 * Master Automated Test Runner
 */
const calculationsTest = require('./calculations.test');
const validationTest = require('./validation.test');
const apiTest = require('./api.test');

async function main() {
  console.log('====================================================');
  console.log('🧪 Starting AI Loan Eligibility Checker Test Suite');
  console.log('====================================================');

  const start = Date.now();
  let totalPassed = 0;
  let totalFailed = 0;

  // 1. Calculations Engine
  const calcRes = calculationsTest.run();
  totalPassed += calcRes.passed;
  totalFailed += calcRes.failed;

  // 2. Validation Suite
  const valRes = validationTest.run();
  totalPassed += valRes.passed;
  totalFailed += valRes.failed;

  // 3. API Suite
  const apiRes = await apiTest.run();
  totalPassed += apiRes.passed;
  totalFailed += apiRes.failed;

  const duration = Date.now() - start;

  console.log('\n====================================================');
  console.log(`📊 Test Results: ${totalPassed} Passed, ${totalFailed} Failed (${duration}ms)`);
  console.log('====================================================');

  if (totalFailed > 0) {
    console.error('❌ Test suite failed with errors.');
    process.exit(1);
  } else {
    console.log('✅ All unit and API tests passed successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
