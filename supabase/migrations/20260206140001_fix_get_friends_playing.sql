-- =====================================================
-- FIX: get_friends_playing ambiguous user_id reference
-- Le paramètre user_id était en conflit avec la colonne user_id
-- =====================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_friends_playing(UUID);

-- Recréer avec le paramètre renommé en p_user_id
CREATE OR REPLACE FUNCTION get_friends_playing(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    avatar_url TEXT,
    current_game TEXT,
    last_seen_at TIMESTAMPTZ,
    squad_id UUID,
    squad_name TEXT,
    party_member_count INTEGER,
    voice_channel_id TEXT,
    is_in_voice BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (p.id)
        p.id as friend_id,
        p.username,
        p.avatar_url,
        p.current_game,
        p.last_seen_at,
        sm2.squad_id,
        s.name as squad_name,
        (
            SELECT COUNT(*)::INTEGER
            FROM profiles p2
            JOIN squad_members sm3 ON sm3.user_id = p2.id
            WHERE sm3.squad_id = sm2.squad_id
              AND p2.voice_channel_id IS NOT NULL
              AND p2.voice_channel_id = p.voice_channel_id
        ) as party_member_count,
        p.voice_channel_id,
        (p.voice_channel_id IS NOT NULL) as is_in_voice
    FROM profiles p
    JOIN squad_members sm1 ON sm1.user_id = p_user_id
    JOIN squad_members sm2 ON sm2.squad_id = sm1.squad_id AND sm2.user_id = p.id
    JOIN squads s ON s.id = sm2.squad_id
    WHERE p.id != p_user_id
      AND (
        (p.current_game IS NOT NULL AND p.last_seen_at > NOW() - INTERVAL '15 minutes')
        OR p.voice_channel_id IS NOT NULL
      )
    ORDER BY p.id, p.voice_channel_id DESC NULLS LAST, p.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_friends_playing(UUID) TO authenticated;
