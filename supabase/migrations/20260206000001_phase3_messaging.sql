-- =====================================================
-- PHASE 3 - MESSAGING FEATURES
-- Reactions, Pin, Reply/Quote, Edit/Delete
-- =====================================================

-- =====================================================
-- 0. CREATE TABLE direct_messages (si n'existe pas)
-- =====================================================

CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- RLS pour direct_messages
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'Users can view their own direct messages') THEN
        CREATE POLICY "Users can view their own direct messages"
        ON direct_messages FOR SELECT
        USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'Users can send direct messages') THEN
        CREATE POLICY "Users can send direct messages"
        ON direct_messages FOR INSERT
        WITH CHECK (auth.uid() = sender_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'direct_messages' AND policyname = 'Receiver can mark messages as read') THEN
        CREATE POLICY "Receiver can mark messages as read"
        ON direct_messages FOR UPDATE
        USING (auth.uid() = receiver_id)
        WITH CHECK (auth.uid() = receiver_id);
    END IF;
END $$;

-- Realtime pour direct_messages
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;
EXCEPTION WHEN duplicate_object THEN
    NULL;
END $$;

-- =====================================================
-- 1. ALTER TABLE messages - Add reply_to_id and edited_at
-- =====================================================

-- Champ pour les réponses/quotes
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Champ pour tracker les éditions
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Index pour les réponses
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- =====================================================
-- 2. ALTER TABLE direct_messages - Same fields
-- =====================================================

-- Champ pour les réponses/quotes
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS reply_to_id UUID REFERENCES direct_messages(id) ON DELETE SET NULL;

-- Champ pour tracker les éditions
ALTER TABLE direct_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Index pour les réponses DM
CREATE INDEX IF NOT EXISTS idx_dm_reply_to ON direct_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- =====================================================
-- 3. TABLE: message_reactions (Squad messages)
-- =====================================================

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (length(emoji) > 0 AND length(emoji) <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un user ne peut mettre qu'une seule fois le même emoji sur un message
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_emoji ON message_reactions(emoji);

-- =====================================================
-- 4. TABLE: dm_reactions (Direct messages)
-- =====================================================

CREATE TABLE IF NOT EXISTS dm_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL CHECK (length(emoji) > 0 AND length(emoji) <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un user ne peut mettre qu'une seule fois le même emoji sur un message
    UNIQUE(message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_dm_reactions_message ON dm_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_dm_reactions_user ON dm_reactions(user_id);

-- =====================================================
-- 5. TABLE: pinned_messages (Squad messages only)
-- =====================================================

CREATE TABLE IF NOT EXISTS pinned_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    squad_id UUID NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    pinned_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Un message ne peut être épinglé qu'une fois par squad
    UNIQUE(message_id, squad_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_messages_squad ON pinned_messages(squad_id);
CREATE INDEX IF NOT EXISTS idx_pinned_messages_message ON pinned_messages(message_id);

-- =====================================================
-- 6. RLS POLICIES - message_reactions
-- =====================================================

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Lecture: membres du squad peuvent voir les reactions
DROP POLICY IF EXISTS "Squad members can view reactions" ON message_reactions;
CREATE POLICY "Squad members can view reactions"
    ON message_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM messages m
            JOIN squad_members sm ON sm.squad_id = m.squad_id
            WHERE m.id = message_reactions.message_id
            AND sm.user_id = auth.uid()
        )
    );

-- Insertion: membres du squad peuvent ajouter des reactions
DROP POLICY IF EXISTS "Squad members can add reactions" ON message_reactions;
CREATE POLICY "Squad members can add reactions"
    ON message_reactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM messages m
            JOIN squad_members sm ON sm.squad_id = m.squad_id
            WHERE m.id = message_reactions.message_id
            AND sm.user_id = auth.uid()
        )
    );

-- Suppression: on peut retirer ses propres reactions
DROP POLICY IF EXISTS "Users can remove own reactions" ON message_reactions;
CREATE POLICY "Users can remove own reactions"
    ON message_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 7. RLS POLICIES - dm_reactions
-- =====================================================

ALTER TABLE dm_reactions ENABLE ROW LEVEL SECURITY;

-- Lecture: participants du DM peuvent voir les reactions
DROP POLICY IF EXISTS "DM participants can view reactions" ON dm_reactions;
CREATE POLICY "DM participants can view reactions"
    ON dm_reactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM direct_messages dm
            WHERE dm.id = dm_reactions.message_id
            AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
        )
    );

-- Insertion: participants du DM peuvent ajouter des reactions
DROP POLICY IF EXISTS "DM participants can add reactions" ON dm_reactions;
CREATE POLICY "DM participants can add reactions"
    ON dm_reactions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM direct_messages dm
            WHERE dm.id = dm_reactions.message_id
            AND (dm.sender_id = auth.uid() OR dm.receiver_id = auth.uid())
        )
    );

