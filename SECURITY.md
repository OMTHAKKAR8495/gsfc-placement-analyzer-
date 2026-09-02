# Security Policy & Vulnerability Disclosure

GSFC University Training & Placement Cell and the CampusHire engineering team are committed to ensuring the highest standards of data security, cryptographic integrity, and student privacy.

## Supported Versions

Security patches and updates are actively maintained for the following versions:

| Version | Supported          | Status |
| :--- | :--- | :--- |
| `1.0.x` | :white_check_mark: | Active Production Release |
| `< 1.0.0` | :x: | Deprecated Prototypes |

## Responsible Disclosure Policy

If you discover a security vulnerability or potential data exposure within this platform, we ask that you responsibly disclose it to our technical security team prior to public announcement.

### Reporting a Vulnerability

1. **Email Details**: Send a detailed description of the issue to `security@gsfcuniversity.ac.in` or `omthakkar8495@gmail.com`.
2. **Include Proof of Concept**: Provide clear steps to reproduce the vulnerability (including HTTP requests, payloads, and affected endpoints).
3. **Safe Harbor**: Do not attempt to access, exfiltrate, or modify candidate academic records, offer letter credentials, or production student PII.

### Response Timelines & SLAs

- **Initial Response**: Within 24 hours of receiving the report.
- **Triage & Severity Rating**: Within 48 hours.
- **Remediation & Patch Deployment**: Critical issues within 72 hours; standard vulnerabilities within 7 business days.

## Core Security Controls & Architecture

- **Authentication & Password Security**: Standardized high-entropy bcrypt password hashing (cost factor 10+) across all user roles.
- **Multi-Tenant RBAC Isolation**: Role-based access controls enforcing strict boundary isolation between Students, Corporate Recruiters, Faculty, Security Staff, and TPC Administrators.
- **SQL Injection Defenses**: 100% parameterized queries via SQLite WAL prepared statements.
- **In-Memory & Storage Cryptography**: Canonical SHA-256 Merkle hash-chain anchoring preventing credential tampering.
- **WAF & Security Headers**: Helmet HTTP headers (Strict CSP, HSTS, X-Frame-Options DENY) and rate limiting on sensitive authentication gateways.
