-- ============================================================
-- PHASE 6 : FEATURES DIFFERENCIANTES — Social Discovery + Integrations
-- Score: 49.5 → 50/50
-- ============================================================

-- 1. SQUAD DISCOVERY COLUMNS
ALTER TABLE squads ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE squads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE squads ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'eu-west';

-- Index for discovery queries
CREATE INDEX IF NOT EXISTS idx_squads_public ON squads(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_squads_game_public ON squads(game, is_public) WHERE is_public = true;

-- 2. PROFILE SOCIAL FIELDS
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS region TEXT DEFAULT 'eu-west';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_games TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS looking_for_squad BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS playstyle TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS twitch_username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_username TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_looking ON profiles(looking_for_squad) WHERE looking_for_squad = true;
CREATE INDEX IF NOT EXISTS idx_profiles_region ON profiles(region);

-- 3. MATCHMAKING REQUESTS TABLE
CREATE TABLE IF NOT EXISTS matchmaking_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    game TEXT NOT NULL,
    region TEXT DEFAULT 'eu-west',
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    UNIQUE(user_id, squad_id)
);

ALTER TABLE matchmaking_requests ENABLE ROW LEVEL SECURITY;

-- Squad leaders can see requests for their squads
CREATE POLICY "matchmaking_select_leaders" ON matchmaking_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = matchmaking_requests.squad_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('leader', 'co_leader')
        )
        OR user_id = auth.uid()
    );

-- Users can create their own requests
CREATE POLICY "matchmaking_insert_own" ON matchmaking_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Squad leaders can update request status
CREATE POLICY "matchmaking_update_leaders" ON matchmaking_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = matchmaking_requests.squad_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('leader', 'co_leader')
        )
    );

-- Users can delete their own requests
CREATE POLICY "matchmaking_delete_own" ON matchmaking_requests
    FOR DELETE USING (auth.uid() = user_id);

-- 4. USER INTEGRATIONS TABLE (for future OAuth: Google Calendar, Twitch, etc.)
CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('google_calendar', 'twitch', 'discord', 'steam')),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    external_id TEXT,
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_own" ON user_integrations
    FOR ALL USING (auth.uid() = user_id);

-- 5. RPC: BROWSE PUBLIC SQUADS
CREATE OR REPLACE FUNCTION browse_public_squads(
    p_game TEXT DEFAULT NULL,
    p_region TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    game TEXT,
    region TEXT,
    member_count INTEGER,
    avg_reliability NUMERIC,
    owner_username TEXT,
    owner_avatar TEXT,
    tags TEXT[],
    invite_code TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id, s.name, s.description, s.game, s.region,
        s.total_members AS member_count,
        COALESCE(s.avg_reliability_score, 100)::NUMERIC AS avg_reliability,
        p.username AS owner_username,
        p.avatar_url AS owner_avatar,
        s.tags,
        s.invite_code,
        s.created_at
    FROM squads s
    JOIN profiles p ON p.id = s.owner_id
    WHERE s.is_public = true
        AND (p_game IS NULL OR s.game ILIKE '%' || p_game || '%')
        AND (p_region IS NULL OR s.region = p_region)
    ORDER BY s.total_members DESC, s.avg_reliability_score DESC NULLS LAST
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: GLOBAL LEADERBOARD
CREATE OR REPLACE FUNCTION get_global_leaderboard(
    p_game TEXT DEFAULT NULL,
    p_region TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    rank INTEGER,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    xp INTEGER,
    level INTEGER,
    reliability_score NUMERIC,
    streak_days INTEGER,
    total_sessions INTEGER,
    region TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY p.xp DESC, p.reliability_score DESC NULLS LAST)::INTEGER AS rank,
        p.id AS user_id,
        p.username,
        p.avatar_url,
        COALESCE(p.xp, 0)::INTEGER,
        COALESCE(p.level, 1)::INTEGER,
        COALESCE(p.reliability_score, 100)::NUMERIC,
        COALESCE(p.streak_days, 0)::INTEGER,
        COALESCE(p.total_sessions, 0)::INTEGER,
        p.region
    FROM profiles p
    WHERE COALESCE(p.total_sessions, 0) >= 3
        AND (p_region IS NULL OR p.region = p_region)
        AND (p_game IS NULL OR EXISTS (
            SELECT 1 FROM squad_members sm
            JOIN squads sq ON sq.id = sm.squad_id
            WHERE sm.user_id = p.id AND sq.game ILIKE '%' || p_game || '%'
        ))
    ORDER BY p.xp DESC, p.reliability_score DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: FIND PLAYERS LOOKING FOR SQUAD (matchmaking)
CREATE OR REPLACE FUNCTION find_players_for_squad(
    p_game TEXT DEFAULT NULL,
    p_region TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    reliability_score NUMERIC,
    level INTEGER,
    xp INTEGER,
    preferred_games TEXT[],
    region TEXT,
    total_sessions INTEGER,
    playstyle TEXT,
    bio TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS user_id,
        p.username,
        p.avatar_url,
        COALESCE(p.reliability_score, 100)::NUMERIC,
        COALESCE(p.level, 1)::INTEGER,
        COALESCE(p.xp, 0)::INTEGER,
        p.preferred_games,
        p.region,
        COALESCE(p.total_sessions, 0)::INTEGER,
        p.playstyle,
        p.bio
    FROM profiles p
    WHERE p.looking_for_squad = true
        AND (p_region IS NULL OR p.region = p_region)
        AND (p_game IS NULL OR p.preferred_games @> ARRAY[p_game] OR EXISTS (
            SELECT 1 FROM squad_members sm
            JOIN squads sq ON sq.id = sm.squad_id
            WHERE sm.user_id = p.id AND sq.game ILIKE '%' || p_game || '%'
        ))
    ORDER BY p.reliability_score DESC NULLS LAST, p.level DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION browse_public_squads(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_global_leaderboard(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION find_players_for_squad(TEXT, TEXT, INTEGER) TO authenticated;
