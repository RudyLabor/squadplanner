-- =====================================================
-- SQUAD PLANNER - MIGRATION INITIALE
-- Version: 1.0.0
-- Date: 2026-02-04
-- Description: Création du schéma complet avec RLS, triggers et fonctions
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Pour la recherche textuelle

-- Use gen_random_uuid() instead of gen_random_uuid() for better compatibility

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE squad_role AS ENUM ('leader', 'co_leader', 'member');
CREATE TYPE session_status AS ENUM ('proposed', 'confirmed', 'cancelled', 'completed');
CREATE TYPE rsvp_response AS ENUM ('present', 'absent', 'maybe');
CREATE TYPE checkin_status AS ENUM ('present', 'late', 'noshow');
CREATE TYPE subscription_tier AS ENUM ('free', 'premium');

-- =====================================================
-- TABLE: profiles
-- =====================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    timezone TEXT DEFAULT 'Europe/Paris',

    -- Reliability metrics
    reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    total_sessions INTEGER DEFAULT 0 CHECK (total_sessions >= 0),
    total_checkins INTEGER DEFAULT 0 CHECK (total_checkins >= 0),
    total_noshow INTEGER DEFAULT 0 CHECK (total_noshow >= 0),
    total_late INTEGER DEFAULT 0 CHECK (total_late >= 0),

    -- Gamification
    xp INTEGER DEFAULT 0 CHECK (xp >= 0),
    level INTEGER DEFAULT 1 CHECK (level >= 1),

    -- Subscription
    subscription_tier subscription_tier DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,
    stripe_customer_id TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour la recherche de username
CREATE INDEX idx_profiles_username ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- =====================================================
-- TABLE: squads
-- =====================================================

CREATE TABLE squads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    game TEXT NOT NULL,
    timezone TEXT DEFAULT 'Europe/Paris',
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invite_code TEXT NOT NULL UNIQUE,

    -- Premium features
    is_premium BOOLEAN DEFAULT FALSE,
    max_members INTEGER DEFAULT 10 CHECK (max_members >= 2 AND max_members <= 100),

    -- Stats cache (updated by triggers)
    total_sessions INTEGER DEFAULT 0,
    total_members INTEGER DEFAULT 0,
    avg_reliability_score INTEGER DEFAULT 100,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_squads_owner ON squads(owner_id);
CREATE INDEX idx_squads_invite_code ON squads(invite_code);
CREATE INDEX idx_squads_game ON squads(game);

-- =====================================================
-- TABLE: squad_members
-- =====================================================

CREATE TABLE squad_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role squad_role DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: un user ne peut être membre qu'une fois par squad
    UNIQUE(squad_id, user_id)
);

CREATE INDEX idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX idx_squad_members_user ON squad_members(user_id);

-- =====================================================
-- TABLE: sessions
-- =====================================================

CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    title TEXT,
    game TEXT,
    description TEXT,

    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 120 CHECK (duration_minutes >= 15 AND duration_minutes <= 720),

    -- Status
    status session_status DEFAULT 'proposed',
    min_players INTEGER DEFAULT 2,
    max_players INTEGER,

    -- RSVP tracking
    rsvp_deadline TIMESTAMPTZ,
    auto_confirm_threshold INTEGER DEFAULT 70, -- % de réponses positives pour auto-confirm

    -- Creator
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_squad ON sessions(squad_id);
CREATE INDEX idx_sessions_scheduled ON sessions(scheduled_at);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_by ON sessions(created_by);

-- =====================================================
-- TABLE: session_rsvps
-- =====================================================

CREATE TABLE session_rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    response rsvp_response NOT NULL,
    responded_at TIMESTAMPTZ DEFAULT NOW(),

    -- Track changes
    previous_response rsvp_response,
    changed_count INTEGER DEFAULT 0,

    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_session_rsvps_session ON session_rsvps(session_id);
CREATE INDEX idx_session_rsvps_user ON session_rsvps(user_id);
CREATE INDEX idx_session_rsvps_response ON session_rsvps(response);

-- =====================================================
-- TABLE: session_checkins
-- =====================================================

CREATE TABLE session_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status checkin_status NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT NOW(),

    -- Additional context
    minutes_late INTEGER DEFAULT 0,
    note TEXT,

    UNIQUE(session_id, user_id)
);

