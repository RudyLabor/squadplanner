-- ============================================================
-- PHASE 7 : FEATURES BACKEND — Status, Threads, Stories,
-- Notifications granulaires, Voice Messages, Full-Text Search
-- ============================================================

-- ============================================================
-- 1. CUSTOM STATUS (profiles)
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_text TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_emoji TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status_expires_at TIMESTAMPTZ;

-- Index pour les statuts actifs
CREATE INDEX IF NOT EXISTS idx_profiles_status_active
    ON profiles(id)
    WHERE status_text IS NOT NULL AND (status_expires_at IS NULL OR status_expires_at > NOW());

-- RPC pour mettre à jour le statut
CREATE OR REPLACE FUNCTION update_user_status(
    p_user_id UUID,
    p_status_text TEXT DEFAULT NULL,
    p_status_emoji TEXT DEFAULT NULL,
    p_duration_minutes INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET
        status_text = p_status_text,
        status_emoji = p_status_emoji,
        status_expires_at = CASE
            WHEN p_duration_minutes IS NOT NULL THEN NOW() + (p_duration_minutes || ' minutes')::INTERVAL
            WHEN p_status_text IS NULL THEN NULL
            ELSE NULL -- No expiry = permanent until cleared
        END,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_user_status(UUID, TEXT, TEXT, INTEGER) TO authenticated;

-- Cleanup expired statuses (can be run by cron)
CREATE OR REPLACE FUNCTION cleanup_expired_statuses()
RETURNS void AS $$
BEGIN
    UPDATE profiles
    SET status_text = NULL, status_emoji = NULL, status_expires_at = NULL
    WHERE status_expires_at IS NOT NULL AND status_expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 2. SQUAD CHANNELS (Multi-canal)
-- ============================================================

CREATE TABLE IF NOT EXISTS squad_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 50),
    description TEXT,
    channel_type TEXT DEFAULT 'text' CHECK (channel_type IN ('text', 'voice', 'announcements')),
    is_default BOOLEAN DEFAULT false,
    position INTEGER DEFAULT 0,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un seul channel par défaut par squad
    UNIQUE(squad_id, name)
);

CREATE INDEX IF NOT EXISTS idx_squad_channels_squad ON squad_channels(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_channels_default ON squad_channels(squad_id, is_default) WHERE is_default = true;

-- RLS
ALTER TABLE squad_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Squad members can view channels"
    ON squad_channels FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = squad_channels.squad_id
            AND squad_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Squad leaders can manage channels"
    ON squad_channels FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = squad_channels.squad_id
            AND squad_members.user_id = auth.uid()
            AND squad_members.role IN ('leader', 'co_leader')
        )
    );

CREATE POLICY "Squad leaders can update channels"
    ON squad_channels FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = squad_channels.squad_id
            AND squad_members.user_id = auth.uid()
            AND squad_members.role IN ('leader', 'co_leader')
        )
    );

CREATE POLICY "Squad leaders can delete channels"
    ON squad_channels FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = squad_channels.squad_id
            AND squad_members.user_id = auth.uid()
            AND squad_members.role IN ('leader', 'co_leader')
        )
    );

-- Add channel_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES squad_channels(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id) WHERE channel_id IS NOT NULL;

