# GSFC University Placement Portal & AI Career Suite

[![CI Pipeline](https://github.com/omthakkar8495/gsfc-placement-analyzer-/actions/workflows/ci.yml/badge.svg)](https://github.com/omthakkar8495/gsfc-placement-analyzer-/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Security Policy](https://img.shields.io/badge/security-audited-emerald.svg)](SECURITY.md)

An institutional-grade, full-stack campus recruitment and career intelligence suite engineered for **GSFC University Training & Placement Cell (TPC)**. The platform unifies AI-driven adaptive mock interviews, predictive placement analytics, corporate recruiter CRM pipelines, verified alumni mentorship, and cryptographic Merkle hash-chain credential verification into a cohesive enterprise system.

---

## 🏛️ Core Enterprise Pillars

```
+-------------------------------------------------------------------------------+
|                       GSFC PLACEMENT PORTAL & AI SUITE                         |
+-------------------------------------------------------------------------------+
|  1. AI Prep Studio     2. Predictive Engine    3. Recruiter CRM & Accreditation|
|  - Dynamic Difficulty  - Logistic Propensity   - 7-Stage Candidate Pipeline    |
|  - STAR Multi-Score    - Factor Decomposition  - NAAC 5.2.1 / NIRF 3A / NBA    |
|  - WPM & Speech Meter  - Cohort Salary Trends  - Configurable Drive Rubrics    |
+-------------------------------------------------------------------------------+
|  4. Mentorship Market  5. Trust & Verification 6. High-Availability Infra     |
|  - Semantic Matchmaker - SHA-256 Merkle Chain  - SQLite WAL (< 1ms read/write) |
|  - 1:1 Slot Booking    - Zero-Auth Public Cert - Deterministic AI Fallbacks    |
|  - Reputation Engine   - Whole-Ledger Audits   - Deep Health & Liveness Checks |
+-------------------------------------------------------------------------------+
```

### 1. Adaptive AI Interview & Video Prep Engine
- **Dynamic Difficulty Calibration**: Real-time evaluation scaling from Level 1 Diagnostic Foundations to Level 3 High-Concurrency Architecture.
- **Enterprise Question Repository**: Pre-seeded with curated interview questions from Google, Microsoft, Amazon, GSFC Ltd, and TCS.
- **Multi-Dimensional Scorecard**: Evaluates STAR narrative coverage, technical depth, communication clarity, Words-Per-Minute (WPM), and filler-word frequency (`um`, `uh`, `like`, `you know`).
- **Personalized 3-Day Rapid Sprint**: Generates customized post-interview preparation schedules targeting identified gaps.

### 2. Predictive Analytics & Continuous At-Risk Engine
- **Statistical Placement Propensity**: Standardized, feature-centered logistic regression model forecasting candidate placement likelihood ($P(\text{Placement}) = \frac{1}{1 + e^{-z}}$).
- **Explainable Factor Decomposition**: Deconstructs candidate at-risk scores into weighted factors (Application Velocity, ATS Score Deficits, Mock Score Gaps, CGPA Cutoff Proximity) with automated remediation paths.
- **Institutional Cohort Forecaster**: Projects department-wise conversion rates and salary trajectories with confidence bounds.

### 3. Alumni Mentorship Marketplace
- **Semantic Mentor Matching**: Pairs students with verified alumni mentors based on target employer, branch, technical skills, and mentor reputation.
- **1:1 Slot Booking**: In-portal scheduling with automated meeting room generation and notification dispatches.
- **Reputation System**: Verified student ratings and feedback computing live 5-star mentor reputation benchmarks.

### 4. Recruiter CRM & Multi-Standard Accreditation Exporters
- **Recruiter CRM Pipeline**: Real-time stage progression (`applied` $\to$ `shortlisted` $\to$ `assessment` $\to$ `interview` $\to$ `offered` $\to$ `joined` $\to$ `rejected`) with atomic bulk transitions and audit trails.
- **Customizable Evaluation Rubrics**: Configurable weighting across Technical, ATS, STAR, and Academic metrics with minimum cutoff thresholds.
- **1-Click Accreditation Exporters**:
  - **NAAC Metric 5.2.1**: Complete graduating student placement roster.
  - **NIRF Table 3A**: Parameter 3 approved intake, placed count, and median salary.
  - **NBA Tier-1**: Placement Index ($P = \frac{N_p}{N_g} \times 100$) by engineering branch.
  - **AICTE-CII Survey**: Institutional placement survey data.

### 5. Cryptographic Merkle Hash-Chain Verification
- **Tamper-Evident Ledger**: Sequential SHA-256 block linking with Merkle root validation ($\text{MerkleRoot} = \text{SHA-256}(\text{docHash} + \text{prevHash})$).
- **Public Verification Subsystem**: Zero-auth instant credential verification endpoint (`GET /api/blockchain/verify/:certId`).
- **Ledger Audit Engine**: Automated whole-chain sequential verification detecting any altered block payloads.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/omthakkar8495/gsfc-placement-analyzer-.git
cd gsfc-placement-analyzer-

# Install root, frontend, and backend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=5001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_32_characters_minimum
GEMINI_API_KEY=your_optional_gemini_api_key
```

### 3. Seed Local Development Test Accounts
Run the isolated developer seeding script:
```bash
npm run seed:dev
```

*This populates local test accounts for all user roles with secure bcrypt hashes:*
- **TPC Admin**: `admin@gsfcuniversity.ac.in`
- **Student**: `student.om@gsfcuniversity.ac.in`
- **Corporate Recruiter**: `recruiter.google@company.com`
- **Alumni Mentor**: `alumni.priya@alumni.gsfc.ac.in`
- **Faculty Coordinator**: `faculty.neeshu@gsfcuniversity.ac.in`

*(Default development passwords can be customized via `DEV_ADMIN_PASSWORD`, `DEV_STUDENT_PASSWORD`, etc. in your `.env` file).*

### 4. Run Development Server
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5001`
- **Health Check**: `http://localhost:5001/api/health`

---

## 🧪 Testing & Quality Assurance

Execute the consolidated test suites across all platform layers:
```bash
npm test
```

Build the production frontend bundle:
```bash
npm run build
```

---

## 📂 Architecture & Directory Structure

```
├── backend/
│   ├── ai/                    # LLM handlers, fallback generators & RAG modules
│   │   ├── modules/           # ATS scorer, adaptive coach, forecaster, matcher
│   │   └── llm.js             # Dual-model resilient inference engine
│   ├── config/                # Environment validation & secure startup
│   ├── db/                    # SQLite WAL database & schema migrations
│   ├── middleware/            # JWT auth, RBAC, WAF shield, rate limiters
│   ├── routes/                # Domain-specific REST route controllers
│   ├── scripts/               # Isolated developer seeding utilities
│   ├── services/              # Notification, caching, and mail services
│   ├── tests/                 # Comprehensive unit & integration test suites
│   └── utils/                 # Structured JSON logger & helper utilities
├── frontend/
│   ├── src/
│   │   ├── components/        # Domain UI views (student, recruiter, admin, alumni, faculty)
│   │   ├── context/           # AuthContext, ToastContext
│   │   └── utils/             # Client-side analytics & scoring helpers
├── docs/                      # Versioned technical specs, ADRs & legal templates
│   ├── adr/                   # Architecture Decision Records
│   ├── PRIVACY_POLICY.md      # Student PII data governance policy
│   ├── TERMS_OF_SERVICE.md    # Placement bylaws and conduct rules
│   └── DEPLOYMENT_AND_OPERATIONS.md
├── .github/workflows/         # GitHub Actions CI pipeline
├── CHANGELOG.md               # Version release history
└── SECURITY.md                # Responsible vulnerability disclosure policy
```

---

## 🔒 Security & Data Privacy

- **Password Security**: Standardized high-cost bcrypt hashing.
- **CSRF & WAF**: Double-submit cookie verification and anti-injection sanitization.
- **Accreditation Integrity**: Verifiable data exports compliant with UGC, NAAC, NIRF, NBA, and AICTE frameworks.
- **Responsible Disclosure**: See [SECURITY.md](SECURITY.md) for reporting guidelines.

---

## 📄 License

This repository is maintained for GSFC University under the [MIT License](LICENSE).
