# Technical Architecture Document

## 1. System Overview

**AI Loan Eligibility Checker** is a high-performance, full-stack decision-support system engineered specifically for retail banking, financial services, and insurance (BFSI) customer engagement. It delivers instant, transparent computational modeling coupled with AI-driven contextual education.

---

## 2. Layered Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Presentation Layer                   │
│   • Semantic HTML5 SPA with Deep Hash-Routing          │
│   • CSS3 Dark Glassmorphism Design System              │
│   • Lightweight SVG Vector Visualizations (Gauge/Donut)│
└───────────────────────────▲────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                  Client Logic Layer                    │
│   • validation.js: Boundary & Type Checks              │
│   • calculations.js: Reducing Balance EMI & FOIR Engine│
│   • utils.js: Indian Rupee (INR) Formatters & XSS Guard│
│   • api.js: AbortController & Resilient Fetch Client   │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP POST/GET (JSON)
┌───────────────────────────▼────────────────────────────┐
│              Serverless / Backend Layer                │
│   • api/ai-advice.js: Claude 3.5 Proxy & Guardrails    │
│   • api/save-record.js: Google Sheets Persistence Hub  │
│   • api/records.js: Protected Admin Query API          │
│   • api/health.js: System Health & Integration Status  │
└───────────────────────────▲────────────────────────────┘
                            │ HTTPS / JWT
┌───────────────────────────▼────────────────────────────┐
│              External Persistence & AI                 │
│   • Anthropic Claude 3.5 API (Messages Endpoint)       │
│   • Google Sheets API / Webhook Spreadsheet Hub        │
└────────────────────────────────────────────────────────┘
```

---

## 3. Financial Computation Specifications

### 3.1 Reducing Balance EMI Formula
Standard banking compounding monthly installment calculation:
$$\text{EMI} = \frac{P \cdot r \cdot (1+r)^n}{(1+r)^n - 1}$$
Where:
- $P$ = Principal loan amount
- $r$ = Monthly interest rate ($\text{Annual Rate} / 1200$)
- $n$ = Total installment periods in months

### 3.2 Fixed Obligation to Income Ratio (FOIR / DTI)
$$\text{FOIR} = \frac{\text{Existing Monthly EMIs} + \text{Proposed EMI}}{\text{Net Monthly Income}} \times 100\%$$
- **Benchmark Thresholds:**
  - $\le 40\%$: Prime borrowing tier.
  - $40\% - 50\%$: Standard acceptable range.
  - $> 50\%$: Strained capacity; triggers "Review Required" or "Lower Eligibility".

### 3.3 Net Disposable Income (NDI)
$$\text{NDI} = \text{Monthly Income} - \text{Monthly Living Expenses} - \text{Existing EMIs}$$
Serves as an empirical safeguard ensuring the borrower retains a minimum 25% surplus for household emergencies.

---

## 4. Security Architecture

1. **Client Isolation:** No private API keys or Google Cloud Service Account credentials are bundled into frontend assets.
2. **Environment Variable Segregation:** `.env` is listed in `.gitignore`. Production deployments configure secrets via platform console settings.
3. **Data Access Control:** The `GET /api/records` endpoint requires `Bearer <RECORDS_ADMIN_TOKEN>` to prevent public exposure of user-submitted financial profiles.
4. **Input Sanitization:** Client inputs are stripped of HTML tags, control characters, and out-of-range numerical values before reaching calculation or storage functions.
5. **BFSI Regulatory Guardrails:** Claude prompts enforce strict disclaimers prohibiting guaranteed approval claims and establishing educational boundaries.
