/**
 * AI Loan Eligibility Checker - Validation Engine
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppValidation = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LIMITS = {
    age: { min: 21, max: 65 },
    income: { min: 10000, max: 50000000 },
    loanAmount: { min: 50000, max: 200000000 },
    tenureYears: { min: 1, max: 30 },
    tenureMonths: { min: 12, max: 360 },
    creditScore: { min: 300, max: 900 },
    interestRate: { min: 1.0, max: 36.0 },
    utilization: { min: 0, max: 100 }
  };

  /**
   * Validate Loan Eligibility Form fields
   */
  function validateLoanForm(data) {
    var errors = {};

    // Full Name
    var name = (data.fullName || '').trim();
    if (!name) {
      errors.fullName = 'Full Name is required.';
    } else if (name.length < 2) {
      errors.fullName = 'Name must be at least 2 characters long.';
    } else if (!/^[a-zA-Z\s.'-]+$/.test(name)) {
      errors.fullName = 'Name can only contain letters and standard punctuation.';
    }

    // Age
    var age = parseInt(data.age, 10);
    if (isNaN(age)) {
      errors.age = 'Age is required.';
    } else if (age < LIMITS.age.min || age > LIMITS.age.max) {
      errors.age = 'Applicant age must be between ' + LIMITS.age.min + ' and ' + LIMITS.age.max + ' years.';
    }

    // Monthly Income
    var income = parseFloat(data.monthlyIncome);
    if (isNaN(income) || income <= 0) {
      errors.monthlyIncome = 'Monthly income must be a positive number.';
    } else if (income < LIMITS.income.min) {
      errors.monthlyIncome = 'Minimum monthly income is ₹' + LIMITS.income.min.toLocaleString('en-IN') + '.';
    }

    // Employment Type
    var validEmp = ['salaried', 'self-employed', 'business', 'freelancer', 'other'];
    if (!data.employmentType || validEmp.indexOf(data.employmentType.toLowerCase()) === -1) {
      errors.employmentType = 'Please select a valid employment type.';
    }

    // Employment Duration
    var duration = parseFloat(data.employmentDuration);
    if (isNaN(duration) || duration < 0) {
      errors.employmentDuration = 'Employment duration must be 0 or more years.';
    } else if (duration > 50) {
      errors.employmentDuration = 'Please enter a realistic employment duration.';
    }

    // Existing EMI
    var existingEMI = parseFloat(data.existingEMI);
    if (isNaN(existingEMI) || existingEMI < 0) {
      errors.existingEMI = 'Existing monthly EMI cannot be negative.';
    } else if (!isNaN(income) && existingEMI >= income) {
      errors.existingEMI = 'Existing EMI cannot equal or exceed your total monthly income.';
    }

    // Desired Loan Amount
    var loanAmount = parseFloat(data.desiredLoanAmount);
    if (isNaN(loanAmount) || loanAmount <= 0) {
      errors.desiredLoanAmount = 'Desired loan amount must be greater than zero.';
    } else if (loanAmount < LIMITS.loanAmount.min) {
      errors.desiredLoanAmount = 'Minimum loan amount is ₹' + LIMITS.loanAmount.min.toLocaleString('en-IN') + '.';
    }

    // Loan Tenure
    var tenure = parseInt(data.loanTenureMonths, 10);
    if (isNaN(tenure) || tenure < LIMITS.tenureMonths.min || tenure > LIMITS.tenureMonths.max) {
      errors.loanTenureMonths = 'Loan tenure must be between 1 and 30 years (12–360 months).';
    }

    // Credit Score
    var score = parseInt(data.creditScore, 10);
    if (isNaN(score)) {
      errors.creditScore = 'Credit score is required.';
    } else if (score < LIMITS.creditScore.min || score > LIMITS.creditScore.max) {
      errors.creditScore = 'Credit score must be within the standard bureau range (300–900).';
    }

    // Monthly Expenses
    var expenses = parseFloat(data.monthlyExpenses);
    if (isNaN(expenses) || expenses < 0) {
      errors.monthlyExpenses = 'Monthly expenses cannot be negative.';
    } else if (!isNaN(income) && expenses >= income) {
      errors.monthlyExpenses = 'Living expenses cannot exceed total monthly income.';
    }

    // Existing Loans Count
    var loansCount = parseInt(data.existingLoansCount, 10);
    if (isNaN(loansCount) || loansCount < 0) {
      errors.existingLoansCount = 'Existing active loans must be 0 or more.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Validate Credit Score Analyzer form
   */
  function validateCreditForm(data) {
    var errors = {};

    var score = parseInt(data.creditScore, 10);
    if (isNaN(score) || score < 300 || score > 900) {
      errors.creditScore = 'Credit score must be between 300 and 900.';
    }

    var util = parseFloat(data.creditUtilization);
    if (isNaN(util) || util < 0 || util > 100) {
      errors.creditUtilization = 'Credit utilization ratio must be between 0% and 100%.';
    }

    var history = parseFloat(data.creditHistoryLength);
    if (isNaN(history) || history < 0 || history > 50) {
      errors.creditHistoryLength = 'Credit history length must be between 0 and 50 years.';
    }

    var inquiries = parseInt(data.recentInquiries, 10);
    if (isNaN(inquiries) || inquiries < 0) {
      errors.recentInquiries = 'Recent inquiries must be 0 or positive.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Validate EMI inputs
   */
  function validateEMIInputs(principal, annualRate, tenureMonths) {
    var errors = {};

    var p = parseFloat(principal);
    if (isNaN(p) || p <= 0) {
      errors.principal = 'Loan amount must be greater than zero.';
    }

    var r = parseFloat(annualRate);
    if (isNaN(r) || r < LIMITS.interestRate.min || r > LIMITS.interestRate.max) {
      errors.annualRate = 'Interest rate must be between ' + LIMITS.interestRate.min + '% and ' + LIMITS.interestRate.max + '%.';
    }

    var n = parseInt(tenureMonths, 10);
    if (isNaN(n) || n < LIMITS.tenureMonths.min || n > LIMITS.tenureMonths.max) {
      errors.tenure = 'Tenure must be between 12 and 360 months.';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors: errors
    };
  }

  /**
   * Render inline error messages in the DOM
   */
  function displayErrors(formElement, errors) {
    if (!formElement) return;
    
    // Clear existing error messages
    var existingErrorEls = formElement.querySelectorAll('.field-error-msg');
    for (var i = 0; i < existingErrorEls.length; i++) {
      existingErrorEls[i].remove();
    }
    var inputsWithErrors = formElement.querySelectorAll('.input-error');
    for (var j = 0; j < inputsWithErrors.length; j++) {
      inputsWithErrors[j].classList.remove('input-error');
    }

    // Attach new error messages
    Object.keys(errors).forEach(function (fieldName) {
      var field = formElement.querySelector('[name="' + fieldName + '"]') || document.getElementById(fieldName);
      if (field) {
        field.classList.add('input-error');
        var errSpan = document.createElement('span');
        errSpan.className = 'field-error-msg animate-fade-in';
        errSpan.textContent = errors[fieldName];
        
        var wrapper = field.closest('.form-group') || field.parentNode;
        wrapper.appendChild(errSpan);
      }
    });
  }

  /**
   * Clear all errors on a form
   */
  function clearErrors(formElement) {
    if (!formElement) return;
    var existingErrorEls = formElement.querySelectorAll('.field-error-msg');
    for (var i = 0; i < existingErrorEls.length; i++) {
      existingErrorEls[i].remove();
    }
    var inputsWithErrors = formElement.querySelectorAll('.input-error');
    for (var j = 0; j < inputsWithErrors.length; j++) {
      inputsWithErrors[j].classList.remove('input-error');
    }
  }

  return {
    LIMITS: LIMITS,
    validateLoanForm: validateLoanForm,
    validateCreditForm: validateCreditForm,
    validateEMIInputs: validateEMIInputs,
    displayErrors: displayErrors,
    clearErrors: clearErrors
  };
});
