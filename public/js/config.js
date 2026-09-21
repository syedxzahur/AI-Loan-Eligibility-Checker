/**
 * AI Loan Eligibility Checker - Configuration & Constants
 */
window.APP_CONFIG = {
  appName: 'AI Loan Eligibility Checker',
  version: '1.0.0',
  apiBase: '/api',
  currency: {
    locale: 'en-IN',
    symbol: '₹',
    code: 'INR'
  },
  aiSuggestions: [
    'How can I improve my loan eligibility?',
    'How can I reduce my EMI burden?',
    'What factors may affect my credit profile?',
    'How much loan can I reasonably afford?',
    'How should I manage existing debt?'
  ],
  defaultValues: {
    loan: {
      fullName: 'Vikram Sharma',
      age: 32,
      monthlyIncome: 85000,
      employmentType: 'salaried',
      employmentDuration: 4.5,
      existingEMI: 12000,
      desiredLoanAmount: 2500000,
      loanTenureYears: 15,
      loanTenureMonths: 180,
      creditScore: 765,
      monthlyExpenses: 28000,
      existingLoansCount: 1
    },
    credit: {
      creditScore: 740,
      paymentHistory: 'on-time',
      creditUtilization: 24,
      activeLoans: 1,
      creditCards: 2,
      creditHistoryLength: 5,
      recentInquiries: 1
    },
    emi: {
      principal: 2000000,
      annualRate: 8.75,
      tenureYears: 10,
      tenureMonths: 120
    }
  },
  validationLimits: {
    age: { min: 21, max: 65 },
    income: { min: 10000, max: 50000000 },
    loanAmount: { min: 50000, max: 200000000 },
    tenureYears: { min: 1, max: 30 },
    tenureMonths: { min: 12, max: 360 },
    creditScore: { min: 300, max: 900 },
    interestRate: { min: 1.0, max: 36.0 },
    utilization: { min: 0, max: 100 }
  }
};
