# Platform Features & Functional Specifications

The **AI Loan Eligibility Checker** platform integrates four core financial tools into a unified glassmorphic application.

---

## 1. Loan Eligibility Checker

* **Input Collection:**
  * Full Name (Primary Applicant)
  * Age (Valid adult lending range: 21 to 65 years)
  * Employment Type (Salaried, Self-employed Professional, Business Owner, Freelancer, Other)
  * Employment Duration / Stability (Years with current employer or business)
  * Monthly Net In-Hand Income
  * Existing Monthly EMIs & Fixed Repayments
  * Monthly Living Expenses (excluding existing loan EMIs)
  * Credit Score (300 to 900)
  * Number of Active Loans
  * Desired Loan Amount (₹50,000 to ₹2 Crore)
  * Loan Tenure (1 to 30 Years)
* **Real-Time Indicators:**
  * Estimated Maximum Loan Eligibility (₹)
  * Fixed Obligation to Income Ratio (FOIR / DTI %)
  * Projected Monthly Installment (EMI)
  * Net Disposable Surplus (NDI)
  * Risk-Adjusted Benchmark Interest Rate
* **Decision Categorization:**
  * **Likely Eligible:** FOIR $\le 50\%$, Credit Score $\ge 680$, positive disposable cashflow cushion.
  * **Review Required:** FOIR between $50\%-60\%$, Credit Score $620-679$, or marginal capacity.
  * **Lower Eligibility:** Inadequate disposable surplus, excessive existing debt obligations, or score $<620$.
* **Contributing Factor Attribution:** Real-time positive, neutral, and risk itemization.
* **Storage Integration:** One-click submission to Google Sheets.

---

## 2. Credit Score Analyzer

* **Dimensions Evaluated:**
  * Credit Score (300–900 scale)
  * Payment History Track Record (100% On-time vs Minor Delays vs Defaults)
  * Credit Card Utilization Ratio (Ideal $<30\%$)
  * Oldest Credit Line (Years of established account age)
  * Number of Active Loans & Credit Cards Held
  * Recent Hard Inquiries in past 6 months
* **Visual Presentation:**
  * Dynamic SVG 240-degree circular arc meter with color-coded needle
  * Bureau scale category labels: Excellent (750-900), Good (650-749), Fair (550-649), Poor (300-549)
  * Clear strengths and prioritized recommendations

---

## 3. Real-Time EMI Calculator

* **Dual Input Interface:** Numerical input fields paired with synchronized interactive range sliders.
* **Flexible Tenure:** Seamless toggle between Annual (Years) and Monthly (Months) durations.
* **Instant Calculation Output:**
  * Monthly EMI
  * Total Cumulative Interest
  * Total Repayment (Principal + Interest)
* **Visual Breakdown:**
  * SVG Donut Chart with segmented arcs for Principal vs Interest share.
  * Percentage tags and absolute Indian currency figures (`₹1,50,000`).

---

## 4. Claude AI Financial Tips

* **Educational Guidance Assistant:**
  * Context-aware chat interface powered by Claude 3.5.
  * Automatically injects session simulation data when requested (*"Analyze My Current Numbers"*).
  * Instant pre-curated prompt chips covering DTI optimization, debt snowball/avalanche, and credit rebuilding.
* **UX Capabilities:**
  * Realistic typing indicator animation
  * Markdown rendering with bold headers and bulleted recommendations
  * Error retry mechanism and conversation clear function

---

## 5. Google Sheets Persistence Layer

* **Synchronized Columns:**
  `Timestamp`, `Name`, `Age`, `Employment Type`, `Monthly Income`, `Monthly Expenses`, `Existing EMI`, `Credit Score`, `Loan Amount`, `Loan Tenure`, `Estimated EMI`, `Debt-to-Income Ratio`, `Eligibility Result`.
* **Deployment Modes:**
  * Option A: Google Cloud Service Account
  * Option B: Google Apps Script Webhook
  * Fallback: Safe memory session buffer for preview environments.

---

## 6. Future Enhancements Roadmap

1. **User Authentication:** Multi-factor authentication via Supabase or Auth0 for personal profile histories.
2. **Predictive Machine Learning Models:** XGBoost credit default prediction models trained on retail lending datasets.
3. **Downloadable PDF Reports:** One-click client export of financial health summaries with repayment charts.
4. **Account Aggregator (AA) Integration:** Direct bank statement fetching via RBI-licensed Account Aggregators.
5. **Multi-Language Localization:** Support for Hindi, Tamil, Telugu, Marathi, and Bengali regional interfaces.
