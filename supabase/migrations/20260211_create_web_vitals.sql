-- Web Vitals analytics table
-- Stores Core Web Vitals metrics (LCP, FCP, CLS, TTFB, INP) from production users.

CREATE TABLE IF NOT EXISTS web_vitals (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  metric_name text NOT NULL,
  metric_value numeric NOT NULL,
  rating text NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  page_url text NOT NULL,
  user_agent text,
  connection_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for querying by metric and time
CREATE INDEX idx_web_vitals_metric_time ON web_vitals(metric_name, created_at DESC);

-- Enable RLS but allow service role
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;
