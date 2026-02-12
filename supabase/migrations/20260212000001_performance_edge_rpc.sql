-- =====================================================
-- PERFORMANCE: RPC get_layout_data
-- Combines profile + squads with member counts into 1 query
-- Replaces 3 sequential Supabase queries in _protected.tsx
-- =====================================================

CREATE OR REPLACE FUNCTION get_layout_data(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'profile', (
      SELECT row_to_json(p)
      FROM profiles p
      WHERE p.id = p_user_id
    ),
    'squads', COALESCE(
      (SELECT json_agg(sq ORDER BY sq.created_at DESC)
       FROM (
         SELECT s.id, s.name, s.game, s.invite_code, s.owner_id,
                COALESCE(s.total_members, 1) as member_count,
                s.created_at
         FROM squad_members sm
         JOIN squads s ON s.id = sm.squad_id
         WHERE sm.user_id = p_user_id
       ) sq),
      '[]'::json
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_layout_data(uuid) TO authenticated;

-- =====================================================
-- PERFORMANCE: RPC get_home_sessions
-- Fetches upcoming sessions with RSVP counts for user's squads
-- Single query replaces 3 sequential queries in home.tsx
-- =====================================================

CREATE OR REPLACE FUNCTION get_home_sessions(p_user_id uuid, p_limit int DEFAULT 20)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(row_to_json(sess))
     FROM (
       SELECT
         s.id, s.squad_id, s.title, s.scheduled_at, s.duration_minutes,
         s.status, s.auto_confirm_threshold, s.created_by, s.created_at,
         (SELECT sr.response FROM session_rsvps sr
          WHERE sr.session_id = s.id AND sr.user_id = p_user_id
          LIMIT 1) as my_rsvp,
         json_build_object(
           'present', (SELECT count(*) FROM session_rsvps sr WHERE sr.session_id = s.id AND sr.response = 'present'),
           'absent',  (SELECT count(*) FROM session_rsvps sr WHERE sr.session_id = s.id AND sr.response = 'absent'),
           'maybe',   (SELECT count(*) FROM session_rsvps sr WHERE sr.session_id = s.id AND sr.response = 'maybe')
         ) as rsvp_counts
       FROM sessions s
       JOIN squad_members sm ON s.squad_id = sm.squad_id AND sm.user_id = p_user_id
       WHERE s.scheduled_at >= NOW()
       ORDER BY s.scheduled_at ASC
       LIMIT p_limit
     ) sess),
    '[]'::json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_home_sessions(uuid, int) TO authenticated;

-- =====================================================
-- PERFORMANCE: RPC get_squad_detail_data
-- Fetches squad + members + sessions with RSVPs in 1 query
-- Replaces 4-5 sequential queries in squad-detail.tsx
-- =====================================================

CREATE OR REPLACE FUNCTION get_squad_detail_data(p_squad_id uuid, p_user_id uuid)
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'squad', (
      SELECT row_to_json(s) FROM squads s WHERE s.id = p_squad_id
    ),
    'members', COALESCE(
      (SELECT json_agg(row_to_json(m))
       FROM (
         SELECT sm.*, p.username, p.avatar_url, p.reliability_score
         FROM squad_members sm
         LEFT JOIN profiles p ON sm.user_id = p.id
         WHERE sm.squad_id = p_squad_id
       ) m),
      '[]'::json
    ),
    'sessions', COALESCE(
      (SELECT json_agg(row_to_json(sess))
       FROM (
         SELECT
           s.id, s.squad_id, s.title, s.scheduled_at, s.duration_minutes,
           s.status, s.auto_confirm_threshold, s.created_by, s.created_at,
           (SELECT sr.response FROM session_rsvps sr
            WHERE sr.session_id = s.id AND sr.user_id = p_user_id
            LIMIT 1) as my_rsvp,
           json_build_object(
             'present', (SELECT count(*) FROM session_rsvps sr WHERE sr.session_id = s.id AND sr.response = 'present'),
             'absent',  (SELECT count(*) FROM session_rsvps sr WHERE sr.session_id = s.id AND sr.response = 'absent'),
             'maybe',   (SELECT count(*) FROM session_rsvps sr WHERE sr.session_id = s.id AND sr.response = 'maybe')
           ) as rsvp_counts
         FROM sessions s
         WHERE s.squad_id = p_squad_id
         ORDER BY s.scheduled_at ASC
       ) sess),
      '[]'::json
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_squad_detail_data(uuid, uuid) TO authenticated;