-- Auto-create default channel for existing squads
CREATE OR REPLACE FUNCTION create_default_channel()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO squad_channels (squad_id, name, description, channel_type, is_default, created_by)
    VALUES (NEW.id, 'général', 'Chat général de la squad', 'text', true, NEW.owner_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_squad_create_default_channel ON squads;
CREATE TRIGGER on_squad_create_default_channel
    AFTER INSERT ON squads
    FOR EACH ROW EXECUTE FUNCTION create_default_channel();

-- Create default channels for all existing squads that don't have one
INSERT INTO squad_channels (squad_id, name, description, channel_type, is_default, created_by)
SELECT s.id, 'général', 'Chat général de la squad', 'text', true, s.owner_id
FROM squads s
WHERE NOT EXISTS (
    SELECT 1 FROM squad_channels sc WHERE sc.squad_id = s.id AND sc.is_default = true
);

-- Realtime for channels
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE squad_channels;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. MESSAGE THREADS
-- ============================================================

-- Add thread support to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_reply_count INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_last_reply_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_messages_thread ON messages(thread_id) WHERE thread_id IS NOT NULL;

-- Update thread stats when a reply is added
CREATE OR REPLACE FUNCTION update_thread_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.thread_id IS NOT NULL THEN
        UPDATE messages
        SET
            thread_reply_count = (
                SELECT COUNT(*) FROM messages WHERE thread_id = NEW.thread_id
            ),
            thread_last_reply_at = NOW()
        WHERE id = NEW.thread_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_thread_reply ON messages;
CREATE TRIGGER on_thread_reply
    AFTER INSERT ON messages
    FOR EACH ROW
    WHEN (NEW.thread_id IS NOT NULL)
    EXECUTE FUNCTION update_thread_stats();

-- RPC to get thread messages
CREATE OR REPLACE FUNCTION get_thread_messages(p_thread_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    id UUID,
    content TEXT,
    sender_id UUID,
    sender_username TEXT,
    sender_avatar TEXT,
    created_at TIMESTAMPTZ,
    edited_at TIMESTAMPTZ,
    reply_to_id UUID,
    is_system_message BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id, m.content, m.sender_id,
        p.username AS sender_username,
        p.avatar_url AS sender_avatar,
        m.created_at, m.edited_at, m.reply_to_id,
        m.is_system_message
    FROM messages m
    JOIN profiles p ON p.id = m.sender_id
    WHERE m.thread_id = p_thread_id
    ORDER BY m.created_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_thread_messages(UUID, INTEGER) TO authenticated;

-- ============================================================
-- 4. STORIES (Éphémères - 24h)
-- ============================================================

CREATE TABLE IF NOT EXISTS stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    squad_id UUID REFERENCES squads(id) ON DELETE CASCADE, -- NULL = visible by friends
    content_type TEXT NOT NULL CHECK (content_type IN ('text', 'image', 'achievement', 'session_highlight')),
    content TEXT NOT NULL,
    media_url TEXT,
    background_color TEXT DEFAULT '#5e6dd2',
    text_color TEXT DEFAULT '#ffffff',
    metadata JSONB DEFAULT '{}',
    view_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_squad ON stories(squad_id) WHERE squad_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stories_expires ON stories(expires_at) WHERE expires_at > NOW();
CREATE INDEX IF NOT EXISTS idx_stories_active ON stories(user_id, created_at DESC) WHERE expires_at > NOW();

-- Story views tracking
CREATE TABLE IF NOT EXISTS story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

CREATE INDEX IF NOT EXISTS idx_story_views_story ON story_views(story_id);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON story_views(viewer_id);

-- RLS for stories
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_views ENABLE ROW LEVEL SECURITY;

-- Stories: visible by squad members or friends
CREATE POLICY "Users can view stories from squad members"
    ON stories FOR SELECT
    USING (
        user_id = auth.uid()
        OR (
            squad_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM squad_members
                WHERE squad_members.squad_id = stories.squad_id
                AND squad_members.user_id = auth.uid()
            )
        )
        OR (
            squad_id IS NULL AND EXISTS (
                SELECT 1 FROM squad_members sm1
                JOIN squad_members sm2 ON sm1.squad_id = sm2.squad_id
                WHERE sm1.user_id = stories.user_id
                AND sm2.user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can create stories"
    ON stories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
    ON stories FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view story views"
    ON story_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM stories
            WHERE stories.id = story_views.story_id
            AND stories.user_id = auth.uid()
        )
        OR viewer_id = auth.uid()
    );

CREATE POLICY "Users can mark stories as viewed"
    ON story_views FOR INSERT
    WITH CHECK (auth.uid() = viewer_id);

-- RPC to get active stories from squad members
CREATE OR REPLACE FUNCTION get_feed_stories(p_user_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    story_id UUID,
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    content_type TEXT,
    content TEXT,
    media_url TEXT,
    background_color TEXT,
    text_color TEXT,
    metadata JSONB,
    view_count INTEGER,
    has_viewed BOOLEAN,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    story_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id AS story_id,
        s.user_id,
        p.username,
        p.avatar_url,
        s.content_type,
        s.content,
        s.media_url,
        s.background_color,
        s.text_color,
        s.metadata,
        s.view_count,
        EXISTS (
            SELECT 1 FROM story_views sv
            WHERE sv.story_id = s.id AND sv.viewer_id = p_user_id
        ) AS has_viewed,
        s.created_at,
        s.expires_at,
        (SELECT COUNT(*)::INTEGER FROM stories s2
         WHERE s2.user_id = s.user_id AND s2.expires_at > NOW()) AS story_count
    FROM stories s
    JOIN profiles p ON p.id = s.user_id
    WHERE s.expires_at > NOW()
    AND (
        s.user_id = p_user_id
        OR (s.squad_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = s.squad_id AND sm.user_id = p_user_id
        ))
        OR (s.squad_id IS NULL AND EXISTS (
            SELECT 1 FROM squad_members sm1
            JOIN squad_members sm2 ON sm1.squad_id = sm2.squad_id
            WHERE sm1.user_id = s.user_id AND sm2.user_id = p_user_id
        ))
    )
    ORDER BY
        CASE WHEN s.user_id = p_user_id THEN 0 ELSE 1 END,
        s.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_feed_stories(UUID, INTEGER) TO authenticated;

-- Realtime for stories
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE stories;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 5. NOTIFICATION PREFERENCES (20+ types)
-- ============================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Session notifications
    session_created BOOLEAN DEFAULT true,
    session_confirmed BOOLEAN DEFAULT true,
    session_cancelled BOOLEAN DEFAULT true,
    session_reminder_15min BOOLEAN DEFAULT true,
    session_reminder_1h BOOLEAN DEFAULT true,
    session_reminder_24h BOOLEAN DEFAULT false,
    session_rsvp_received BOOLEAN DEFAULT true,
    session_rsvp_changed BOOLEAN DEFAULT true,
    session_checkin_reminder BOOLEAN DEFAULT true,
    session_completed BOOLEAN DEFAULT true,

    -- Squad notifications
    squad_member_joined BOOLEAN DEFAULT true,
    squad_member_left BOOLEAN DEFAULT true,
    squad_role_changed BOOLEAN DEFAULT true,
    squad_settings_changed BOOLEAN DEFAULT false,

    -- Message notifications
    message_received BOOLEAN DEFAULT true,
    message_mention BOOLEAN DEFAULT true,
    message_reaction BOOLEAN DEFAULT true,
    message_thread_reply BOOLEAN DEFAULT true,
    dm_received BOOLEAN DEFAULT true,

    -- Party/Voice notifications
    party_started BOOLEAN DEFAULT true,
    party_member_joined BOOLEAN DEFAULT true,
    incoming_call BOOLEAN DEFAULT true,
    missed_call BOOLEAN DEFAULT true,

    -- Social notifications
    friend_request BOOLEAN DEFAULT true,
    friend_online BOOLEAN DEFAULT false,
    story_from_friend BOOLEAN DEFAULT true,
    matchmaking_request BOOLEAN DEFAULT true,

    -- Gamification notifications
    level_up BOOLEAN DEFAULT true,
    achievement_unlocked BOOLEAN DEFAULT true,
    streak_at_risk BOOLEAN DEFAULT true,
    leaderboard_rank_change BOOLEAN DEFAULT false,
    challenge_completed BOOLEAN DEFAULT true,

    -- AI notifications
    ai_coach_tip BOOLEAN DEFAULT true,
    ai_slot_suggestion BOOLEAN DEFAULT true,

    -- Global settings
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    sound_enabled BOOLEAN DEFAULT true,
    vibration_enabled BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Auto-create preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_create_notif_prefs ON profiles;
CREATE TRIGGER on_profile_create_notif_prefs
    AFTER INSERT ON profiles
    FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Create default preferences for all existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- RPC to check if a notification should be sent
CREATE OR REPLACE FUNCTION should_send_notification(
    p_user_id UUID,
    p_notification_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    prefs notification_preferences;
    result BOOLEAN;
BEGIN
    SELECT * INTO prefs FROM notification_preferences WHERE user_id = p_user_id;

    -- No preferences = send everything
    IF NOT FOUND THEN RETURN true; END IF;

    -- Check quiet hours
    IF prefs.quiet_hours_start IS NOT NULL AND prefs.quiet_hours_end IS NOT NULL THEN
        IF CURRENT_TIME BETWEEN prefs.quiet_hours_start AND prefs.quiet_hours_end THEN
            RETURN false;
        END IF;
    END IF;

    -- Check specific notification type
    EXECUTE format('SELECT ($1).%I', p_notification_type) INTO result USING prefs;
    RETURN COALESCE(result, true);
EXCEPTION WHEN OTHERS THEN
    RETURN true; -- Default to sending if column doesn't exist
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION should_send_notification(UUID, TEXT) TO authenticated;

-- ============================================================
-- 6. VOICE MESSAGES (Storage + metadata)
-- ============================================================

-- Add voice message fields to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS voice_duration_seconds INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'voice', 'gif', 'poll', 'location', 'file'));

-- Add voice message fields to direct_messages table
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS voice_url TEXT;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS voice_duration_seconds INTEGER;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'voice', 'gif', 'poll', 'location', 'file'));

