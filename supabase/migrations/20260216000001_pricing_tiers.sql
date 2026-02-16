-- ============================================================
-- Migration: Pricing Tiers Restructuration (Phase 1)
-- Adds squad_leader and club tiers, get_user_tier(),
-- session rate limiting, and makes subscriptions.squad_id nullable
-- ============================================================

-- 1. Add new enum values to subscription_tier
-- Note: ALTER TYPE ... ADD VALUE cannot run inside a transaction in some PG versions.
-- Supabase migrations run each file as a single transaction, so we use
-- a DO block with exception handling for idempotency.
DO $$
BEGIN
  ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'squad_leader';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'club';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Make subscriptions.squad_id nullable (for personal subscriptions)
ALTER TABLE subscriptions ALTER COLUMN squad_id DROP NOT NULL;

-- 3. Create get_user_tier() function to replace is_user_premium() binary check
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_tier TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  SELECT subscription_tier::TEXT, subscription_expires_at
  INTO v_tier, v_expires_at
  FROM profiles
  WHERE id = p_user_id;

  IF v_tier IS NULL OR v_tier = 'free' THEN
    RETURN 'free';
  END IF;

  -- Check expiration
  IF v_expires_at IS NOT NULL AND v_expires_at < now() THEN
    RETURN 'free';
  END IF;

  RETURN v_tier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Update can_create_squad() to use tier-based limits
CREATE OR REPLACE FUNCTION can_create_squad(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  v_tier := get_user_tier(p_user_id);

  -- Get current squad count
  SELECT COUNT(*) INTO v_count
  FROM squad_members
  WHERE user_id = p_user_id;

  -- Tier-based limits
  CASE v_tier
    WHEN 'club' THEN RETURN TRUE;  -- unlimited
    WHEN 'squad_leader' THEN RETURN TRUE;  -- unlimited
    WHEN 'premium' THEN v_limit := 5;
    ELSE v_limit := 1;  -- free
  END CASE;

  RETURN v_count < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Rate limiting: check session creation limit for Free tier
CREATE OR REPLACE FUNCTION check_session_creation_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
BEGIN
  v_tier := get_user_tier(NEW.created_by);

  IF v_tier = 'free' THEN
    SELECT COUNT(*) INTO v_count
    FROM sessions
    WHERE created_by = NEW.created_by
      AND created_at > now() - interval '7 days';

    IF v_count >= 3 THEN
      RAISE EXCEPTION 'Limite de 3 sessions/semaine atteinte (tier Free). Passe Premium pour des sessions illimitées.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger (drop first if exists for idempotency)
DROP TRIGGER IF EXISTS enforce_session_limit ON sessions;
CREATE TRIGGER enforce_session_limit
  BEFORE INSERT ON sessions
  FOR EACH ROW EXECUTE FUNCTION check_session_creation_limit();

-- 6. Update get_user_sessions_history() for new tier limits
DROP FUNCTION IF EXISTS get_user_sessions_history(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_sessions_history(UUID);
CREATE OR REPLACE FUNCTION get_user_sessions_history(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS SETOF sessions AS $$
DECLARE
  v_tier TEXT;
  v_days INTEGER;
BEGIN
  v_tier := get_user_tier(p_user_id);

  CASE v_tier
    WHEN 'club' THEN v_days := 3650;  -- ~10 years
    WHEN 'squad_leader' THEN v_days := 3650;  -- unlimited
    WHEN 'premium' THEN v_days := 90;
    ELSE v_days := 7;  -- free: 7 days
  END CASE;

  RETURN QUERY
  SELECT s.*
  FROM sessions s
  JOIN squad_members sm ON sm.squad_id = s.squad_id
  WHERE sm.user_id = p_user_id
    AND s.scheduled_at > now() - make_interval(days := v_days)
  ORDER BY s.scheduled_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Update get_squad_stats() for tier-based access
DROP FUNCTION IF EXISTS get_squad_stats(UUID, UUID);
CREATE OR REPLACE FUNCTION get_squad_stats(p_squad_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_tier TEXT;
  v_basic JSON;
  v_advanced JSON;
BEGIN
  v_tier := get_user_tier(p_user_id);

  -- Basic stats (available to all)
  SELECT json_build_object(
    'total_sessions', COALESCE(sq.total_sessions, 0),
    'total_members', COALESCE(sq.total_members, 0),
    'avg_reliability', COALESCE(sq.avg_reliability_score, 0)
  ) INTO v_basic
  FROM squads sq
  WHERE sq.id = p_squad_id;

  -- Free tier: basic stats only
  IF v_tier = 'free' THEN
    RETURN v_basic;
  END IF;

  -- Premium+ tiers: advanced stats
  SELECT json_build_object(
    'basic', v_basic,
    'attendance_trend', (
      SELECT json_agg(json_build_object(
        'week', date_trunc('week', s.scheduled_at),
        'count', COUNT(*),
        'avg_rsvp', AVG(CASE WHEN sr.response = 'present' THEN 1.0 ELSE 0.0 END)
      ))
      FROM sessions s
      LEFT JOIN session_rsvps sr ON sr.session_id = s.id
      WHERE s.squad_id = p_squad_id
        AND s.scheduled_at > now() - interval '90 days'
      GROUP BY date_trunc('week', s.scheduled_at)
      ORDER BY date_trunc('week', s.scheduled_at) DESC
      LIMIT 12
    ),
    'top_players', (
      SELECT json_agg(json_build_object(
        'user_id', p.id,
        'username', p.username,
        'reliability', p.reliability_score,
        'sessions_attended', COUNT(sr.id)
      ) ORDER BY COUNT(sr.id) DESC)
      FROM squad_members sm
      JOIN profiles p ON p.id = sm.user_id
      LEFT JOIN session_rsvps sr ON sr.user_id = sm.user_id AND sr.response = 'present'
      LEFT JOIN sessions s ON s.id = sr.session_id AND s.squad_id = p_squad_id
      WHERE sm.squad_id = p_squad_id
      GROUP BY p.id, p.username, p.reliability_score
      LIMIT 10
    ),
    'most_active_day', (
      SELECT json_build_object(
        'day', EXTRACT(DOW FROM s.scheduled_at),
        'count', COUNT(*)
      )
      FROM sessions s
      WHERE s.squad_id = p_squad_id
        AND s.scheduled_at > now() - interval '90 days'
      GROUP BY EXTRACT(DOW FROM s.scheduled_at)
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO v_advanced;

  RETURN v_advanced;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
