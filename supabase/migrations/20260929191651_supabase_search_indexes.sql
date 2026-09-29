-- ==========================================
-- CONNECTX: SEARCH PERFORMANCE & pg_trgm
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm 
ON profiles USING gin (username_normalized gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm 
ON profiles USING gin (display_name gin_trgm_ops);
