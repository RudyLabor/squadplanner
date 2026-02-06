-- =====================================================
-- PHASE 5 - GAMIFICATION SYSTEM
-- XP, Levels, Challenges, Streaks
-- =====================================================

-- =====================================================
-- 1. PROFILE GAMIFICATION COLUMNS
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak_last_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp_earned INTEGER DEFAULT 0;

-- Index pour leaderboards
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(streak_days DESC);

-- =====================================================
-- 2. XP THRESHOLDS TABLE (pour calculer les levels)
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_levels (
    level INTEGER PRIMARY KEY,
    xp_required INTEGER NOT NULL,
    title TEXT NOT NULL,
    badge_color TEXT DEFAULT '#4ade80'
);

-- Insérer les niveaux
INSERT INTO xp_levels (level, xp_required, title, badge_color) VALUES
    (1, 0, 'Rookie', '#9ca3af'),
    (2, 100, 'Regular', '#4ade80'),
    (3, 300, 'Veteran', '#22d3ee'),
    (4, 600, 'Elite', '#a855f7'),
    (5, 1000, 'Champion', '#f59e0b'),
    (6, 1500, 'Master', '#ec4899'),
    (7, 2500, 'Grandmaster', '#ef4444'),
    (8, 4000, 'Legend', '#8b5cf6'),
    (9, 6000, 'Mythic', '#14b8a6'),
    (10, 10000, 'Immortal', '#fbbf24')
ON CONFLICT (level) DO NOTHING;

-- =====================================================
-- 3. CHALLENGES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    xp_reward INTEGER DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'seasonal', 'achievement')),
    requirements JSONB NOT NULL DEFAULT '{}',
    icon TEXT DEFAULT '🎯',
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_type ON challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_active ON challenges(is_active) WHERE is_active = true;

-- =====================================================
-- 4. USER CHALLENGES PROGRESS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    target INTEGER NOT NULL,
    completed_at TIMESTAMPTZ,
    xp_claimed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, challenge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenges_completed ON user_challenges(completed_at) WHERE completed_at IS NOT NULL;

-- =====================================================
-- 5. XP TRANSACTIONS LOG
-- =====================================================

CREATE TABLE IF NOT EXISTS xp_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    source_type TEXT, -- 'rsvp', 'checkin', 'challenge', 'streak', 'achievement'
    source_id UUID,   -- Reference to the source (session_id, challenge_id, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user ON xp_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_transactions_created ON xp_transactions(created_at DESC);

-- =====================================================
-- 6. SEASONAL BADGES
-- =====================================================

CREATE TABLE IF NOT EXISTS seasonal_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL, -- 'mvp', 'most_reliable', 'party_animal', etc.
    season TEXT NOT NULL,     -- 'January 2026', 'Q1 2026', etc.
    squad_id UUID REFERENCES squads(id) ON DELETE SET NULL,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type, season)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_badges_user ON seasonal_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_seasonal_badges_season ON seasonal_badges(season);

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE xp_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasonal_badges ENABLE ROW LEVEL SECURITY;

-- xp_levels: tout le monde peut lire
CREATE POLICY "Anyone can view xp levels" ON xp_levels FOR SELECT USING (true);

-- challenges: tout le monde peut voir les challenges actifs
CREATE POLICY "Anyone can view active challenges" ON challenges FOR SELECT USING (is_active = true);

-- user_challenges: voir ses propres challenges
CREATE POLICY "Users can view own challenges" ON user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own challenges" ON user_challenges FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own challenges" ON user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- xp_transactions: voir ses propres transactions
CREATE POLICY "Users can view own xp" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);

-- seasonal_badges: tout le monde peut voir les badges
CREATE POLICY "Anyone can view badges" ON seasonal_badges FOR SELECT USING (true);

-- =====================================================
-- 8. HELPER FUNCTIONS
-- =====================================================

-- Fonction pour ajouter de l'XP et mettre à jour le level
CREATE OR REPLACE FUNCTION add_xp(
    p_user_id UUID,
    p_amount INTEGER,
    p_reason TEXT,
    p_source_type TEXT DEFAULT NULL,
    p_source_id UUID DEFAULT NULL
)
RETURNS TABLE (
    new_xp INTEGER,
    new_level INTEGER,
    level_up BOOLEAN,
    new_level_title TEXT
) AS $$
DECLARE
    v_current_xp INTEGER;
    v_current_level INTEGER;
    v_new_xp INTEGER;
    v_new_level INTEGER;
    v_level_up BOOLEAN := false;
    v_level_title TEXT;
BEGIN
    -- Get current XP and level
    SELECT xp, level INTO v_current_xp, v_current_level
    FROM profiles WHERE id = p_user_id;

    v_new_xp := v_current_xp + p_amount;

    -- Calculate new level
    SELECT xl.level, xl.title INTO v_new_level, v_level_title
    FROM xp_levels xl
    WHERE xl.xp_required <= v_new_xp
    ORDER BY xl.level DESC
    LIMIT 1;

    v_level_up := v_new_level > v_current_level;

    -- Update profile
    UPDATE profiles
    SET xp = v_new_xp,
        level = v_new_level,
        total_xp_earned = total_xp_earned + p_amount
    WHERE id = p_user_id;

    -- Log transaction
    INSERT INTO xp_transactions (user_id, amount, reason, source_type, source_id)
    VALUES (p_user_id, p_amount, p_reason, p_source_type, p_source_id);

    RETURN QUERY SELECT v_new_xp, v_new_level, v_level_up, v_level_title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour mettre à jour le streak
