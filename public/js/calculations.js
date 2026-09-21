/**
 * AI Loan Eligibility Checker - Pure Financial Calculations Engine
 * Supports standard BFSI reducing balance EMI, FOIR / DTI, NDI,
 * heuristic loan eligibility modeling, and credit score profiling.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.FinancialEngine = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Calculate standard reducing balance EMI
   * Formula: EMI = [P x r x (1+r)^n] / [(1+r)^n - 1]
   */
  function calculateEMI(principal, annualRatePercent, tenureMonths) {
    var p = parseFloat(principal) || 0;
    var rate = parseFloat(annualRatePercent) || 0;
    var n = parseInt(tenureMonths, 10) || 0;

    if (p <= 0 || n <= 0) {
      return {
        monthlyEMI: 0,
        totalInterest: 0,
        totalRepayment: 0,
        principalAmount: p,
        principalPercent: 100,
        interestPercent: 0
      };
    }

    if (rate <= 0) {
      var flatEmi = Math.round(p / n);
      return {
        monthlyEMI: flatEmi,
        totalInterest: 0,
        totalRepayment: p,
        principalAmount: p,
        principalPercent: 100,
        interestPercent: 0
      };
    }

    var monthlyRate = rate / (12 * 100);
    var factor = Math.pow(1 + monthlyRate, n);
    var rawEmi = (p * monthlyRate * factor) / (factor - 1);
    var emi = Math.round(rawEmi);
    var totalRepayment = emi * n;
    var totalInterest = Math.max(0, totalRepayment - p);

    var principalPercent = (p / totalRepayment) * 100;
    var interestPercent = (totalInterest / totalRepayment) * 100;

    return {
      monthlyEMI: emi,
      totalInterest: Math.round(totalInterest),
      totalRepayment: Math.round(totalRepayment),
      principalAmount: Math.round(p),
      principalPercent: parseFloat(principalPercent.toFixed(1)),
      interestPercent: parseFloat(interestPercent.toFixed(1))
    };
  }

  /**
   * Calculate Fixed Obligation to Income Ratio (FOIR / DTI)
   */
  function calculateFOIR(existingEMI, proposedEMI, monthlyIncome) {
    var income = parseFloat(monthlyIncome) || 0;
    if (income <= 0) return 0;
    var totalEmi = (parseFloat(existingEMI) || 0) + (parseFloat(proposedEMI) || 0);
    return parseFloat(((totalEmi / income) * 100).toFixed(2));
  }

  /**
   * Calculate Net Disposable Income (NDI)
   */
  function calculateNDI(monthlyIncome, monthlyExpenses, existingEMI) {
    var income = parseFloat(monthlyIncome) || 0;
    var expenses = parseFloat(monthlyExpenses) || 0;
    var emi = parseFloat(existingEMI) || 0;
    return Math.round(income - expenses - emi);
  }

  /**
   * Estimate Benchmark Interest Rate based on Credit Score
   */
  function getBenchmarkRate(creditScore) {
    var score = parseInt(creditScore, 10) || 700;
    if (score >= 780) return 8.5;
    if (score >= 750) return 8.85;
    if (score >= 700) return 9.5;
    if (score >= 650) return 10.75;
    if (score >= 600) return 12.0;
    return 14.5;
  }

  /**
   * Evaluate comprehensive loan eligibility
   */
  function evaluateLoanEligibility(params) {
    var name = (params.fullName || 'Applicant').trim();
    var age = parseInt(params.age, 10) || 30;
    var income = parseFloat(params.monthlyIncome) || 0;
    var empType = params.employmentType || 'salaried';
    var empDuration = parseFloat(params.employmentDuration) || 2;
    var existingEMI = parseFloat(params.existingEMI) || 0;
    var desiredLoan = parseFloat(params.desiredLoanAmount) || 0;
    var tenureMonths = parseInt(params.loanTenureMonths, 10) || 60;
    var creditScore = parseInt(params.creditScore, 10) || 700;
    var expenses = parseFloat(params.monthlyExpenses) || 0;
    var existingLoansCount = parseInt(params.existingLoansCount, 10) || 0;

    var benchmarkRate = getBenchmarkRate(creditScore);
    var proposedEMIObj = calculateEMI(desiredLoan, benchmarkRate, tenureMonths);
    var proposedEMI = proposedEMIObj.monthlyEMI;

    // Determine max permissible FOIR by income tier
    var maxFOIRRatio = 0.40;
    if (income >= 150000) maxFOIRRatio = 0.55;
    else if (income >= 75000) maxFOIRRatio = 0.50;
    else if (income >= 35000) maxFOIRRatio = 0.45;

    // Adjustments for employment stability and credit score
    if (empType === 'business' || empType === 'self-employed') {
      if (empDuration >= 3) maxFOIRRatio += 0.02;
      else maxFOIRRatio -= 0.05;
    } else if (empType === 'freelancer' || empType === 'other') {
      maxFOIRRatio -= 0.05;
    }

    if (creditScore >= 750) maxFOIRRatio += 0.05;
    else if (creditScore < 650) maxFOIRRatio -= 0.08;

    maxFOIRRatio = Math.max(0.25, Math.min(0.60, maxFOIRRatio));

    var maxTotalPermissibleEMI = income * maxFOIRRatio;
    var maxAvailableEMI = Math.max(0, maxTotalPermissibleEMI - existingEMI);

    var ndi = calculateNDI(income, expenses, existingEMI);
    var ndiCappedEMI = ndi > 0 ? ndi * 0.75 : 0;
    var practicalMaxEMI = Math.min(maxAvailableEMI, ndiCappedEMI);

    var r = benchmarkRate / (12 * 100);
    var n = tenureMonths;
    var estimatedMaxLoan = 0;
    if (practicalMaxEMI > 0 && r > 0 && n > 0) {
      var factor = Math.pow(1 + r, n);
      estimatedMaxLoan = (practicalMaxEMI * (factor - 1)) / (r * factor);
    }
    estimatedMaxLoan = Math.max(0, Math.round(estimatedMaxLoan / 5000) * 5000);

    var actualDTI = calculateFOIR(existingEMI, proposedEMI, income);
    var emiToIncomeRatio = income > 0 ? parseFloat(((proposedEMI / income) * 100).toFixed(1)) : 0;

    var status = 'Review Required';
    var statusCategory = 'moderate';
    var statusMessage = '';
    var contributingFactors = [];

    var isAgeCompliant = age >= 21 && age <= 60;
    var hasHealthyScore = creditScore >= 680;
    var hasAdequateCapacity = estimatedMaxLoan >= desiredLoan;
    var isDTIHealthy = actualDTI <= (maxFOIRRatio * 100);

    if (hasAdequateCapacity && hasHealthyScore && isAgeCompliant && isDTIHealthy) {
      status = 'Likely Eligible';
      statusCategory = 'high';
      statusMessage = 'Your financial profile comfortably supports the requested borrowing obligation under standard retail underwriting guidelines.';
    } else if (estimatedMaxLoan >= desiredLoan * 0.70 && creditScore >= 620 && age >= 21 && age <= 65) {
      status = 'Review Required';
      statusCategory = 'moderate';
      statusMessage = 'Your application shows moderate viability. Lending institutions may require additional income documentation, a co-applicant, or lower tenure.';
    } else {
      status = 'Lower Eligibility';
      statusCategory = 'low';
      statusMessage = 'The estimated borrowing capacity is lower than the requested amount based on current debt obligations, income slab, or credit tier.';
    }

    if (creditScore >= 750) {
      contributingFactors.push({ type: 'positive', label: 'Strong Credit Score (' + creditScore + ') grants prime interest rates.' });
    } else if (creditScore < 650) {
      contributingFactors.push({ type: 'negative', label: 'Credit score below 650 indicates elevated risk and narrows lender appetite.' });
    }

    if (actualDTI <= 40) {
      contributingFactors.push({ type: 'positive', label: 'Healthy Debt-to-Income ratio (' + actualDTI + '%) leaves strong repayment cushion.' });
    } else if (actualDTI > 50) {
      contributingFactors.push({ type: 'negative', label: 'High DTI ratio (' + actualDTI + '%) exceeds preferred 40-50% threshold.' });
    }

    if (ndi > (income * 0.4)) {
      contributingFactors.push({ type: 'positive', label: 'Robust disposable surplus (₹' + ndi.toLocaleString('en-IN') + '/mo) protects against cashflow shocks.' });
    } else if (ndi <= 0) {
      contributingFactors.push({ type: 'negative', label: 'Monthly expenses and obligations match or exceed total earnings.' });
    }

    if (empDuration >= 3) {
      contributingFactors.push({ type: 'positive', label: 'Employment stability of ' + empDuration + ' years fulfills prime stability norms.' });
    } else {
      contributingFactors.push({ type: 'neutral', label: 'Employment history under 2 years may require added employer verification.' });
    }

    return {
      applicantName: name,
      status: status,
      statusCategory: statusCategory,
      statusMessage: statusMessage,
      estimatedEligibilityAmount: estimatedMaxLoan,
      desiredLoanAmount: desiredLoan,
      benchmarkRate: benchmarkRate,
      proposedEMI: proposedEMI,
      debtToIncomeRatio: actualDTI,
      maxAllowedFOIR: parseFloat((maxFOIRRatio * 100).toFixed(1)),
      disposableIncome: ndi,
      emiToIncomeRatio: emiToIncomeRatio,
      creditScore: creditScore,
      factors: contributingFactors,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Analyze Credit Profile across key bureau dimensions
   */
  function analyzeCreditProfile(data) {
    var score = parseInt(data.creditScore, 10) || 680;
    var paymentHistory = data.paymentHistory || 'on-time';
    var utilization = parseFloat(data.creditUtilization) || 28;
    var activeLoans = parseInt(data.activeLoans, 10) || 1;
    var creditCards = parseInt(data.creditCards, 10) || 2;
    var historyYears = parseFloat(data.creditHistoryLength) || 3;
    var recentInquiries = parseInt(data.recentInquiries, 10) || 0;

    var category = 'Good';
    var riskLevel = 'Low Risk';
    var badgeClass = 'badge-good';
    var scoreRangeLabel = '650–749';

    if (score >= 750) {
      category = 'Excellent';
      riskLevel = 'Minimal Risk';
      badgeClass = 'badge-excellent';
      scoreRangeLabel = '750–900';
    } else if (score >= 650) {
      category = 'Good';
      riskLevel = 'Low Risk';
      badgeClass = 'badge-good';
      scoreRangeLabel = '650–749';
    } else if (score >= 550) {
      category = 'Fair';
      riskLevel = 'Moderate Risk';
      badgeClass = 'badge-fair';
      scoreRangeLabel = '550–649';
    } else {
      category = 'Poor';
      riskLevel = 'Elevated Risk';
      badgeClass = 'badge-poor';
      scoreRangeLabel = '300–549';
    }

    var normalizedPercent = Math.min(100, Math.max(0, ((score - 300) / 600) * 100));

    var strengths = [];
    var attentionAreas = [];
    var recommendations = [];

    if (paymentHistory === 'on-time') {
      strengths.push('Flawless on-time payment track record (weighs ~35% of total score).');
    } else if (paymentHistory === 'minor-delays') {
      attentionAreas.push('Occasional late payments reported (30-60 days past due).');
      recommendations.push('Set up automated debit / e-mandates for all active credit cards and loans.');
    } else {
      attentionAreas.push('Significant payment defaults or settled accounts reported.');
      recommendations.push('Prioritize settling overdue loan tranches immediately to halt negative reporting.');
    }

    if (utilization <= 30) {
      strengths.push('Optimal credit utilization at ' + utilization + '% (well within safe <30% threshold).');
    } else if (utilization <= 50) {
      attentionAreas.push('Elevated credit card utilization at ' + utilization + '%.');
      recommendations.push('Target paying down card balances before statement generation to bring ratio under 30%.');
    } else {
      attentionAreas.push('High credit utilization (' + utilization + '%) signals credit overdependence.');
      recommendations.push('Request credit limit enhancement or pay revolving card dues mid-cycle.');
    }

    if (historyYears >= 5) {
      strengths.push('Mature credit footprint of ' + historyYears + ' years provides statistical stability.');
    } else {
      attentionAreas.push('Relatively young credit history (' + historyYears + ' years).');
      recommendations.push('Keep your oldest credit line open without closure to preserve average account age.');
    }

    if (recentInquiries <= 1) {
      strengths.push('Low hard inquiry activity in the past 6 months.');
    } else {
      attentionAreas.push('Multiple hard inquiries (' + recentInquiries + ') logged recently.');
      recommendations.push('Avoid applying to multiple lenders in short spans; space loan applications by 6 months.');
    }

    return {
      creditScore: score,
      category: category,
      riskLevel: riskLevel,
      badgeClass: badgeClass,
      scoreRangeLabel: scoreRangeLabel,
      scorePercent: Math.round(normalizedPercent),
      strengths: strengths,
      attentionAreas: attentionAreas,
      recommendations: recommendations,
      metrics: {
        paymentHistory: paymentHistory,
        utilization: utilization,
        activeLoans: activeLoans,
        creditCards: creditCards,
        historyYears: historyYears,
        recentInquiries: recentInquiries
      }
    };
  }

  return {
    calculateEMI: calculateEMI,
    calculateFOIR: calculateFOIR,
    calculateNDI: calculateNDI,
    getBenchmarkRate: getBenchmarkRate,
    evaluateLoanEligibility: evaluateLoanEligibility,
    analyzeCreditProfile: analyzeCreditProfile
  };
});
