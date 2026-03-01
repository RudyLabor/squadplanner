-- =====================================================
-- FIX: get_layout_data member count uses stale total_members cache
-- Now counts actual members from squad_members table
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
                (SELECT COUNT(*)::int FROM squad_members WHERE squad_id = s.id) as member_count,
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

-- Also fix the stale total_members cache for all squads
UPDATE squads SET total_members = (
  SELECT COUNT(*) FROM squad_members WHERE squad_id = squads.id
);
