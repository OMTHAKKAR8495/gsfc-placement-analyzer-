# ADR 001: Multi-Tiered AI Grading and Deterministic Fallback Strategy

## Status
Accepted

## Context
Campus recruitment workflows at GSFC University require continuous, high-availability AI evaluations (ATS scoring, real-time interview question generation, behavioral answers assessment, and predictive readiness). Reliance solely on third-party cloud LLMs (such as Google Gemini API) introduces vulnerabilities:
- Rate limits (e.g. during peak campus drive hours with 500+ concurrent students).
- Network latency or intermittent cloud downtime.
- Privacy constraints where mock interview evaluations must run in disconnected intranet/offline scenarios.

## Decision
We implemented a **Dual-Model Resilient Architecture with Deterministic Heuristic Fallbacks**:
1. **Tier 1 (Primary Cloud AI)**: Google Gemini (`gemini-1.5-flash` / `gemini-1.5-pro`) with structured JSON schema enforcement via temperature-controlled prompts.
2. **Tier 2 (Structured Local Fallback Engine)**: If the primary LLM call fails, times out, or triggers a quota limit, the request is caught by the `fallbackGenerator` in `backend/ai/llm.js`.
3. **Deterministic Scoring Pipeline**: All AI modules (`atsScorer.js`, `mockInterviewCoach.js`, `placementForecaster.js`, `matchingEngine.js`) implement zero-latency, rule-based algorithmic models (NLP keyword TF-IDF vectors, STAR rubric matchers, and statistical logistic scoring) ensuring **100% uptime with 0ms interruption**.

## Consequences
### Positive
- Zero downtime during critical campus placement sessions even without internet access or valid API keys.
- Predictable and auditable scoring baselines compliant with university academic standards.
- Reduced API billing and latency for routine calculations.

### Negative / Trade-offs
- Fallback evaluations lack the nuanced conversational prose of large frontier LLMs, though structured scores and recommendations remain mathematically consistent.