CREATE INDEX idx_session_checkins_session ON session_checkins(session_id);
CREATE INDEX idx_session_checkins_user ON session_checkins(user_id);
CREATE INDEX idx_session_checkins_status ON session_checkins(status);

-- =====================================================
-- TABLE: messages
-- =====================================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE, -- NULL = squad chat, sinon session chat
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 2000),

    -- Message type (for AI suggestions)
    is_ai_suggestion BOOLEAN DEFAULT FALSE,
    is_system_message BOOLEAN DEFAULT FALSE,

    -- Read receipts
    read_by UUID[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_squad ON messages(squad_id);
CREATE INDEX idx_messages_session ON messages(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- =====================================================
-- TABLE: ai_insights (pour stocker les analyses IA)
-- =====================================================

CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

    insight_type TEXT NOT NULL, -- 'slot_suggestion', 'decision_push', 'reliability_warning', 'coach_tip'
    content JSONB NOT NULL,

    -- Was it acted upon?
    is_dismissed BOOLEAN DEFAULT FALSE,
    is_acted_upon BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

CREATE INDEX idx_ai_insights_squad ON ai_insights(squad_id) WHERE squad_id IS NOT NULL;
CREATE INDEX idx_ai_insights_user ON ai_insights(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_ai_insights_type ON ai_insights(insight_type);

-- =====================================================
-- TABLE: subscriptions (pour Stripe)
-- =====================================================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Qui a payé

    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,

    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'trialing'
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_squad ON subscriptions(squad_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- =====================================================
-- FUNCTIONS: Utility functions
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reliability score
CREATE OR REPLACE FUNCTION calculate_reliability_score(
    p_total_checkins INTEGER,
    p_total_noshow INTEGER,
    p_total_late INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    score NUMERIC;
    total INTEGER;
BEGIN
    total := p_total_checkins + p_total_noshow;
    IF total = 0 THEN
        RETURN 100;
    END IF;

    -- Formula: 100 - (noshow * 10) - (late * 2)
    -- Weighted: noshow is much worse than late
    score := 100 - (p_total_noshow::NUMERIC / total * 100 * 0.8) - (p_total_late::NUMERIC / total * 100 * 0.2);

    RETURN GREATEST(0, LEAST(100, score::INTEGER));
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps on all tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_squads_updated_at
    BEFORE UPDATE ON squads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update profile reliability on checkin
CREATE OR REPLACE FUNCTION update_profile_on_checkin()
RETURNS TRIGGER AS $$
BEGIN
    -- Update counters
    UPDATE profiles
    SET
        total_checkins = total_checkins + CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
        total_late = total_late + CASE WHEN NEW.status = 'late' THEN 1 ELSE 0 END,
        total_noshow = total_noshow + CASE WHEN NEW.status = 'noshow' THEN 1 ELSE 0 END,
        total_sessions = total_sessions + 1,
        reliability_score = calculate_reliability_score(
            total_checkins + CASE WHEN NEW.status = 'present' THEN 1 ELSE 0 END,
            total_noshow + CASE WHEN NEW.status = 'noshow' THEN 1 ELSE 0 END,
            total_late + CASE WHEN NEW.status = 'late' THEN 1 ELSE 0 END
        ),
        xp = xp + CASE
            WHEN NEW.status = 'present' THEN 50
            WHEN NEW.status = 'late' THEN 20
            ELSE 0
        END
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_session_checkin
    AFTER INSERT ON session_checkins
    FOR EACH ROW EXECUTE FUNCTION update_profile_on_checkin();

-- Update squad member count
CREATE OR REPLACE FUNCTION update_squad_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE squads SET total_members = total_members + 1 WHERE id = NEW.squad_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE squads SET total_members = total_members - 1 WHERE id = OLD.squad_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_squad_member_change
    AFTER INSERT OR DELETE ON squad_members
    FOR EACH ROW EXECUTE FUNCTION update_squad_member_count();

-- Update squad session count
CREATE OR REPLACE FUNCTION update_squad_session_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE squads SET total_sessions = total_sessions + 1 WHERE id = NEW.squad_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE squads SET total_sessions = total_sessions - 1 WHERE id = OLD.squad_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_squad_session_change
    AFTER INSERT OR DELETE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_squad_session_count();

-- Auto-confirm session when threshold reached
CREATE OR REPLACE FUNCTION check_session_auto_confirm()
RETURNS TRIGGER AS $$
DECLARE
    total_members INTEGER;
    positive_responses INTEGER;
    session_record RECORD;
    threshold NUMERIC;
BEGIN
    -- Get session info
    SELECT s.*, sq.total_members INTO session_record
    FROM sessions s
    JOIN squads sq ON sq.id = s.squad_id
    WHERE s.id = NEW.session_id;

    IF session_record.status != 'proposed' THEN
        RETURN NEW;
    END IF;

    -- Count responses
    SELECT COUNT(*) INTO positive_responses
    FROM session_rsvps
    WHERE session_id = NEW.session_id AND response = 'present';

    -- Calculate threshold
    threshold := session_record.auto_confirm_threshold / 100.0;

    -- Auto-confirm if threshold reached
    IF positive_responses >= session_record.min_players
       AND positive_responses >= (session_record.total_members * threshold) THEN
        UPDATE sessions SET status = 'confirmed' WHERE id = NEW.session_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_rsvp_check_confirm
    AFTER INSERT OR UPDATE ON session_rsvps
    FOR EACH ROW EXECUTE FUNCTION check_session_auto_confirm();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES: Users can read all profiles, update only their own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- SQUADS: Members can view, owners can modify
CREATE POLICY "Squads viewable by members"
    ON squads FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = squads.id
            AND squad_members.user_id = auth.uid()
        )
        OR owner_id = auth.uid()
    );

CREATE POLICY "Anyone can view squad by invite code"
    ON squads FOR SELECT
    USING (true); -- Permet de rechercher par invite_code

CREATE POLICY "Authenticated users can create squads"
    ON squads FOR INSERT
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update squads"
    ON squads FOR UPDATE
    USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete squads"
    ON squads FOR DELETE
    USING (auth.uid() = owner_id);

-- SQUAD_MEMBERS: Members can view their squad's members
CREATE POLICY "Members can view squad members"
    ON squad_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = squad_members.squad_id
            AND sm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join squads"
    ON squad_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Leaders can update member roles"
    ON squad_members FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = squad_members.squad_id
            AND sm.user_id = auth.uid()
            AND sm.role IN ('leader', 'co_leader')
        )
    );

CREATE POLICY "Users can leave squads"
    ON squad_members FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE squads.id = squad_members.squad_id
            AND squads.owner_id = auth.uid()
        )
    );

