-- Enhanced error tracking: add breadcrumbs, tags, and username
-- Allows richer context for error reports (navigation history, environment tags, user identity)

-- Add new columns to error_reports table
ALTER TABLE error_reports
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS breadcrumbs jsonb,
  ADD COLUMN IF NOT EXISTS tags jsonb;

-- Add index for filtering by browser/device (common query pattern)
CREATE INDEX IF NOT EXISTS idx_error_reports_tags ON error_reports USING gin (tags);

-- Add comment for new columns
COMMENT ON COLUMN error_reports.username IS 'Username of the user who encountered the error (denormalized for easier queries)';
COMMENT ON COLUMN error_reports.breadcrumbs IS 'Array of breadcrumbs (navigation history) leading up to the error';
COMMENT ON COLUMN error_reports.tags IS 'Environment tags (browser, device, platform, connection type, etc.)';
