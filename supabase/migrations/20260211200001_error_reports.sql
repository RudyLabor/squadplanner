-- Error reports table for the micro error tracker (replaces Sentry)
-- Receives batched error reports from the error-report Edge Function

CREATE TABLE IF NOT EXISTS error_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  message text NOT NULL,
  stack text,
  url text,
  timestamp timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  level text NOT NULL DEFAULT 'error' CHECK (level IN ('error', 'warning', 'info')),
  extra jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by time (most recent errors first)
CREATE INDEX idx_error_reports_created_at ON error_reports (created_at DESC);

-- Index for filtering by user
CREATE INDEX idx_error_reports_user_id ON error_reports (user_id) WHERE user_id IS NOT NULL;

-- Index for filtering by level
CREATE INDEX idx_error_reports_level ON error_reports (level);

-- RLS: only service_role can insert (Edge Function uses service role key)
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- No public access - only the Edge Function (via service_role) can write
-- Authenticated users can read their own errors (optional, for debugging)
CREATE POLICY "Users can view their own error reports"
  ON error_reports
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Auto-cleanup: delete error reports older than 30 days
-- Run via pg_cron: SELECT cron.schedule('cleanup-error-reports', '0 3 * * *', $$DELETE FROM error_reports WHERE created_at < now() - interval '30 days'$$);

COMMENT ON TABLE error_reports IS 'Client-side error reports collected by the micro error tracker (replacement for Sentry)';