-- SESSIONS: Squad members can view and interact
CREATE POLICY "Squad members can view sessions"
    ON sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = sessions.squad_id
            AND squad_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Squad members can create sessions"
    ON sessions FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = sessions.squad_id
            AND squad_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Creators and leaders can update sessions"
    ON sessions FOR UPDATE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = sessions.squad_id
            AND squad_members.user_id = auth.uid()
            AND squad_members.role IN ('leader', 'co_leader')
        )
    );

CREATE POLICY "Creators and leaders can delete sessions"
    ON sessions FOR DELETE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE squads.id = sessions.squad_id
            AND squads.owner_id = auth.uid()
        )
    );

-- SESSION_RSVPS: Participants can RSVP
CREATE POLICY "Squad members can view RSVPs"
    ON session_rsvps FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN squad_members sm ON sm.squad_id = s.squad_id
            WHERE s.id = session_rsvps.session_id
            AND sm.user_id = auth.uid()
        )
    );

CREATE POLICY "Squad members can RSVP"
    ON session_rsvps FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM sessions s
            JOIN squad_members sm ON sm.squad_id = s.squad_id
            WHERE s.id = session_rsvps.session_id
            AND sm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own RSVP"
    ON session_rsvps FOR UPDATE
    USING (auth.uid() = user_id);

-- SESSION_CHECKINS: Similar to RSVPs
CREATE POLICY "Squad members can view checkins"
    ON session_checkins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sessions s
            JOIN squad_members sm ON sm.squad_id = s.squad_id
            WHERE s.id = session_checkins.session_id
            AND sm.user_id = auth.uid()
        )
    );

CREATE POLICY "Squad members can checkin"
    ON session_checkins FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM sessions s
            JOIN squad_members sm ON sm.squad_id = s.squad_id
            WHERE s.id = session_checkins.session_id
            AND sm.user_id = auth.uid()
        )
    );

-- MESSAGES: Squad members can read/write
CREATE POLICY "Squad members can view messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = messages.squad_id
            AND squad_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Squad members can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = messages.squad_id
            AND squad_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id);

