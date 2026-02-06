-- =====================================================
-- PHASE 4 - PARTY VOCALE FEATURES
-- Friends Playing, Current Game Status
-- =====================================================

-- Ajouter current_game et last_seen_at à profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_game TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Index pour "Friends Playing" queries
CREATE INDEX IF NOT EXISTS idx_profiles_current_game ON profiles(current_game) WHERE current_game IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen_at DESC);

-- Fonction pour mettre à jour last_seen automatiquement
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_seen_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger sur profiles pour last_seen
DROP TRIGGER IF EXISTS update_profiles_last_seen ON profiles;
CREATE TRIGGER update_profiles_last_seen
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    WHEN (OLD.current_game IS DISTINCT FROM NEW.current_game)
    EXECUTE FUNCTION update_last_seen();

-- Fonction pour obtenir les amis qui jouent actuellement
-- Note: cette fonction sera mise à jour dans voice_party_tracking.sql avec plus de colonnes
DROP FUNCTION IF EXISTS get_friends_playing(UUID);
CREATE OR REPLACE FUNCTION get_friends_playing(user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    username TEXT,
    avatar_url TEXT,
    current_game TEXT,
    last_seen_at TIMESTAMPTZ,
    squad_id UUID,
    squad_name TEXT,
    party_member_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.id as friend_id,
        p.username,
        p.avatar_url,
        p.current_game,
        p.last_seen_at,
        sm2.squad_id,
        s.name as squad_name,
        (SELECT COUNT(*)::INTEGER FROM squad_members WHERE squad_id = sm2.squad_id) as party_member_count
    FROM profiles p
    -- Trouver les squads en commun
    JOIN squad_members sm1 ON sm1.user_id = user_id
    JOIN squad_members sm2 ON sm2.squad_id = sm1.squad_id AND sm2.user_id = p.id
    JOIN squads s ON s.id = sm2.squad_id
    WHERE p.id != user_id
      AND p.current_game IS NOT NULL
      AND p.last_seen_at > NOW() - INTERVAL '15 minutes'
    ORDER BY p.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_friends_playing(UUID) TO authenticated;

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 4 Party migration completed!';
    RAISE NOTICE '🎮 New columns: profiles.current_game, profiles.last_seen_at';
    RAISE NOTICE '👥 New function: get_friends_playing(user_id)';
END $$;
