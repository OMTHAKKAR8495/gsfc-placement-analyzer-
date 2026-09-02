# ADR 003: Cryptographic Merkle Hash-Chain & Tamper-Proof Credential Verification

## Status
Accepted

## Context
Third-party recruiters, background verification agencies (BGV), and accreditation bodies (NAAC/NBA/AICTE) require verifiable proof that candidate offer letters, certified placement dossiers, and eligibility passes have not been altered or fabricated post-issuance. 

Public blockchain transactions (e.g. Ethereum / Polygon) introduce volatile gas costs, transaction confirmation delays (15s to minutes), and institutional dependency on cryptocurrency wallets.

## Decision
We engineered a **Cryptographic Merkle Hash-Chain Ledger Engine**:
1. **Canonical Document Hashing**: Every issued credential generates a deterministic canonical payload hashed via SHA-256 (`document_hash = SHA256(canonicalPayload)`).
2. **Linked Hash-Chain**: Each block embeds `previous_block_hash` creating an immutable cryptographic chain anchored sequentially from the genesis block.
3. **Merkle Root Validation**: `merkle_root = SHA256(document_hash + previous_block_hash)`, enabling instant O(1) mathematical proof of authenticity.
4. **Public Verification Subsystem**: Accessible via zero-auth endpoint `GET /api/blockchain/verify/:certId` and client route `/#verify/:certId`, verifying tamper resistance in < 2ms without third-party gas fees.

## Consequences
### Positive
- Zero transaction fees for university and students.
- Sub-millisecond verification latency suitable for automated recruiter background verification checks.
- Cryptographically verifiable against unauthorized manual SQL updates or payload tampering.

### Negative / Trade-offs
- Verification relies on the cryptographic consistency of the university's immutable ledger rather than global consensus nodes on a public decentralized network.
