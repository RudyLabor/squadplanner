-- =====================================================
-- SQUAD PLANNER - SECURITY HARDENING MIGRATION
-- Version: 1.0.1
-- Date: 2026-02-11
-- Description: Fix Security Advisor warnings:
--   1. Add SET search_path to all SECURITY DEFINER functions
--   2. Fix storage avatar policies with ownership checks
--   3. Move pg_trgm extension out of public schema
-- =====================================================

-- =============================================================
-- 1. SET search_path ON ALL SECURITY DEFINER FUNCTIONS
--    Prevents search path injection attacks (Supabase lint 0011)
--    Uses DO blocks to skip functions that don't exist yet
-- =============================================================

DO $$ BEGIN
  -- initial_schema.sql
  ALTER FUNCTION handle_new_user() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- schedule_reminders_cron.sql
  ALTER FUNCTION invoke_send_reminders() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- phase3_messaging.sql
  ALTER FUNCTION get_message_reactions(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_pinned_messages(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- phase4_party.sql / voice_party_tracking.sql / fix_get_friends_playing.sql
  ALTER FUNCTION get_friends_playing(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- voice_party_tracking.sql
  ALTER FUNCTION get_active_squad_parties(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION join_voice_party(TEXT) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION leave_voice_party() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- push_tokens.sql
  ALTER FUNCTION cleanup_old_push_tokens() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- performance_rpc_functions.sql
  ALTER FUNCTION get_conversations_with_stats(uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_sessions_with_rsvps(uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION batch_mark_messages_read(uuid, uuid, uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_dm_conversations_with_stats(uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION batch_mark_dms_read(uuid, uuid) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- premium_backend_security.sql
  ALTER FUNCTION count_user_squads(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION is_user_premium(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION can_create_squad(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION check_squad_creation_limit() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_user_sessions_history(UUID, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_squad_stats(UUID, UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- phase5_gamification.sql
  ALTER FUNCTION add_xp(UUID, INTEGER, TEXT, TEXT, UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION update_streak(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_squad_leaderboard(UUID) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- phase6_social_discovery.sql
  ALTER FUNCTION browse_public_squads(TEXT, TEXT, INTEGER, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_global_leaderboard(TEXT, TEXT, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION find_players_for_squad(TEXT, TEXT, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  -- phase7_backend_features.sql
  ALTER FUNCTION update_user_status(UUID, TEXT, TEXT, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION cleanup_expired_statuses() SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_thread_messages(UUID, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION get_feed_stories(UUID, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION should_send_notification(UUID, TEXT) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION search_messages(UUID, TEXT, UUID, INTEGER, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

DO $$ BEGIN
  ALTER FUNCTION search_direct_messages(UUID, TEXT, UUID, INTEGER, INTEGER) SET search_path = public;
EXCEPTION WHEN undefined_function THEN NULL; END $$;

-- =============================================================
-- 2. FIX STORAGE AVATAR POLICIES - Add ownership checks
--    Prevents users from modifying/deleting other users' avatars
-- =============================================================

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Recreate with ownership validation (user_id folder check)
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================================
-- 3. MOVE pg_trgm EXTENSION TO extensions SCHEMA
--    Prevents extension exposure via public API (lint 0014)
-- =============================================================

DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