-- Suppression: on peut retirer ses propres reactions
DROP POLICY IF EXISTS "Users can remove own DM reactions" ON dm_reactions;
CREATE POLICY "Users can remove own DM reactions"
    ON dm_reactions FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- 8. RLS POLICIES - pinned_messages
-- =====================================================

ALTER TABLE pinned_messages ENABLE ROW LEVEL SECURITY;

-- Lecture: membres du squad peuvent voir les messages épinglés
DROP POLICY IF EXISTS "Squad members can view pinned messages" ON pinned_messages;
CREATE POLICY "Squad members can view pinned messages"
    ON pinned_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = pinned_messages.squad_id
            AND squad_members.user_id = auth.uid()
        )
    );

-- Insertion: admins/owners du squad peuvent épingler
DROP POLICY IF EXISTS "Squad admins can pin messages" ON pinned_messages;
CREATE POLICY "Squad admins can pin messages"
    ON pinned_messages FOR INSERT
    WITH CHECK (
        auth.uid() = pinned_by
        AND EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = pinned_messages.squad_id
            AND squad_members.user_id = auth.uid()
            AND squad_members.role IN ('leader', 'co_leader')
        )
    );

-- Suppression: admins/owners du squad peuvent dépingler
DROP POLICY IF EXISTS "Squad admins can unpin messages" ON pinned_messages;
CREATE POLICY "Squad admins can unpin messages"
    ON pinned_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM squad_members
            WHERE squad_members.squad_id = pinned_messages.squad_id
            AND squad_members.user_id = auth.uid()
            AND squad_members.role IN ('leader', 'co_leader')
        )
    );

-- =====================================================
-- 9. REALTIME - Enable for new tables
-- =====================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE message_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE dm_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE pinned_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 10. HELPER FUNCTIONS
-- =====================================================

-- Fonction pour obtenir les reactions d'un message groupées par emoji
CREATE OR REPLACE FUNCTION get_message_reactions(msg_id UUID)
RETURNS TABLE (
    emoji TEXT,
    count BIGINT,
    users UUID[],
    user_reacted BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mr.emoji,
        COUNT(*)::BIGINT as count,
        ARRAY_AGG(mr.user_id) as users,
        bool_or(mr.user_id = auth.uid()) as user_reacted
    FROM message_reactions mr
    WHERE mr.message_id = msg_id
    GROUP BY mr.emoji
    ORDER BY count DESC, mr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les messages épinglés d'un squad
CREATE OR REPLACE FUNCTION get_pinned_messages(sq_id UUID)
RETURNS TABLE (
    pin_id UUID,
    message_id UUID,
    message_content TEXT,
    message_sender_id UUID,
    message_sender_username TEXT,
    message_created_at TIMESTAMPTZ,
    pinned_by_id UUID,
    pinned_by_username TEXT,
    pinned_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pm.id as pin_id,
        m.id as message_id,
        m.content as message_content,
        m.sender_id as message_sender_id,
        ps.username as message_sender_username,
        m.created_at as message_created_at,
        pm.pinned_by as pinned_by_id,
        pp.username as pinned_by_username,
        pm.created_at as pinned_at
    FROM pinned_messages pm
    JOIN messages m ON m.id = pm.message_id
    JOIN profiles ps ON ps.id = m.sender_id
    JOIN profiles pp ON pp.id = pm.pinned_by
    WHERE pm.squad_id = sq_id
    ORDER BY pm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les droits d'exécution
GRANT EXECUTE ON FUNCTION get_message_reactions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pinned_messages(UUID) TO authenticated;

-- =====================================================
-- 11. LIMITE DE PINS PAR SQUAD (optionnel - 25 max)
-- =====================================================

CREATE OR REPLACE FUNCTION check_pin_limit()
RETURNS TRIGGER AS $$
DECLARE
    pin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO pin_count
    FROM pinned_messages
    WHERE squad_id = NEW.squad_id;

    IF pin_count >= 25 THEN
        RAISE EXCEPTION 'Maximum of 25 pinned messages per squad reached';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_pin_limit ON pinned_messages;
CREATE TRIGGER enforce_pin_limit
    BEFORE INSERT ON pinned_messages
    FOR EACH ROW EXECUTE FUNCTION check_pin_limit();

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Phase 3 Messaging migration completed!';
    RAISE NOTICE '📝 New columns: messages.reply_to_id, messages.edited_at';
    RAISE NOTICE '📝 New columns: direct_messages.reply_to_id, direct_messages.edited_at';
    RAISE NOTICE '🎉 New table: message_reactions (for emoji reactions)';
    RAISE NOTICE '🎉 New table: dm_reactions (for DM reactions)';
    RAISE NOTICE '📌 New table: pinned_messages (max 25 per squad)';
    RAISE NOTICE '🔒 RLS policies enabled for all new tables';
    RAISE NOTICE '⚡ Realtime enabled for reactions and pins';
END $$;