CREATE OR REPLACE FUNCTION update_streak(p_user_id UUID)
RETURNS TABLE (
    new_streak INTEGER,
    streak_bonus INTEGER
) AS $$
DECLARE
    v_last_date DATE;
    v_current_streak INTEGER;
    v_new_streak INTEGER;
    v_bonus INTEGER := 0;
BEGIN
    SELECT streak_last_date, streak_days INTO v_last_date, v_current_streak
    FROM profiles WHERE id = p_user_id;

    IF v_last_date IS NULL OR v_last_date < CURRENT_DATE - 1 THEN
        -- Streak broken, reset to 1
        v_new_streak := 1;
    ELSIF v_last_date = CURRENT_DATE - 1 THEN
        -- Streak continues
        v_new_streak := v_current_streak + 1;
        -- Bonus XP for milestones
        IF v_new_streak = 7 THEN v_bonus := 100;
        ELSIF v_new_streak = 14 THEN v_bonus := 200;
        ELSIF v_new_streak = 30 THEN v_bonus := 500;
        ELSIF v_new_streak = 100 THEN v_bonus := 1000;
        ELSIF v_new_streak % 7 = 0 THEN v_bonus := 50;
        END IF;
    ELSIF v_last_date = CURRENT_DATE THEN
        -- Already checked in today
        v_new_streak := v_current_streak;
    ELSE
        v_new_streak := 1;
    END IF;

    UPDATE profiles
    SET streak_days = v_new_streak,
        streak_last_date = CURRENT_DATE
    WHERE id = p_user_id;

    -- Add bonus XP if applicable
    IF v_bonus > 0 THEN
        PERFORM add_xp(p_user_id, v_bonus, 'Streak bonus: ' || v_new_streak || ' days', 'streak', NULL);
    END IF;

    RETURN QUERY SELECT v_new_streak, v_bonus;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le leaderboard d'un squad
CREATE OR REPLACE FUNCTION get_squad_leaderboard(p_squad_id UUID)
RETURNS TABLE (
    rank INTEGER,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    xp INTEGER,
    level INTEGER,
    reliability_score NUMERIC,
    streak_days INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ROW_NUMBER() OVER (ORDER BY p.xp DESC)::INTEGER as rank,
        p.id as user_id,
        p.username,
        p.avatar_url,
        p.xp,
        p.level,
        COALESCE(p.reliability_score, 100)::NUMERIC as reliability_score,
        p.streak_days
    FROM profiles p
    JOIN squad_members sm ON sm.user_id = p.id
    WHERE sm.squad_id = p_squad_id
    ORDER BY p.xp DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_xp(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_streak(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_squad_leaderboard(UUID) TO authenticated;

-- =====================================================
-- 9. INSERT DEFAULT CHALLENGES
-- =====================================================

INSERT INTO challenges (title, description, xp_reward, type, requirements, icon) VALUES
    ('Premier RSVP', 'RSVP "Présent" à ta première session', 25, 'achievement', '{"type": "rsvp", "count": 1}', '✅'),
    ('Participant régulier', 'RSVP "Présent" à 10 sessions', 100, 'achievement', '{"type": "rsvp", "count": 10}', '🎯'),
    ('Machine de fiabilité', 'Atteindre 90% de reliability score', 200, 'achievement', '{"type": "reliability", "score": 90}', '💎'),
    ('Semaine parfaite', 'Check-in 7 jours de suite', 100, 'weekly', '{"type": "streak", "days": 7}', '🔥'),
    ('RSVP du jour', 'RSVP à une session aujourd''hui', 10, 'daily', '{"type": "daily_rsvp", "count": 1}', '📅'),
    ('Social butterfly', 'Envoyer 10 messages dans le chat squad', 50, 'weekly', '{"type": "messages", "count": 10}', '💬'),
    ('Party animal', 'Rejoindre 5 voice parties', 75, 'weekly', '{"type": "party", "count": 5}', '🎉'),
    ('Leader né', 'Créer une session', 30, 'achievement', '{"type": "create_session", "count": 1}', '👑'),
    ('Squad builder', 'Inviter un ami dans ta squad', 50, 'achievement', '{"type": "invite", "count": 1}', '🤝')
ON CONFLICT DO NOTHING;

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 5 Gamification migration completed!';
    RAISE NOTICE '⭐ New columns: profiles.xp, profiles.level, profiles.streak_days';
    RAISE NOTICE '🏆 New tables: xp_levels, challenges, user_challenges, xp_transactions, seasonal_badges';
    RAISE NOTICE '🎮 New functions: add_xp(), update_streak(), get_squad_leaderboard()';
    RAISE NOTICE '🎯 9 default challenges inserted';
END $$;