-- Create storage bucket for voice messages (if not exists)
-- Note: This must be done via Supabase Dashboard or API, not SQL
-- INSERT INTO storage.buckets (id, name, public) VALUES ('voice-messages', 'voice-messages', false)
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. FULL-TEXT SEARCH
-- ============================================================

-- Enable full-text search extension (already have pg_trgm)
-- Add tsvector column for full-text search on messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS idx_messages_search ON messages USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_dm_search ON direct_messages USING gin(search_vector);

-- Also add trigram indexes for fuzzy search
CREATE INDEX IF NOT EXISTS idx_messages_content_trgm ON messages USING gin(content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_dm_content_trgm ON direct_messages USING gin(content gin_trgm_ops);

-- Update search vector on insert/update for messages
CREATE OR REPLACE FUNCTION update_message_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('french', COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_search_vector_update ON messages;
CREATE TRIGGER messages_search_vector_update
    BEFORE INSERT OR UPDATE OF content ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

DROP TRIGGER IF EXISTS dm_search_vector_update ON direct_messages;
CREATE TRIGGER dm_search_vector_update
    BEFORE INSERT OR UPDATE OF content ON direct_messages
    FOR EACH ROW EXECUTE FUNCTION update_message_search_vector();

-- Backfill search vectors for existing messages
UPDATE messages SET search_vector = to_tsvector('french', COALESCE(content, '')) WHERE search_vector IS NULL;
UPDATE direct_messages SET search_vector = to_tsvector('french', COALESCE(content, '')) WHERE search_vector IS NULL;

-- RPC: Full-text search in squad messages
CREATE OR REPLACE FUNCTION search_messages(
    p_user_id UUID,
    p_query TEXT,
    p_squad_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 30,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    message_id UUID,
    content TEXT,
    sender_id UUID,
    sender_username TEXT,
    sender_avatar TEXT,
    squad_id UUID,
    squad_name TEXT,
    channel_id UUID,
    created_at TIMESTAMPTZ,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id AS message_id,
        m.content,
        m.sender_id,
        p.username AS sender_username,
        p.avatar_url AS sender_avatar,
        m.squad_id,
        s.name AS squad_name,
        m.channel_id,
        m.created_at,
        ts_rank(m.search_vector, plainto_tsquery('french', p_query))::REAL AS relevance
    FROM messages m
    JOIN profiles p ON p.id = m.sender_id
    JOIN squads s ON s.id = m.squad_id
    WHERE
        -- User must be a member of the squad
        EXISTS (
            SELECT 1 FROM squad_members sm
            WHERE sm.squad_id = m.squad_id AND sm.user_id = p_user_id
        )
        -- Filter by squad if specified
        AND (p_squad_id IS NULL OR m.squad_id = p_squad_id)
        -- Full-text search OR trigram similarity
        AND (
            m.search_vector @@ plainto_tsquery('french', p_query)
            OR m.content ILIKE '%' || p_query || '%'
        )
        -- Skip system messages
        AND m.is_system_message = false
    ORDER BY relevance DESC, m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Full-text search in DMs
CREATE OR REPLACE FUNCTION search_direct_messages(
    p_user_id UUID,
    p_query TEXT,
    p_other_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 30,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    message_id UUID,
    content TEXT,
    sender_id UUID,
    sender_username TEXT,
    sender_avatar TEXT,
    other_user_id UUID,
    other_username TEXT,
    created_at TIMESTAMPTZ,
    relevance REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        dm.id AS message_id,
        dm.content,
        dm.sender_id,
        ps.username AS sender_username,
        ps.avatar_url AS sender_avatar,
        CASE WHEN dm.sender_id = p_user_id THEN dm.receiver_id ELSE dm.sender_id END AS other_user_id,
        po.username AS other_username,
        dm.created_at,
        ts_rank(dm.search_vector, plainto_tsquery('french', p_query))::REAL AS relevance
    FROM direct_messages dm
    JOIN profiles ps ON ps.id = dm.sender_id
    JOIN profiles po ON po.id = CASE WHEN dm.sender_id = p_user_id THEN dm.receiver_id ELSE dm.sender_id END
    WHERE
        (dm.sender_id = p_user_id OR dm.receiver_id = p_user_id)
        AND (p_other_user_id IS NULL OR dm.sender_id = p_other_user_id OR dm.receiver_id = p_other_user_id)
        AND (
            dm.search_vector @@ plainto_tsquery('french', p_query)
            OR dm.content ILIKE '%' || p_query || '%'
        )
    ORDER BY relevance DESC, dm.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION search_messages(UUID, TEXT, UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION search_direct_messages(UUID, TEXT, UUID, INTEGER, INTEGER) TO authenticated;

-- ============================================================
-- CONFIRMATION
-- ============================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 7 Backend Features migration completed!';
    RAISE NOTICE '👤 Custom status: status_text, status_emoji, status_expires_at on profiles';
    RAISE NOTICE '📺 Squad channels: squad_channels table + default channel trigger';
    RAISE NOTICE '🧵 Message threads: thread_id, thread_reply_count on messages';
    RAISE NOTICE '📸 Stories: stories + story_views tables with 24h expiry';
    RAISE NOTICE '🔔 Notification preferences: 30+ granular notification settings';
    RAISE NOTICE '🎤 Voice messages: voice_url, voice_duration_seconds, message_type on messages + DMs';
    RAISE NOTICE '🔍 Full-text search: tsvector + GIN indexes + search RPCs for messages and DMs';
END $$;
