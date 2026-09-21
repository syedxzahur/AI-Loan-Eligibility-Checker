# AI Loan Eligibility Checker ⚡
> **An AI-powered BFSI financial decision-support platform featuring Loan Eligibility evaluation, Credit Score Analysis, real-time EMI calculation, and Claude 3.5 AI Financial Guidance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![UI Style](https://img.shields.io/badge/Design-Dark%20Glassmorphism-6366f1.svg)]()
[![AI Powered](https://img.shields.io/badge/AI-Anthropic%20Claude%203.5-d946ef.svg)](https://console.anthropic.com/)

---

## 1. Project Overview

The **AI Loan Eligibility Checker** is a full-stack financial decision-support web application tailored for Banking, Financial Services, and Insurance (BFSI) retail borrowing. It unifies four critical lending tools into a cohesive, high-performance **dark glassmorphism** interface:

1. **Loan Eligibility Checker:** Comprehensive borrowing capacity engine evaluating FOIR, NDI, credit grade, and living expenses.
2. **Credit Score Analyzer:** Interactive 240-degree circular gauge evaluating payment history, utilization, credit mix, and inquiry velocity.
3. **Real-Time EMI Calculator:** Reducing balance formula calculation with synchronized range sliders and an SVG Principal vs Interest donut chart.
4. **Claude AI Financial Tips:** Guardrailed, educational financial guidance powered by the Anthropic Claude API.
5. **Google Sheets Persistence Layer:** Serverless data synchronization for applicant assessment records without exposing credentials.

---

## 2. Technology Stack

* **Frontend:**
  * HTML5 (Semantic, accessible markup with ARIA tags)
  * CSS3 (Custom properties, dark glassmorphism, responsive Flexbox/Grid, `prefers-reduced-motion`)
  * Vanilla JavaScript (Zero framework bloat, fast load times, modular architecture)
  * SVG Vector Engines (Pure SVG donut chart & credit score gauge meter)
* **Backend & Serverless API:**
  * Node.js runtime
  * Serverless endpoints (`/api/ai-advice`, `/api/save-record`, `/api/records`, `/api/health`)
  * Local development HTTP server (`server.js`) with zero external npm dependencies
* **External Integrations:**
  * Anthropic Claude API (`claude-3-5-sonnet-20241022`)
  * Google Sheets API / Google Apps Script Webhook

---

## 3. Directory Structure

```
ai-loan-eligibility-checker/
├── .env.example                     # Environment variables template
├── .gitignore                       # Protect secrets and node_modules
├── package.json                     # NPM project manifest
├── vercel.json                      # Vercel serverless deployment config
├── netlify.toml                     # Netlify functions & headers config
├── server.js                        # Zero-dependency local Node.js server
├── api/                             # Serverless API routes
│   ├── ai-advice.js                 # Claude API proxy with BFSI guardrails
│   ├── save-record.js               # Google Sheets persistence handler
│   ├── records.js                   # Protected admin summary query
│   └── health.js                    # Health check & diagnostics
├── public/                          # Frontend client assets
│   ├── index.html                   # Master single-page application
│   ├── css/
│   │   ├── variables.css            # Dark glassmorphism tokens & colors
│   │   ├── style.css                # Global layouts, header, hero & footer
│   │   ├── components.css           # Glass cards, sliders, gauges, chat UI
│   │   └── responsive.css           # Breakpoints for desktop, tablet, mobile
│   └── js/
│       ├── config.js                # App constants & Indian lending rules
│       ├── utils.js                 # Indian currency (₹) formatter & XSS sanitizer
│       ├── validation.js            # Input & cross-field validation rules
│       ├── calculations.js          # Pure BFSI reducing balance EMI & FOIR engine
│       ├── charts.js                # Pure SVG donut chart & score gauge meter
│       ├── api.js                   # Client API fetch layer
│       └── app.js                   # Application coordinator & state manager
├── tests/                           # Automated unit test suite
│   ├── calculations.test.js         # Mathematical formula accuracy tests
│   ├── validation.test.js           # Form validation & boundary checks
│   ├── api.test.js                  # API handler & security tests
│   └── run-tests.js                 # Automated test runner (Exit 0/1)
├── docs/                            # In-depth technical documentation
│   ├── architecture.md              # Technical system design
│   ├── workflow.md                  # Workflow diagram & data flow
│   └── features.md                  # Functional specifications
└── README.md                        # Project documentation
```

---

## 4. Quick Start & Local Development

### Prerequisites
* **Node.js:** v18.0.0 or higher.
* No npm installation required for core execution—the platform uses standard Node.js built-ins.

### 1. Clone & Enter Directory
```bash
git clone <repository-url>
cd ai-loan-eligibility-checker
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Edit `.env` to configure your API keys (optional for local testing; intelligent educational fallbacks and session buffers will engage automatically if keys are omitted).

### 3. Run Automated Tests
```bash
node tests/run-tests.js
```

### 4. Start Local Development Server
```bash
node server.js
```
Open your browser and navigate to:
**`http://localhost:3000`**

---

## 5. Environment Variables & Credentials Setup

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Local server port | `3000` |
| `ANTHROPIC_API_KEY` | Anthropic Claude API Key | `sk-ant-api03-...` |
| `ANTHROPIC_MODEL` | Claude model variant | `claude-3-5-sonnet-20241022` |
| `GOOGLE_SHEETS_WEBHOOK_URL`| Google Apps Script Webhook URL | `https://script.google.com/macros/s/.../exec` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Cloud Service Account | `sa@project.iam.gserviceaccount.com` |
| `GOOGLE_SHEET_ID` | Google Spreadsheet Target ID | `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms` |
| `RECORDS_ADMIN_TOKEN` | Bearer token for `GET /api/records` | `a_secure_random_string` |

### Setting Up Anthropic Claude
1. Obtain an API key from the [Anthropic Console](https://console.anthropic.com/).
2. Set `ANTHROPIC_API_KEY=your_key_here` in `.env` or deployment dashboard.
3. The serverless route `/api/ai-advice` will automatically switch from educational fallback mode to live Claude 3.5 generation.

### Setting Up Google Sheets Integration
**Option A: Google Apps Script Webhook (Fastest, zero cloud IAM friction)**
1. In Google Sheets, create a new spreadsheet with the following header row:
   `Timestamp | Full Name | Age | Employment Type | Monthly Income | Monthly Expenses | Existing EMI | Credit Score | Loan Amount | Loan Tenure | Estimated EMI | DTI Ratio | Eligibility Result`
2. Go to **Extensions > Apps Script**, paste:
   ```javascript
   function doPost(e) {
     var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     var data = JSON.parse(e.postData.contents);
     sheet.appendRow([
       data.timestamp, data.fullName, data.age, data.employmentType,
       data.monthlyIncome, data.monthlyExpenses, data.existingEMI,
       data.creditScore, data.loanAmount, data.loanTenureMonths,
       data.estimatedEMI, data.debtToIncomeRatio, data.eligibilityResult
     ]);
     return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
       .setMimeType(ContentService.MimeType.JSON);
   }
   ```
3. Click **Deploy > New Deployment > Web App** (Set access to *Anyone*).
4. Paste the URL into `GOOGLE_SHEETS_WEBHOOK_URL` in `.env`.

---

## 6. Deployment Guide

### Deploying to Vercel
1. Install or run Vercel CLI:
   ```bash
   npx vercel
   ```
2. Link your project and accept default settings (output directory: `public`, API directory: `api`).
3. Set your production environment variables in the Vercel dashboard under **Settings > Environment Variables**.
4. Deploy to production:
   ```bash
   npx vercel --prod
   ```

### Deploying to Netlify
1. Connect repository to Netlify.
2. Build command: Leave empty or `echo 'Static build'`.
3. Publish directory: `public`.
4. Functions directory: `api`.
5. Configure environment variables under **Site Settings > Environment Variables**.

---

## 7. Financial & Legal Disclaimer

> **IMPORTANT:** This web platform provides mathematical estimates and educational decision-support information only. It is **not** a bank, lender, credit rating bureau, or registered investment advisor. Loan eligibility, final sanctioned amounts, interest rates, processing fees, and approvals are subject to the independent underwriting policies of licensed financial institutions upon full documentation verification.
