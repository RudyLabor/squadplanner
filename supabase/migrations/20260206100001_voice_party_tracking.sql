-- =====================================================
-- VOICE PARTY TRACKING
-- Permet aux membres d'une squad de voir qui est en Party vocale
-- =====================================================

-- Ajouter le tracking du channel vocal actif
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_channel_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS voice_joined_at TIMESTAMPTZ;

-- Index pour les requêtes "qui est en party"
CREATE INDEX IF NOT EXISTS idx_profiles_voice_channel ON profiles(voice_channel_id) WHERE voice_channel_id IS NOT NULL;

-- Supprimer l'ancienne fonction pour pouvoir changer le type de retour
DROP FUNCTION IF EXISTS get_friends_playing(UUID);

-- Mettre à jour la fonction get_friends_playing pour inclure les gens en Party vocale
CREATE OR REPLACE FUNCTION get_friends_playing(user_id UUID)
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
        -- Compter combien de membres de la squad sont dans le même channel vocal
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
    -- Trouver les squads en commun
    JOIN squad_members sm1 ON sm1.user_id = user_id
    JOIN squad_members sm2 ON sm2.squad_id = sm1.squad_id AND sm2.user_id = p.id
    JOIN squads s ON s.id = sm2.squad_id
    WHERE p.id != user_id
      AND (
        -- Soit en train de jouer (game actif récent)
        (p.current_game IS NOT NULL AND p.last_seen_at > NOW() - INTERVAL '15 minutes')
        -- Soit en Party vocale active
        OR p.voice_channel_id IS NOT NULL
      )
    ORDER BY p.id, p.voice_channel_id DESC NULLS LAST, p.last_seen_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les Parties vocales actives d'une squad
CREATE OR REPLACE FUNCTION get_active_squad_parties(p_squad_id UUID)
RETURNS TABLE (
    voice_channel_id TEXT,
    participant_count INTEGER,
    participants JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.voice_channel_id,
        COUNT(*)::INTEGER as participant_count,
        jsonb_agg(
            jsonb_build_object(
                'user_id', p.id,
                'username', p.username,
                'avatar_url', p.avatar_url,
                'joined_at', p.voice_joined_at
            )
            ORDER BY p.voice_joined_at
        ) as participants
    FROM profiles p
    JOIN squad_members sm ON sm.user_id = p.id
    WHERE sm.squad_id = p_squad_id
      AND p.voice_channel_id IS NOT NULL
    GROUP BY p.voice_channel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_active_squad_parties(UUID) TO authenticated;

-- Fonction pour rejoindre une Party vocale (met à jour le profil)
CREATE OR REPLACE FUNCTION join_voice_party(p_channel_id TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET voice_channel_id = p_channel_id,
        voice_joined_at = NOW(),
        last_seen_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION join_voice_party(TEXT) TO authenticated;

-- Fonction pour quitter une Party vocale
CREATE OR REPLACE FUNCTION leave_voice_party()
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET voice_channel_id = NULL,
        voice_joined_at = NULL,
        last_seen_at = NOW()
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION leave_voice_party() TO authenticated;

-- Activer Realtime pour les updates de voice_channel (si pas déjà fait)
-- Note: profiles devrait déjà être en realtime

-- =====================================================
-- NOTIFICATIONS TABLE (pour les invitations Party)
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les notifications non lues
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- RLS pour notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications for others" ON notifications;
CREATE POLICY "Users can insert notifications for others" ON notifications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Activer Realtime pour les notifications (si pas déjà fait)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END $$;

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Voice party tracking migration completed!';
    RAISE NOTICE '🎤 New columns: profiles.voice_channel_id, profiles.voice_joined_at';
    RAISE NOTICE '🔍 Updated function: get_friends_playing (now includes voice parties)';
    RAISE NOTICE '🆕 New functions: get_active_squad_parties, join_voice_party, leave_voice_party';
    RAISE NOTICE '🔔 New table: notifications (for party invites)';
END $$;
