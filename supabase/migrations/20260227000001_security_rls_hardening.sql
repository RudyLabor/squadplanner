-- ============================================================
-- Migration: Security RLS & SECURITY DEFINER Hardening
-- SEC: Fixes overly permissive RLS policies and adds auth.uid()
--      checks to SECURITY DEFINER functions to prevent
--      unauthorized access to other users' data.
-- ============================================================

-- ============================================================
-- PART 1: Fix overly permissive RLS INSERT policies
-- ============================================================

-- C07: notifications INSERT — was WITH CHECK(true), allowing any
-- authenticated user to insert notifications for any user.
-- Fix: Only allow inserting notifications where user_id matches
-- the authenticated user, OR allow service role (auth.uid() IS NULL)
-- to insert for any user (e.g., system notifications from Edge Functions).
DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL  -- service role (Edge Functions)
    OR auth.uid() = user_id  -- user can only insert for themselves
  );

-- C09: referrals INSERT — was WITH CHECK(true), allowing any
-- authenticated user to create referral records impersonating others.
-- Fix: Only allow inserting referrals where referrer_id matches auth.uid()
DROP POLICY IF EXISTS referrals_insert ON referrals;
CREATE POLICY "Users can insert own referrals"
  ON referrals FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL  -- service role (Edge Functions)
    OR auth.uid() = referrer_id  -- user can only create referrals as themselves
  );


-- ============================================================
-- PART 2: Harden SECURITY DEFINER functions with auth.uid() checks
-- These functions run with elevated privileges (as the function owner).
-- Without auth.uid() checks, a regular user could call them with
-- any p_user_id to access or manipulate other users' data.
--
-- Strategy: IF auth.uid() IS NOT NULL (regular user call, not service role)
--           AND auth.uid() != p_user_id, THEN RAISE EXCEPTION.
--           This allows Edge Functions (service role, auth.uid()=NULL)
--           to call these functions for any user.
-- ============================================================

-- C10: get_user_tier() — Returns a user's subscription tier.
-- Risk without check: User A could query User B's tier.
CREATE OR REPLACE FUNCTION get_user_tier(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_tier TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- SEC: Prevent users from querying other users' tier
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot access other users data';
  END IF;

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

-- C10: can_create_squad() — Checks if user can create a new squad.
-- Risk without check: User A could check User B's squad limits.
CREATE OR REPLACE FUNCTION can_create_squad(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- SEC: Prevent users from querying other users' squad limits
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot access other users data';
  END IF;

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

-- C11: get_user_sessions_history() — Returns session history for a user.
-- Risk without check: User A could view User B's full session history.
DROP FUNCTION IF EXISTS get_user_sessions_history(UUID, INTEGER);
DROP FUNCTION IF EXISTS get_user_sessions_history(UUID);
CREATE OR REPLACE FUNCTION get_user_sessions_history(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS SETOF sessions AS $$
DECLARE
  v_tier TEXT;
  v_days INTEGER;
BEGIN
  -- SEC: Prevent users from viewing other users' session history
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot access other users data';
  END IF;

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

-- C12: get_squad_stats() — Returns squad statistics.
-- Risk without check: User A could view detailed stats using User B's tier.
DROP FUNCTION IF EXISTS get_squad_stats(UUID, UUID);
CREATE OR REPLACE FUNCTION get_squad_stats(p_squad_id UUID, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_tier TEXT;
  v_basic JSON;
  v_advanced JSON;
BEGIN
  -- SEC: Prevent users from accessing stats as another user
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot access other users data';
  END IF;

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

-- C12: process_referral_signup() — Processes a referral when a new user signs up.
-- Risk without check: User A could trigger referral rewards for User B.
CREATE OR REPLACE FUNCTION process_referral_signup(p_referral_code TEXT, p_new_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_reward_xp INTEGER := 50;
BEGIN
  -- SEC: Prevent users from processing referrals as another user
  IF auth.uid() IS NOT NULL AND auth.uid() != p_new_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot process referral for other users';
  END IF;

  -- Find referrer by code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code;

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid referral code');
  END IF;

  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_new_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already referred');
  END IF;

  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, p_new_user_id, 'completed')
  RETURNING id INTO v_referral_id;

  -- Reward referrer with XP
  UPDATE profiles
  SET xp = COALESCE(xp, 0) + v_reward_xp
  WHERE id = v_referrer_id;

  -- Reward new user with XP
  UPDATE profiles
  SET xp = COALESCE(xp, 0) + v_reward_xp,
      referred_by = v_referrer_id
  WHERE id = p_new_user_id;

  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'reward_xp', v_reward_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- C12: get_referral_stats() — Returns referral statistics for a user.
-- Risk without check: User A could view User B's referral stats.
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_total_xp INTEGER;
BEGIN
  -- SEC: Prevent users from viewing other users' referral stats
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Access denied: cannot access other users data';
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COALESCE(COUNT(*) FILTER (WHERE status = 'completed') * 50, 0)
  INTO v_total, v_completed, v_total_xp
  FROM referrals
  WHERE referrer_id = p_user_id;

  RETURN json_build_object(
    'total_referrals', v_total,
    'completed_referrals', v_completed,
    'total_xp_earned', v_total_xp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Note: check_session_creation_limit() is a TRIGGER function that uses NEW.created_by
-- (the value from the INSERT), not a user-provided parameter. Trigger functions
-- cannot be called directly by users, so no auth.uid() check is needed.
