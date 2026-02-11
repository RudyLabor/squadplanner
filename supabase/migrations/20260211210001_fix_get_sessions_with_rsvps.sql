-- Fix get_sessions_with_rsvps: correct column names
-- sessions.auto_confirmed does not exist -> use sessions.status
-- sessions.confirmation_threshold does not exist -> use sessions.auto_confirm_threshold
-- session_rsvps.status does not exist -> use session_rsvps.response
-- session_rsvps.created_at does not exist -> use session_rsvps.responded_at

CREATE OR REPLACE FUNCTION get_sessions_with_rsvps(p_user_id uuid)
RETURNS TABLE (
  session_id uuid,
  squad_id uuid,
  squad_name text,
  title text,
  scheduled_at timestamptz,
  duration_minutes int,
  status text,
  auto_confirm_threshold int,
  created_by uuid,
  created_at timestamptz,
  rsvp_user_id uuid,
  rsvp_response text,
  rsvp_responded_at timestamptz,
  rsvp_username text,
  rsvp_avatar_url text
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id as session_id,
    s.squad_id,
    sq.name as squad_name,
    s.title,
    s.scheduled_at,
    s.duration_minutes,
    s.status::text,
    s.auto_confirm_threshold,
    s.created_by,
    s.created_at,
    sr.user_id as rsvp_user_id,
    sr.response::text as rsvp_response,
    sr.responded_at as rsvp_responded_at,
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
