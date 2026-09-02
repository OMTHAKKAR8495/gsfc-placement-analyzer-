# Changelog

All notable changes to the GSFC Placement Analyzer platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-09-02

### Added
- **AI Adaptive Interview & Video Prep Engine**: Real-time difficulty calibration (Level 1 Diagnostic $\to$ Level 2 Applied Engineering $\to$ Level 3 High-Concurrency Architecture) and company question banks for Google, Microsoft, Amazon, GSFC Ltd, and TCS.
- **Speech Articulation & Telemetry**: Integrated Words-Per-Minute (WPM) tracking, filler-words detection, and webcam engagement analysis.
- **Mathematical Predictive Analytics**: Centered multi-factor logistic regression model ($P(\text{Placement}) = \frac{1}{1 + e^{-z}}$) with explainable continuous at-risk factor decomposition.
- **Alumni Mentorship Marketplace**: Multi-factor candidate-mentor matching engine, 1:1 slot booking, and verified student review & rating system.
- **Recruiter CRM Pipeline**: Candidate status progression (`applied` $\to$ `shortlisted` $\to$ `assessment` $\to$ `interview` $\to$ `offered` $\to$ `joined` $\to$ `rejected`) and custom drive evaluation rubrics.
- **Multi-Standard Accreditation Exporters**: 1-click CSV reports formatted for NAAC Metric 5.2.1, NIRF Table 3A, NBA Tier-1 Placement Index, and AICTE-CII Placement Survey.
- **Cryptographic Merkle Hash-Chain**: Sequential SHA-256 block ledger with public zero-auth verification (`GET /api/blockchain/verify/:certId`) and whole-chain tamper audit.
- **Infrastructure Hardening**: Fail-fast environment configuration validator, structured JSON logger, and `/api/health/ready` deep readiness endpoints.
- **Developer Seeder**: Isolated test account seeder script (`backend/scripts/seedDevAccounts.js`) using high-entropy bcrypt password hashing.

### Security
- Standardized bcrypt password hashing across all registration and authentication endpoints.
- Double-submit cookie CSRF validation and WAF payload sanitization.
- In-memory & storage SHA-256 Merkle root verification preventing credential tampering.
- Role-based authorization guardrails blocking Insecure Direct Object References (IDOR).
