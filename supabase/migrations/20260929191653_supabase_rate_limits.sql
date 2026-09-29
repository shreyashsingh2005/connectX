-- ==========================================
-- CONNECTX: RATE LIMITING TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS api_rate_limits (
  ip TEXT PRIMARY KEY,
  attempts INT DEFAULT 1,
  last_attempt TIMESTAMPTZ DEFAULT NOW()
);

-- Note: In a real multi-region deployment, Redis (Upstash) is strongly preferred.
-- This table is a fallback for DB-backed rate limiting.
