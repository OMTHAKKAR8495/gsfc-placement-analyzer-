# ADR 002: Embedded SQLite Architecture with Write-Ahead Logging (WAL) and Multi-Cloud Readiness

## Status
Accepted

## Context
GSFC University requires an institutional database that delivers:
- Fast read/write latency (< 1ms) for real-time candidate matchmaking and analytics dashboards.
- Zero external database provisioning dependencies for local developer workflows and on-premise university server deployment.
- High concurrent read performance across hundreds of simultaneous student assessments.

## Decision
We adopted **Embedded SQLite with Write-Ahead Logging (WAL)** using `better-sqlite3` and `@libsql/client`:
1. **WAL Mode & Pragma Optimizations**:
   - `journal_mode = WAL`: Permits concurrent readers without blocking writers.
   - `synchronous = NORMAL`: Ensures durability while maximizing disk I/O throughput.
   - `busy_timeout = 10000`: Eliminates SQLite database locking contention under burst traffic.
   - `foreign_keys = ON`: Enforces relational integrity across applications, student profiles, and drives.
2. **Serverless & Multi-Cloud Portability**:
   - Automated schema migrations (`applyMigrations()`) ensure the DB self-heals across cold starts.
   - LibSQL driver support allows zero-code transition to distributed cloud DBs (Turso / PostgreSQL) when scaling institutional infrastructure.

## Consequences
### Positive
- Self-contained, zero-configuration deployment on university servers and local offline machines.
- Instant atomic rollbacks and ACID compliance.
- Transparent single-file backup (`campushire.db`) for automated disaster recovery.

### Negative / Trade-offs
- Multi-region distributed writes require moving to LibSQL / PostgreSQL replica clusters.