-- AI_INSIGHTS: Users can view their own insights
CREATE POLICY "Users can view their insights"
    ON ai_insights FOR SELECT
    USING (
        user_id = auth.uid()
        OR (
            squad_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM squad_members
                WHERE squad_members.squad_id = ai_insights.squad_id
                AND squad_members.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can dismiss insights"
    ON ai_insights FOR UPDATE
    USING (
        user_id = auth.uid()
        OR (
            squad_id IS NOT NULL
            AND EXISTS (
                SELECT 1 FROM squad_members
                WHERE squad_members.squad_id = ai_insights.squad_id
                AND squad_members.user_id = auth.uid()
            )
        )
    );

-- SUBSCRIPTIONS: Only squad owners can manage
CREATE POLICY "Squad owners can view subscriptions"
    ON subscriptions FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM squads
            WHERE squads.id = subscriptions.squad_id
            AND squads.owner_id = auth.uid()
        )
    );

-- =====================================================
-- REALTIME: Enable for chat
-- =====================================================

-- Activer realtime pour messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE session_rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;

-- =====================================================
-- VIEWS: Useful aggregations
-- =====================================================

-- Vue pour les stats de session
CREATE OR REPLACE VIEW session_stats AS
SELECT
    s.id AS session_id,
    s.squad_id,
    s.title,
    s.scheduled_at,
    s.status,
    COUNT(DISTINCT r.id) FILTER (WHERE r.response = 'present') AS confirmed_count,
    COUNT(DISTINCT r.id) FILTER (WHERE r.response = 'absent') AS declined_count,
    COUNT(DISTINCT r.id) FILTER (WHERE r.response = 'maybe') AS maybe_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'present') AS present_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'late') AS late_count,
    COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'noshow') AS noshow_count
FROM sessions s
LEFT JOIN session_rsvps r ON r.session_id = s.id
LEFT JOIN session_checkins c ON c.session_id = s.id
GROUP BY s.id;

-- Vue pour les membres avec leurs profils
CREATE OR REPLACE VIEW squad_members_with_profiles AS
SELECT
    sm.*,
    p.username,
    p.avatar_url,
    p.reliability_score,
    p.level,
    p.xp
FROM squad_members sm
JOIN profiles p ON p.id = sm.user_id;

-- =====================================================
-- FUNCTIONS: AI Analysis helpers
-- =====================================================

-- Fonction pour obtenir les meilleurs créneaux d'une squad
CREATE OR REPLACE FUNCTION get_best_slots(p_squad_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
    day_of_week INTEGER,
    hour INTEGER,
    avg_attendance NUMERIC,
    session_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(DOW FROM s.scheduled_at)::INTEGER AS day_of_week,
        EXTRACT(HOUR FROM s.scheduled_at)::INTEGER AS hour,
        AVG(
            CASE
                WHEN c.status = 'present' THEN 100
                WHEN c.status = 'late' THEN 80
                ELSE 0
            END
        )::NUMERIC AS avg_attendance,
        COUNT(DISTINCT s.id)::INTEGER AS session_count
    FROM sessions s
    LEFT JOIN session_checkins c ON c.session_id = s.id
    WHERE s.squad_id = p_squad_id
    AND s.status = 'completed'
    GROUP BY EXTRACT(DOW FROM s.scheduled_at), EXTRACT(HOUR FROM s.scheduled_at)
    HAVING COUNT(DISTINCT s.id) >= 2
    ORDER BY avg_attendance DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir la fiabilité d'un créneau
CREATE OR REPLACE FUNCTION get_slot_reliability(
    p_squad_id UUID,
    p_day_of_week INTEGER,
    p_hour INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    reliability INTEGER;
BEGIN
    SELECT
        COALESCE(AVG(
            CASE
                WHEN c.status = 'present' THEN 100
                WHEN c.status = 'late' THEN 80
                ELSE 0
            END
        )::INTEGER, 50)
    INTO reliability
    FROM sessions s
    LEFT JOIN session_checkins c ON c.session_id = s.id
    WHERE s.squad_id = p_squad_id
    AND s.status = 'completed'
    AND EXTRACT(DOW FROM s.scheduled_at) = p_day_of_week
    AND EXTRACT(HOUR FROM s.scheduled_at) = p_hour;

    RETURN reliability;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (pour dev uniquement)
-- =====================================================

-- Commenté pour la production
-- INSERT INTO profiles (id, username, reliability_score) VALUES
-- ('00000000-0000-0000-0000-000000000001', 'demo_user', 95);
