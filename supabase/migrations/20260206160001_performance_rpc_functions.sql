-- =====================================================
-- PERFORMANCE OPTIMIZATION: Batch RPC Functions
-- Eliminates N+1 queries for conversations, sessions, and messages
-- =====================================================

-- Function to get all conversations with last message and unread count in ONE query
-- Replaces: 20+ individual queries with 1 single query
CREATE OR REPLACE FUNCTION get_conversations_with_stats(p_user_id uuid)
RETURNS TABLE (
  conversation_id text,
  conversation_type text,
  squad_id uuid,
  session_id uuid,
  name text,
  last_message_id uuid,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  last_message_sender_username text,
  last_message_sender_avatar text,
  unread_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH user_squads AS (
    SELECT sm.squad_id
    FROM squad_members sm
    WHERE sm.user_id = p_user_id
  ),
  squad_messages AS (
    SELECT DISTINCT ON (m.squad_id)
      m.id,
      m.squad_id,
      m.content,
      m.created_at,
      m.sender_id,
      p.username,
      p.avatar_url
    FROM messages m
    JOIN user_squads us ON m.squad_id = us.squad_id
    LEFT JOIN profiles p ON m.sender_id = p.id
    WHERE m.session_id IS NULL
    ORDER BY m.squad_id, m.created_at DESC
  ),
  unread_counts AS (
    SELECT
      m.squad_id,
      COUNT(*) as count
    FROM messages m
    JOIN user_squads us ON m.squad_id = us.squad_id
    WHERE m.session_id IS NULL
      AND NOT (m.read_by @> ARRAY[p_user_id])
    GROUP BY m.squad_id
  )
  SELECT
    'squad-' || s.id::text as conversation_id,
    'squad'::text as conversation_type,
    s.id as squad_id,
    NULL::uuid as session_id,
    s.name,
    sm.id as last_message_id,
    sm.content as last_message_content,
    sm.created_at as last_message_created_at,
    sm.sender_id as last_message_sender_id,
    sm.username as last_message_sender_username,
    sm.avatar_url as last_message_sender_avatar,
    COALESCE(uc.count, 0) as unread_count
  FROM squads s
  JOIN user_squads us ON s.id = us.squad_id
  LEFT JOIN squad_messages sm ON s.id = sm.squad_id
  LEFT JOIN unread_counts uc ON s.id = uc.squad_id
  ORDER BY COALESCE(sm.created_at, '1970-01-01'::timestamptz) DESC;
END;
$$;

-- Function to get sessions with RSVPs in ONE query (fixes N+1 in useSessions)
CREATE OR REPLACE FUNCTION get_sessions_with_rsvps(p_user_id uuid)
RETURNS TABLE (
  session_id uuid,
  squad_id uuid,
  squad_name text,
  title text,
  scheduled_at timestamptz,
  duration_minutes int,
  auto_confirmed boolean,
  confirmation_threshold int,
  created_by uuid,
  created_at timestamptz,
  rsvp_user_id uuid,
  rsvp_status text,
  rsvp_created_at timestamptz,
  rsvp_username text,
  rsvp_avatar_url text
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as session_id,
    s.squad_id,
    sq.name as squad_name,
    s.title,
    s.scheduled_at,
    s.duration_minutes,
    s.auto_confirmed,
    s.confirmation_threshold,
    s.created_by,
    s.created_at,
    sr.user_id as rsvp_user_id,
    sr.status as rsvp_status,
    sr.created_at as rsvp_created_at,
    p.username as rsvp_username,
    p.avatar_url as rsvp_avatar_url
  FROM sessions s
  JOIN squads sq ON s.squad_id = sq.id
  JOIN squad_members sm ON s.squad_id = sm.squad_id AND sm.user_id = p_user_id
  LEFT JOIN session_rsvps sr ON s.id = sr.session_id
  LEFT JOIN profiles p ON sr.user_id = p.id
  WHERE s.scheduled_at >= NOW() - INTERVAL '1 day'
  ORDER BY s.scheduled_at ASC;
END;
$$;

-- Function to batch mark messages as read in ONE query
-- Replaces: 50 individual UPDATE queries with 1 single query
CREATE OR REPLACE FUNCTION batch_mark_messages_read(
  p_user_id uuid,
  p_squad_id uuid,
  p_session_id uuid DEFAULT NULL
)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_count int;
BEGIN
  IF p_session_id IS NOT NULL THEN
    UPDATE messages
    SET read_by = array_append(read_by, p_user_id)
    WHERE squad_id = p_squad_id
      AND session_id = p_session_id
      AND NOT (read_by @> ARRAY[p_user_id]);
  ELSE
    UPDATE messages
    SET read_by = array_append(read_by, p_user_id)
    WHERE squad_id = p_squad_id
      AND session_id IS NULL
      AND NOT (read_by @> ARRAY[p_user_id]);
  END IF;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Function to get DM conversations with last message in ONE query
CREATE OR REPLACE FUNCTION get_dm_conversations_with_stats(p_user_id uuid)
RETURNS TABLE (
  other_user_id uuid,
  other_username text,
  other_avatar_url text,
  last_message_id uuid,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  unread_count bigint
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  WITH dm_partners AS (
    SELECT DISTINCT
      CASE
        WHEN dm.sender_id = p_user_id THEN dm.receiver_id
        ELSE dm.sender_id
      END as partner_id
    FROM direct_messages dm
    WHERE dm.sender_id = p_user_id OR dm.receiver_id = p_user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE
        WHEN dm.sender_id = p_user_id THEN dm.receiver_id
        ELSE dm.sender_id
      END
    )
      dm.id,
      dm.content,
      dm.created_at,
      dm.sender_id,
      CASE
        WHEN dm.sender_id = p_user_id THEN dm.receiver_id
        ELSE dm.sender_id
      END as partner_id
    FROM direct_messages dm
    WHERE dm.sender_id = p_user_id OR dm.receiver_id = p_user_id
    ORDER BY
      CASE
        WHEN dm.sender_id = p_user_id THEN dm.receiver_id
        ELSE dm.sender_id
      END,
      dm.created_at DESC
  ),
  unread_counts AS (
    SELECT
      dm.sender_id as partner_id,
      COUNT(*) as count
    FROM direct_messages dm
    WHERE dm.receiver_id = p_user_id
      AND dm.read_at IS NULL
    GROUP BY dm.sender_id
  )
  SELECT
    dp.partner_id as other_user_id,
    p.username as other_username,
    p.avatar_url as other_avatar_url,
    lm.id as last_message_id,
    lm.content as last_message_content,
    lm.created_at as last_message_created_at,
    lm.sender_id as last_message_sender_id,
    COALESCE(uc.count, 0) as unread_count
  FROM dm_partners dp
  JOIN profiles p ON dp.partner_id = p.id
  LEFT JOIN last_messages lm ON dp.partner_id = lm.partner_id
  LEFT JOIN unread_counts uc ON dp.partner_id = uc.partner_id
  ORDER BY COALESCE(lm.created_at, '1970-01-01'::timestamptz) DESC;
END;
$$;

-- Function to batch mark DMs as read
CREATE OR REPLACE FUNCTION batch_mark_dms_read(
  p_user_id uuid,
  p_other_user_id uuid
)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  updated_count int;
BEGIN
  UPDATE direct_messages
  SET read_at = NOW()
  WHERE receiver_id = p_user_id
    AND sender_id = p_other_user_id
    AND read_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_squad_session_read
  ON messages(squad_id, session_id, read_by);

CREATE INDEX IF NOT EXISTS idx_messages_created_at_desc
  ON messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_participants
  ON direct_messages(sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_unread
  ON direct_messages(receiver_id, read_at)
  WHERE read_at IS NULL;

-- Index for upcoming sessions (without WHERE clause, as NOW() is not immutable)
CREATE INDEX IF NOT EXISTS idx_sessions_scheduled
  ON sessions(scheduled_at DESC);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_conversations_with_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sessions_with_rsvps(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_mark_messages_read(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dm_conversations_with_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION batch_mark_dms_read(uuid, uuid) TO authenticated;
