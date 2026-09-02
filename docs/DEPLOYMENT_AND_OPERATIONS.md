# Deployment, Observability & Disaster Recovery Runbook

This runbook documents production deployment configurations, monitoring baselines, automated database backups, and emergency rollback procedures for the **GSFC University Placement Portal**.

---

## 1. Production Architecture Overview

- **Frontend Hosting**: Vercel / Netlify / CDN edge network serving static compiled assets with SPA fallback rewrites.
- **Backend API Server**: Node.js v20+ with Express, Helmet, Socket.IO WebRTC signaling, and rate limiting on Render / VPS / On-Premise University Server.
- **Database Layer**: Embedded SQLite with Write-Ahead Logging (`journal_mode = WAL`, `synchronous = NORMAL`, `busy_timeout = 10000`) stored in persistent volume `/data/campushire.db`.

---

## 2. Environment Configuration Matrix

| Variable | Description | Production Requirement |
| :--- | :--- | :--- |
| `NODE_ENV` | Environment identifier | Must be set to `production` |
| `PORT` | API Server listening port | Default `5001` or platform injected |
| `JWT_SECRET` | Secret key for signing session tokens | 32+ character high-entropy key |
| `GEMINI_API_KEY` | Google Gemini API key | Optional (Deterministic fallback active) |
| `DATABASE_PATH` | Path to SQLite DB file | Default `./backend/db/campushire.db` |

---

## 3. Health Checks & Observability

### Endpoints
- **Liveness Probe**: `GET /api/health`
  - Returns `200 OK` with server timestamp and uptime.
  - Used by load balancers and orchestrators for basic process liveness.
- **Deep Readiness Probe**: `GET /api/health/ready`
  - Verifies SQLite read/write ping, active DB connections, memory consumption, and system metrics.
  - Returns `503 Service Unavailable` if the database is unresponsive.

### Structured Logging
All backend logs use JSON structured output via `backend/utils/logger.js`:
```json
{
  "timestamp": "2026-09-02T15:28:45.120Z",
  "level": "INFO",
  "correlationId": "req_1788362589000",
  "message": "Candidate application stage updated",
  "meta": { "applicationId": "app_102", "stage": "interview" }
}
```

---

## 4. Automated Database Backup Strategy

SQLite databases in WAL mode can be backed up online without locking readers or writers using the SQLite backup API or online copy:

```bash
# Automated Daily Cron Snapshot
sqlite3 backend/db/campushire.db ".backup 'backups/campushire_backup_$(date +%Y%m%d_%H%M%S).db'"
```

Backups should be synced to encrypted object storage (e.g. AWS S3 / Cloudflare R2 / University NAS) with a 30-day retention policy.

---

## 5. Emergency Rollback Procedure

If a deployment introduces regressions:

1. **Frontend Rollback**:
   - On Vercel: Promote the previous successful deployment via Dashboard $\to$ Deployments $\to$ *Instant Rollback*.
2. **Backend Rollback**:
   - Revert commit on `main` or deploy the previous stable container tag:
     ```bash
     git revert HEAD
     git push origin main
     ```
3. **Database Schema Rollback**:
   - Database migrations are additive (`CREATE TABLE IF NOT EXISTS`, `ALTER TABLE ADD COLUMN`).
   - If a rollback requires reverting table structures, restore the pre-deployment database backup snapshot:
     ```bash
     cp backups/campushire_backup_pre_deploy.db backend/db/campushire.db
     ```
