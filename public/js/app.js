/**
 * AI Loan Eligibility Checker - Master Frontend Coordinator
 * Manages SPA Routing, Real-Time Sliders, Form Submissions, Charts & AI Chat.
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  // Global State
  var state = {
    currentView: 'dashboard',
    lastLoanResult: null,
    lastCreditResult: null,
    lastEMIResult: null,
    emiTenureMode: 'years', // 'years' or 'months'
    chatHistory: [],
    isWaitingForAI: false
  };

  /* =========================================================================
   * 1. Navigation & Routing (SPA Hash-based)
   * ========================================================================= */
  var navLinks = document.querySelectorAll('.nav-link');
  var viewSections = document.querySelectorAll('.view-section');
  var navMenu = document.getElementById('nav-menu');
  var navToggleBtn = document.getElementById('nav-toggle-btn');

  function navigateTo(viewId) {
    if (!viewId) viewId = 'dashboard';
    viewId = viewId.replace('#', '');
    
    var targetView = document.getElementById('view-' + viewId);
    if (!targetView) {
      viewId = 'dashboard';
      targetView = document.getElementById('view-dashboard');
    }

    // Toggle active view section
    viewSections.forEach(function (sec) {
      sec.classList.remove('active-view');
    });
    targetView.classList.add('active-view');

    // Update active navbar item
    navLinks.forEach(function (link) {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    state.currentView = viewId;
    window.location.hash = viewId;

    // Close mobile menu if open
    if (navMenu) navMenu.classList.remove('nav-menu-open');
    if (navToggleBtn) navToggleBtn.setAttribute('aria-expanded', 'false');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Handle hash changes
  window.addEventListener('hashchange', function () {
    var hash = window.location.hash.slice(1);
    if (hash) navigateTo(hash);
  });

  // Nav Links click
  navLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var viewId = this.getAttribute('data-view');
      navigateTo(viewId);
    });
  });

  // Brand Logo click
  var brandLogo = document.getElementById('brand-logo');
  if (brandLogo) {
    brandLogo.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo('dashboard');
    });
  }

  // Dashboard interactive cards
  document.querySelectorAll('[data-navigate]').forEach(function (card) {
    card.addEventListener('click', function () {
      var view = this.getAttribute('data-navigate');
      navigateTo(view);
    });
  });

  // Hero CTA button
  var heroCta = document.getElementById('hero-cta-btn');
  if (heroCta) {
    heroCta.addEventListener('click', function (e) {
      e.preventDefault();
      navigateTo('loan-eligibility');
    });
  }

  // Mobile menu toggle
  if (navToggleBtn && navMenu) {
    navToggleBtn.addEventListener('click', function () {
      var isOpen = navMenu.classList.toggle('nav-menu-open');
      navToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  /* =========================================================================
   * 2. Loan Eligibility Checker Module
   * ========================================================================= */
  var loanForm = document.getElementById('loan-eligibility-form');
  var loanAmountInput = document.getElementById('loan-amount');
  var loanAmountSlider = document.getElementById('loan-amount-slider');
  var loanAmountPreview = document.getElementById('loan-amount-preview');
  var loanTenureInput = document.getElementById('loan-tenure');
  var loanTenureSlider = document.getElementById('loan-tenure-slider');
  var loanTenurePreview = document.getElementById('loan-tenure-preview');

  // Sync Loan Amount Slider & Input
  function syncLoanAmount(val) {
    var num = AppUtils.parseCleanNumber(val);
    loanAmountInput.value = num;
    loanAmountSlider.value = Math.min(20000000, Math.max(100000, num));
    loanAmountPreview.textContent = AppUtils.formatCompactINR(num);
  }

  loanAmountInput.addEventListener('input', function () {
    syncLoanAmount(this.value);
  });
  loanAmountSlider.addEventListener('input', function () {
    syncLoanAmount(this.value);
  });

  // Sync Loan Tenure Slider & Input
  function syncLoanTenure(val) {
    var years = parseInt(val, 10) || 1;
    loanTenureInput.value = years;
    loanTenureSlider.value = years;
    var months = years * 12;
    loanTenurePreview.textContent = years + ' Years (' + months + ' Mos)';
  }

  loanTenureInput.addEventListener('input', function () {
    syncLoanTenure(this.value);
  });
  loanTenureSlider.addEventListener('input', function () {
    syncLoanTenure(this.value);
  });

  // Calculate & Display Loan Eligibility
  function runLoanEvaluation() {
    var formData = {
      fullName: document.getElementById('loan-name').value,
      age: document.getElementById('loan-age').value,
      employmentType: document.getElementById('loan-emp-type').value,
      monthlyIncome: document.getElementById('loan-income').value,
      employmentDuration: document.getElementById('loan-duration').value,
      existingEMI: document.getElementById('loan-existing-emi').value,
      monthlyExpenses: document.getElementById('loan-expenses').value,
      creditScore: document.getElementById('loan-score').value,
      existingLoansCount: document.getElementById('loan-count').value,
      desiredLoanAmount: document.getElementById('loan-amount').value,
      loanTenureMonths: (parseInt(document.getElementById('loan-tenure').value, 10) || 15) * 12
    };

    var validation = AppValidation.validateLoanForm(formData);
    if (!validation.isValid) {
      AppValidation.displayErrors(loanForm, validation.errors);
      AppUtils.showToast('Please review the highlighted fields in the loan form.', 'error');
      return null;
    }

    AppValidation.clearErrors(loanForm);
    var result = FinancialEngine.evaluateLoanEligibility(formData);
    state.lastLoanResult = { input: formData, output: result };

    // Update Result UI
    var badge = document.getElementById('loan-result-badge');
    badge.className = 'status-badge badge-' + result.statusCategory;
    badge.textContent = result.status;

    document.getElementById('loan-result-amount').textContent = AppUtils.formatINR(result.estimatedEligibilityAmount);
    document.getElementById('loan-result-summary').textContent = result.statusMessage;
    document.getElementById('loan-result-dti').textContent = result.debtToIncomeRatio + '%';
    document.getElementById('loan-result-emi').textContent = AppUtils.formatINR(result.proposedEMI);
    document.getElementById('loan-result-ndi').textContent = AppUtils.formatINR(result.disposableIncome);
    document.getElementById('loan-result-rate').textContent = result.benchmarkRate + '% p.a.';

    // Factors list
    var factorsList = document.getElementById('loan-factors-list');
    factorsList.innerHTML = '';
    result.factors.forEach(function (f) {
      var li = document.createElement('li');
      li.className = 'factor-item factor-' + f.type;
      var icon = f.type === 'positive' ? '✓' : (f.type === 'negative' ? '✕' : 'ℹ');
      li.innerHTML = '<span class="factor-icon">' + icon + '</span><span>' + AppUtils.escapeHTML(f.label) + '</span>';
      factorsList.appendChild(li);
    });

    return result;
  }

  loanForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var res = runLoanEvaluation();
    if (res) {
      AppUtils.showToast('Loan eligibility assessment updated!', 'success');
    }
  });

  // Reset form
  document.getElementById('btn-reset-loan').addEventListener('click', function () {
    loanForm.reset();
    AppValidation.clearErrors(loanForm);
    syncLoanAmount(2500000);
    syncLoanTenure(15);
    runLoanEvaluation();
    AppUtils.showToast('Loan form reset to defaults.', 'info');
  });

  // Save Record to Google Sheets
  var btnSaveSheet = document.getElementById('btn-save-sheet');
  btnSaveSheet.addEventListener('click', async function () {
    if (!state.lastLoanResult) {
      runLoanEvaluation();
    }
    if (!state.lastLoanResult) return;

    var input = state.lastLoanResult.input;
    var output = state.lastLoanResult.output;

    var recordPayload = {
      fullName: input.fullName,
      age: input.age,
      employmentType: input.employmentType,
      monthlyIncome: input.monthlyIncome,
      monthlyExpenses: input.monthlyExpenses,
      existingEMI: input.existingEMI,
      creditScore: input.creditScore,
      loanAmount: input.desiredLoanAmount,
      loanTenureMonths: input.loanTenureMonths,
      estimatedEMI: output.proposedEMI,
      debtToIncomeRatio: output.debtToIncomeRatio,
      eligibilityResult: output.status + ' (' + AppUtils.formatINR(output.estimatedEligibilityAmount) + ')'
    };

    var originalText = btnSaveSheet.innerHTML;
    btnSaveSheet.disabled = true;
    btnSaveSheet.innerHTML = '<span>⏳ Saving to Google Sheets...</span>';

    var res = await AppAPI.saveAssessmentRecord(recordPayload);
    btnSaveSheet.disabled = false;
    btnSaveSheet.innerHTML = originalText;

    if (res.success) {
      AppUtils.showToast(res.message, 'success');
    } else {
      AppUtils.showToast(res.error, 'warning');
    }
  });

  // Discuss Scenario with Claude AI
  document.getElementById('btn-ask-ai-loan').addEventListener('click', function () {
    if (!state.lastLoanResult) runLoanEvaluation();
    navigateTo('ai-tips');
    var input = state.lastLoanResult.input;
    var output = state.lastLoanResult.output;
    var promptText = 'I am looking for a loan of ' + AppUtils.formatINR(input.desiredLoanAmount) +
      ' with monthly income of ' + AppUtils.formatINR(input.monthlyIncome) +
      ' and credit score ' + input.creditScore +
      '. The simulator estimated ' + output.status + ' (' + AppUtils.formatINR(output.estimatedEligibilityAmount) +
      ') with DTI ' + output.debtToIncomeRatio + '%. What educational steps can I take to improve borrowing terms?';
    
    submitChatMessage(promptText);
  });

  /* =========================================================================
   * 3. Credit Score Analyzer Module
   * ========================================================================= */
  var creditForm = document.getElementById('credit-analyzer-form');
  var creditScoreInput = document.getElementById('credit-score-input');
  var creditScoreSlider = document.getElementById('credit-score-slider');
  var creditScorePreview = document.getElementById('credit-score-preview');

  function syncCreditScore(val) {
    var score = Math.min(900, Math.max(300, parseInt(val, 10) || 300));
    creditScoreInput.value = score;
    creditScoreSlider.value = score;
    creditScorePreview.textContent = score + ' (Bureau Scale)';
    runCreditEvaluation();
  }

  creditScoreInput.addEventListener('input', function () {
    syncCreditScore(this.value);
  });
  creditScoreSlider.addEventListener('input', function () {
    syncCreditScore(this.value);
  });

  function runCreditEvaluation() {
    var data = {
      creditScore: creditScoreInput.value,
      paymentHistory: document.getElementById('credit-payment-history').value,
      creditUtilization: document.getElementById('credit-utilization').value,
      creditHistoryLength: document.getElementById('credit-history-length').value,
      activeLoans: document.getElementById('credit-active-loans').value,
      creditCards: document.getElementById('credit-cards-count').value,
      recentInquiries: document.getElementById('credit-inquiries').value
    };

    var analysis = FinancialEngine.analyzeCreditProfile(data);
    state.lastCreditResult = { input: data, output: analysis };

    // Render SVG Gauge
    AppCharts.renderCreditGauge('credit-gauge-container', analysis.creditScore, analysis.category, analysis.badgeClass);

    // Summary Text
    document.getElementById('credit-risk-level-summary').textContent =
      analysis.category + ' credit profile (' + analysis.riskLevel + '). Range ' + analysis.scoreRangeLabel + '.';

    // Strengths
    var strengthsList = document.getElementById('credit-strengths-list');
    strengthsList.innerHTML = '';
    if (analysis.strengths.length === 0) {
      strengthsList.innerHTML = '<li class="factor-item factor-neutral"><span class="factor-icon">ℹ</span><span>No prime strengths detected currently.</span></li>';
    } else {
      analysis.strengths.forEach(function (s) {
        var li = document.createElement('li');
        li.className = 'factor-item factor-positive';
        li.innerHTML = '<span class="factor-icon">✓</span><span>' + AppUtils.escapeHTML(s) + '</span>';
        strengthsList.appendChild(li);
      });
    }

    // Recommendations
    var recList = document.getElementById('credit-recommendations-list');
    recList.innerHTML = '';
    if (analysis.recommendations.length === 0) {
      recList.innerHTML = '<li class="factor-item factor-positive"><span class="factor-icon">✓</span><span>Excellent habits. Maintain current on-time payment track record!</span></li>';
    } else {
      analysis.recommendations.forEach(function (r) {
        var li = document.createElement('li');
        li.className = 'factor-item factor-neutral';
        li.innerHTML = '<span class="factor-icon">ℹ</span><span>' + AppUtils.escapeHTML(r) + '</span>';
        recList.appendChild(li);
      });
    }
  }

  creditForm.addEventListener('submit', function (e) {
    e.preventDefault();
    runCreditEvaluation();
    AppUtils.showToast('Credit analysis refreshed!', 'success');
  });

  // Re-run credit analysis on any select/input change
  creditForm.querySelectorAll('select, input').forEach(function (el) {
    el.addEventListener('change', runCreditEvaluation);
  });

  /* =========================================================================
   * 4. Real-Time EMI Calculator Module
   * ========================================================================= */
  var emiPrincipalInput = document.getElementById('emi-principal');
  var emiPrincipalSlider = document.getElementById('emi-principal-slider');
  var emiPrincipalDisplay = document.getElementById('emi-principal-display');

  var emiRateInput = document.getElementById('emi-rate');
  var emiRateSlider = document.getElementById('emi-rate-slider');
  var emiRateDisplay = document.getElementById('emi-rate-display');

  var emiTenureInput = document.getElementById('emi-tenure');
  var emiTenureSlider = document.getElementById('emi-tenure-slider');
  var btnTenureYears = document.getElementById('btn-tenure-years');
  var btnTenureMonths = document.getElementById('btn-tenure-months');
  var tenureScaleMin = document.getElementById('emi-tenure-scale-min');
  var tenureScaleMid = document.getElementById('emi-tenure-scale-mid');
  var tenureScaleMax = document.getElementById('emi-tenure-scale-max');

  function syncEMIPrincipal(val) {
    var num = AppUtils.parseCleanNumber(val);
    emiPrincipalInput.value = num;
    emiPrincipalSlider.value = Math.min(20000000, Math.max(100000, num));
    emiPrincipalDisplay.textContent = AppUtils.formatINR(num);
    runEMICalculation();
  }

  emiPrincipalInput.addEventListener('input', function () { syncEMIPrincipal(this.value); });
  emiPrincipalSlider.addEventListener('input', function () { syncEMIPrincipal(this.value); });

  function syncEMIRate(val) {
    var rate = parseFloat(val) || 0;
    emiRateInput.value = rate;
    emiRateSlider.value = Math.min(24, Math.max(5, rate));
    emiRateDisplay.textContent = rate + '% p.a.';
    runEMICalculation();
  }

  emiRateInput.addEventListener('input', function () { syncEMIRate(this.value); });
  emiRateSlider.addEventListener('input', function () { syncEMIRate(this.value); });

  function setTenureMode(mode) {
    state.emiTenureMode = mode;
    var currentVal = parseInt(emiTenureInput.value, 10) || 10;
    if (mode === 'years') {
      btnTenureYears.style.background = 'var(--accent-primary)';
      btnTenureYears.style.color = '#fff';
      btnTenureMonths.style.background = 'transparent';
      btnTenureMonths.style.color = 'var(--text-secondary)';

      emiTenureSlider.min = '1';
      emiTenureSlider.max = '30';
      emiTenureSlider.step = '1';
      tenureScaleMin.textContent = '1 Year';
      tenureScaleMid.textContent = '15 Years';
      tenureScaleMax.textContent = '30 Years';

      var years = Math.max(1, Math.min(30, Math.round(currentVal > 30 ? currentVal / 12 : currentVal)));
      emiTenureInput.value = years;
      emiTenureSlider.value = years;
    } else {
      btnTenureMonths.style.background = 'var(--accent-primary)';
      btnTenureMonths.style.color = '#fff';
      btnTenureYears.style.background = 'transparent';
      btnTenureYears.style.color = 'var(--text-secondary)';

      emiTenureSlider.min = '12';
      emiTenureSlider.max = '360';
      emiTenureSlider.step = '6';
      tenureScaleMin.textContent = '12 Mos';
      tenureScaleMid.textContent = '180 Mos';
      tenureScaleMax.textContent = '360 Mos';

      var months = currentVal <= 30 ? currentVal * 12 : currentVal;
      months = Math.max(12, Math.min(360, months));
      emiTenureInput.value = months;
      emiTenureSlider.value = months;
    }
    runEMICalculation();
  }

  btnTenureYears.addEventListener('click', function () { setTenureMode('years'); });
  btnTenureMonths.addEventListener('click', function () { setTenureMode('months'); });

  function syncEMITenure(val) {
    var t = parseInt(val, 10) || 1;
    emiTenureInput.value = t;
    emiTenureSlider.value = t;
    runEMICalculation();
  }

  emiTenureInput.addEventListener('input', function () { syncEMITenure(this.value); });
  emiTenureSlider.addEventListener('input', function () { syncEMITenure(this.value); });

  function runEMICalculation() {
    var p = parseFloat(emiPrincipalInput.value) || 0;
    var r = parseFloat(emiRateInput.value) || 0;
    var rawTenure = parseInt(emiTenureInput.value, 10) || 1;
    var months = state.emiTenureMode === 'years' ? rawTenure * 12 : rawTenure;

    var emiData = FinancialEngine.calculateEMI(p, r, months);
    state.lastEMIResult = emiData;

    document.getElementById('emi-result-monthly').textContent = AppUtils.formatINR(emiData.monthlyEMI);
    document.getElementById('emi-total-interest').textContent = AppUtils.formatINR(emiData.totalInterest);
    document.getElementById('emi-total-repayment').textContent = AppUtils.formatINR(emiData.totalRepayment);

    document.getElementById('emi-legend-principal').textContent =
      AppUtils.formatINR(emiData.principalAmount) + ' (' + emiData.principalPercent + '%)';
    document.getElementById('emi-legend-interest').textContent =
      AppUtils.formatINR(emiData.totalInterest) + ' (' + emiData.interestPercent + '%)';

    AppCharts.renderEMIDonut(
      'emi-donut-container',
      emiData.principalPercent,
      emiData.interestPercent,
      AppUtils.formatINR(emiData.monthlyEMI),
      'Monthly Installment'
    );
  }

  /* =========================================================================
   * 5. AI Financial Tips Chat Module
   * ========================================================================= */
  var chatForm = document.getElementById('chat-form');
  var chatInput = document.getElementById('chat-user-input');
  var chatMessagesBox = document.getElementById('chat-messages-box');
  var btnClearChat = document.getElementById('btn-clear-chat');
  var btnSendChat = document.getElementById('btn-send-chat');

  function appendChatMessage(sender, htmlContent, isError, onRetry) {
    var msgDiv = document.createElement('div');
    msgDiv.className = 'chat-message chat-' + sender + ' animate-fade-in';

    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = htmlContent;

    if (isError && onRetry) {
      var retryBtn = document.createElement('button');
      retryBtn.className = 'btn btn-outline btn-sm';
      retryBtn.style.marginTop = '0.5rem';
      retryBtn.style.display = 'block';
      retryBtn.textContent = '🔄 Retry';
      retryBtn.addEventListener('click', function () {
        msgDiv.remove();
        onRetry();
      });
      bubble.appendChild(retryBtn);
    }

    msgDiv.appendChild(bubble);
    chatMessagesBox.appendChild(msgDiv);
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    return msgDiv;
  }

  function formatAIResponse(rawText) {
    if (!rawText) return '';
    // Format bold markdown **text** -> <strong>text</strong>
    var formatted = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Format bullet points
    var lines = formatted.split('\n');
    var html = [];
    var inList = false;

    lines.forEach(function (line) {
      var trimmed = line.trim();
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        if (!inList) {
          html.push('<ul>');
          inList = true;
        }
        html.push('<li>' + trimmed.substring(2) + '</li>');
      } else if (/^\d+\.\s/.test(trimmed)) {
        if (!inList) {
          html.push('<ol>');
          inList = true;
        }
        html.push('<li>' + trimmed.replace(/^\d+\.\s/, '') + '</li>');
      } else {
        if (inList) {
          html.push('</ul>');
          inList = false;
        }
        if (trimmed) {
          html.push('<p>' + trimmed + '</p>');
        }
      }
    });

    if (inList) html.push('</ul>');
    return html.join('');
  }

  async function submitChatMessage(userText) {
    if (!userText || !userText.trim() || state.isWaitingForAI) return;
    var prompt = userText.trim();
    chatInput.value = '';

    // Render User Message
    appendChatMessage('user', '<p>' + AppUtils.escapeHTML(prompt) + '</p>');

    // Build Current Financial Context
    var context = {};
    if (state.lastLoanResult) {
      context.loan = {
        income: state.lastLoanResult.input.monthlyIncome,
        creditScore: state.lastLoanResult.input.creditScore,
        desiredAmount: state.lastLoanResult.input.desiredLoanAmount,
        estimatedEligibility: state.lastLoanResult.output.estimatedEligibilityAmount,
        dti: state.lastLoanResult.output.debtToIncomeRatio,
        status: state.lastLoanResult.output.status
      };
    }
    if (state.lastEMIResult) {
      context.emi = {
        monthlyEMI: state.lastEMIResult.monthlyEMI,
        principalAmount: state.lastEMIResult.principalAmount,
        totalInterest: state.lastEMIResult.totalInterest
      };
    }

    // Render Typing Indicator
    state.isWaitingForAI = true;
    btnSendChat.disabled = true;

    var typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message chat-bot animate-fade-in';
    typingDiv.id = 'typing-indicator-msg';
    typingDiv.innerHTML = '<div class="chat-bubble typing-indicator"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>';
    chatMessagesBox.appendChild(typingDiv);
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;

    var result = await AppAPI.requestAIAdvice(prompt, context);

    // Remove typing indicator
    var typingEl = document.getElementById('typing-indicator-msg');
    if (typingEl) typingEl.remove();

    state.isWaitingForAI = false;
    btnSendChat.disabled = false;

    if (result.success) {
      var botHtml = formatAIResponse(result.reply);
      appendChatMessage('bot', botHtml);
    } else {
      appendChatMessage(
        'bot',
        '<p style="color: #f87171;">⚠️ ' + AppUtils.escapeHTML(result.error) + '</p>',
        true,
        function () { submitChatMessage(prompt); }
      );
    }
  }

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    submitChatMessage(chatInput.value);
  });

  // Prompt Chips
  document.querySelectorAll('.prompt-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      var p = this.getAttribute('data-prompt');
      submitChatMessage(p);
    });
  });

  // Clear chat
  btnClearChat.addEventListener('click', function () {
    chatMessagesBox.innerHTML = '';
    appendChatMessage('bot',
      '<p><strong>Chat cleared.</strong> How can I help you understand your loan options, EMI obligations, or credit standing today?</p>'
    );
  });

  /* =========================================================================
   * 6. Application Startup & Initial Calcs
   * ========================================================================= */
  function init() {
    // Initial Loan Evaluation
    syncLoanAmount(2500000);
    syncLoanTenure(15);
    runLoanEvaluation();

    // Initial Credit Analyzer Evaluation
    syncCreditScore(740);

    // Initial EMI Calculator
    syncEMIPrincipal(2000000);
    syncEMIRate(8.75);
    setTenureMode('years');

    // Routing from current URL hash
    var initialHash = window.location.hash.slice(1);
    navigateTo(initialHash || 'dashboard');
  }

  init();
});
