/**
 * AI Loan Eligibility Checker - API Service Layer
 * Interfaces securely with backend serverless endpoints.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppAPI = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var API_BASE = (window.APP_CONFIG && window.APP_CONFIG.apiBase) || '/api';

  /**
   * Request AI Financial Tips from Claude API proxy
   */
  async function requestAIAdvice(userPrompt, context) {
    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 30000); // 30s timeout

      var response = await fetch(API_BASE + '/ai-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: userPrompt,
          context: context || {}
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        var errJson = await response.json().catch(function () { return {}; });
        var message = errJson.message || 'AI guidance is temporarily unavailable. Please try again later.';
        return {
          success: false,
          error: message,
          isConfigured: errJson.isConfigured !== false
        };
      }

      var data = await response.json();
      return {
        success: true,
        reply: data.reply,
        model: data.model,
        mode: data.mode || 'live'
      };
    } catch (err) {
      return {
        success: false,
        error: 'AI guidance is temporarily unavailable. Please check your connection and try again later.'
      };
    }
  }

  /**
   * Save loan eligibility assessment record to Google Sheets persistence layer
   */
  async function saveAssessmentRecord(record) {
    try {
      var controller = new AbortController();
      var timeoutId = setTimeout(function () {
        controller.abort();
      }, 15000);

      var response = await fetch(API_BASE + '/save-record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(record),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      var data = await response.json().catch(function () { return {}; });

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Your analysis could not be saved right now. Please try again.'
        };
      }

      return {
        success: true,
        message: data.message || 'Analysis record saved successfully.',
        storageMode: data.storageMode || 'google_sheets'
      };
    } catch (err) {
      return {
        success: false,
        error: 'Your analysis could not be saved right now. Please try again.'
      };
    }
  }

  /**
   * Check system health & credential readiness
   */
  async function getSystemHealth() {
    try {
      var response = await fetch(API_BASE + '/health');
      if (!response.ok) return { status: 'degraded' };
      return await response.json();
    } catch (err) {
      return { status: 'offline' };
    }
  }

  return {
    requestAIAdvice: requestAIAdvice,
    saveAssessmentRecord: saveAssessmentRecord,
    getSystemHealth: getSystemHealth
  };
});
