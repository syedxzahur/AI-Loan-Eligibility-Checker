/**
 * AI Loan Eligibility Checker - Pure SVG Charts & Visual Meters
 * Lightweight, zero-dependency SVG rendering for EMI Donut and Credit Score Gauge.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppCharts = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /**
   * Render SVG Donut Chart for EMI Breakdown (Principal vs Interest)
   */
  function renderEMIDonut(containerId, principalPercent, interestPercent, centerText, centerSubtext) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var size = 220;
    var strokeWidth = 26;
    var radius = (size - strokeWidth) / 2;
    var circumference = 2 * Math.PI * radius;

    var principalOffset = 0;
    var principalLength = (principalPercent / 100) * circumference;
    var interestLength = (interestPercent / 100) * circumference;
    var interestOffset = -principalLength;

    var svg = [
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" class="donut-chart-svg">',
      '  <defs>',
      '    <linearGradient id="principalGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
      '      <stop offset="0%" stop-color="#3b82f6"/>',
      '      <stop offset="100%" stop-color="#6366f1"/>',
      '    </linearGradient>',
      '    <linearGradient id="interestGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
      '      <stop offset="0%" stop-color="#ec4899"/>',
      '      <stop offset="100%" stop-color="#f43f5e"/>',
      '    </linearGradient>',
      '    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">',
      '      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.3"/>',
      '    </filter>',
      '  </defs>',
      '  <circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + radius + '" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="' + strokeWidth + '"/>',
      '  <!-- Principal Arc -->',
      '  <circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + radius + '" fill="none"',
      '    stroke="url(#principalGrad)" stroke-width="' + strokeWidth + '" stroke-linecap="round"',
      '    stroke-dasharray="' + principalLength + ' ' + (circumference - principalLength) + '"',
      '    stroke-dashoffset="0" transform="rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')"',
      '    class="donut-segment animate-draw" filter="url(#glow)"/>',
      '  <!-- Interest Arc -->',
      '  <circle cx="' + (size / 2) + '" cy="' + (size / 2) + '" r="' + radius + '" fill="none"',
      '    stroke="url(#interestGrad)" stroke-width="' + strokeWidth + '" stroke-linecap="round"',
      '    stroke-dasharray="' + interestLength + ' ' + (circumference - interestLength) + '"',
      '    stroke-dashoffset="' + interestOffset + '" transform="rotate(-90 ' + (size / 2) + ' ' + (size / 2) + ')"',
      '    class="donut-segment animate-draw" filter="url(#glow)"/>',
      '  <!-- Center Text -->',
      '  <g class="donut-center-group">',
      '    <text x="' + (size / 2) + '" y="' + (size / 2 - 6) + '" text-anchor="middle" class="donut-center-value">' + centerText + '</text>',
      '    <text x="' + (size / 2) + '" y="' + (size / 2 + 18) + '" text-anchor="middle" class="donut-center-subtext">' + centerSubtext + '</text>',
      '  </g>',
      '</svg>'
    ].join('\n');

    container.innerHTML = svg;
  }

  /**
   * Render Circular Credit Score Gauge Meter (240-degree arc from 300 to 900)
   */
  function renderCreditGauge(containerId, score, categoryName, badgeClass) {
    var container = document.getElementById(containerId);
    if (!container) return;

    var s = Math.min(900, Math.max(300, parseInt(score, 10) || 300));
    var percent = (s - 300) / 600; // 0.0 to 1.0

    var size = 260;
    var cx = size / 2;
    var cy = size / 2 + 15;
    var radius = 95;
    var strokeWidth = 18;

    // 240 degree arc from 150 deg to 390 deg (or -210 to 30)
    var startAngle = 150;
    var endAngle = 390;
    var totalAngle = endAngle - startAngle; // 240 deg
    var currentAngle = startAngle + (percent * totalAngle);

    function polarToCartesian(centerX, centerY, r, angleInDegrees) {
      var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (r * Math.cos(angleInRadians)),
        y: centerY + (r * Math.sin(angleInRadians))
      };
    }

    function describeArc(x, y, r, startA, endA) {
      var start = polarToCartesian(x, y, r, endA);
      var end = polarToCartesian(x, y, r, startA);
      var largeArcFlag = endA - startA <= 180 ? '0' : '1';
      return [
        'M', start.x, start.y,
        'A', r, r, 0, largeArcFlag, 0, end.x, end.y
      ].join(' ');
    }

    var backgroundPath = describeArc(cx, cy, radius, startAngle, endAngle);
    var activePath = percent > 0.01 ? describeArc(cx, cy, radius, startAngle, currentAngle) : '';

    var needlePoint = polarToCartesian(cx, cy, radius - 20, currentAngle);

    // Dynamic stroke gradient or color based on score
    var strokeColor = '#10b981'; // Green
    if (s < 550) strokeColor = '#ef4444'; // Red
    else if (s < 650) strokeColor = '#f59e0b'; // Amber
    else if (s < 750) strokeColor = '#3b82f6'; // Blue

    var svg = [
      '<svg width="' + size + '" height="' + (size - 20) + '" viewBox="0 0 ' + size + ' ' + (size - 20) + '" class="gauge-meter-svg">',
      '  <defs>',
      '    <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">',
      '      <stop offset="0%" stop-color="#ef4444"/>',
      '      <stop offset="35%" stop-color="#f59e0b"/>',
      '      <stop offset="70%" stop-color="#3b82f6"/>',
      '      <stop offset="100%" stop-color="#10b981"/>',
      '    </linearGradient>',
      '    <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">',
      '      <feDropShadow dx="0" dy="0" stdDeviation="6" flood-color="' + strokeColor + '" flood-opacity="0.4"/>',
      '    </filter>',
      '  </defs>',
      '  <!-- Background Arc -->',
      '  <path d="' + backgroundPath + '" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="' + strokeWidth + '" stroke-linecap="round"/>',
      '  <!-- Active Arc -->',
      activePath ? '  <path d="' + activePath + '" fill="none" stroke="' + strokeColor + '" stroke-width="' + strokeWidth + '" stroke-linecap="round" filter="url(#gaugeGlow)" class="gauge-active-arc"/>' : '',
      '  <!-- Center Info -->',
      '  <g class="gauge-center-content">',
      '    <text x="' + cx + '" y="' + (cy - 16) + '" text-anchor="middle" class="gauge-score-value">' + s + '</text>',
      '    <text x="' + cx + '" y="' + (cy + 12) + '" text-anchor="middle" class="gauge-category-label ' + badgeClass + '">' + categoryName.toUpperCase() + '</text>',
      '    <text x="' + cx + '" y="' + (cy + 32) + '" text-anchor="middle" class="gauge-subtext">Bureau Scale (300–900)</text>',
      '  </g>',
      '  <!-- Scale Markers -->',
      '  <text x="32" y="' + (cy + 40) + '" class="gauge-scale-min">300</text>',
      '  <text x="' + (size - 32) + '" y="' + (cy + 40) + '" text-anchor="end" class="gauge-scale-max">900</text>',
      '</svg>'
    ].join('\n');

    container.innerHTML = svg;
  }

  return {
    renderEMIDonut: renderEMIDonut,
    renderCreditGauge: renderCreditGauge
  };
});
