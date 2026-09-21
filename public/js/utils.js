/**
 * AI Loan Eligibility Checker - Utilities & Formatters
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppUtils = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var inrFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  });

  var standardNumberFormatter = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  });

  /**
   * Format number into Indian Rupee string, e.g., ₹1,50,000
   */
  function formatINR(val) {
    var num = parseFloat(val) || 0;
    return inrFormatter.format(Math.round(num));
  }

  /**
   * Format number in Indian numbering system without currency symbol, e.g., 1,50,000
   */
  function formatNumberIN(val) {
    var num = parseFloat(val) || 0;
    return standardNumberFormatter.format(Math.round(num));
  }

  /**
   * Compact format in Lakhs and Crores, e.g., ₹25.5 Lakh or ₹1.2 Crore
   */
  function formatCompactINR(val) {
    var num = parseFloat(val) || 0;
    if (num >= 10000000) {
      return '₹' + (num / 10000000).toFixed(2).replace(/\.00$/, '') + ' Cr';
    }
    if (num >= 100000) {
      return '₹' + (num / 100000).toFixed(2).replace(/\.00$/, '') + ' Lakh';
    }
    return formatINR(num);
  }

  /**
   * Parse numeric value from string containing commas or currency symbols
   */
  function parseCleanNumber(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    var cleaned = String(val).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  /**
   * Sanitize text against XSS
   */
  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Debounce execution
   */
  function debounce(fn, wait) {
    var timeout;
    return function () {
      var context = this;
      var args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(function () {
        fn.apply(context, args);
      }, wait);
    };
  }

  /**
   * Toast notification display
   */
  function showToast(message, type) {
    type = type || 'info';
    var container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type + ' animate-fade-in';
    
    var icon = 'ℹ️';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✕';
    else if (type === 'warning') icon = '⚠';

    toast.innerHTML = '<span class="toast-icon">' + icon + '</span><div class="toast-message">' + escapeHTML(message) + '</div><button class="toast-close" aria-label="Close">&times;</button>';
    
    var closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', function () {
      toast.remove();
    });

    container.appendChild(toast);

    setTimeout(function () {
      toast.classList.add('toast-fade-out');
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 4500);
  }

  return {
    formatINR: formatINR,
    formatNumberIN: formatNumberIN,
    formatCompactINR: formatCompactINR,
    parseCleanNumber: parseCleanNumber,
    escapeHTML: escapeHTML,
    debounce: debounce,
    showToast: showToast
  };
});
