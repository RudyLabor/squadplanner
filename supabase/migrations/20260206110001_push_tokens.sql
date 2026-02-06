-- =====================================================
-- PUSH TOKENS TABLE
-- Stocke les tokens FCM/APNS pour les notifications natives
-- =====================================================

CREATE TABLE IF NOT EXISTS push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un token unique par user + token
    UNIQUE(user_id, token)
);

-- Index pour les requêtes par user
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

-- RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tokens" ON push_tokens;
CREATE POLICY "Users can view own tokens" ON push_tokens
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tokens" ON push_tokens;
CREATE POLICY "Users can insert own tokens" ON push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tokens" ON push_tokens;
CREATE POLICY "Users can update own tokens" ON push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tokens" ON push_tokens;
CREATE POLICY "Users can delete own tokens" ON push_tokens
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour nettoyer les vieux tokens (plus de 30 jours sans mise à jour)
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM push_tokens
    WHERE updated_at < NOW() - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Push tokens migration completed!';
    RAISE NOTICE '📱 New table: push_tokens (for FCM/APNS tokens)';
END $$;
