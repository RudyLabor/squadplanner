-- Script de création de la table direct_messages pour le Chat 1-to-1
-- À exécuter dans Supabase SQL Editor

-- Table des messages directs
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Contrainte : pas de message à soi-même
  CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_dm_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_dm_receiver ON direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_dm_created_at ON direct_messages(created_at DESC);

-- Index composite pour récupérer une conversation entre 2 users
CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- RLS Policies
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- Policy : Voir ses propres messages (envoyés ou reçus)
CREATE POLICY "Users can view their own direct messages"
ON direct_messages FOR SELECT
USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy : Envoyer des messages
CREATE POLICY "Users can send direct messages"
ON direct_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id
);

-- Policy : Marquer comme lu (seulement le receiver)
CREATE POLICY "Receiver can mark messages as read"
ON direct_messages FOR UPDATE
USING (
  auth.uid() = receiver_id
)
WITH CHECK (
  auth.uid() = receiver_id
);

-- Fonction pour obtenir les conversations DM d'un utilisateur
CREATE OR REPLACE FUNCTION get_dm_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_username TEXT,
  other_user_avatar_url TEXT,
  last_message_content TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_sender_id UUID,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT DISTINCT
      CASE
        WHEN sender_id = user_id THEN receiver_id
        ELSE sender_id
      END AS other_id
    FROM direct_messages
    WHERE sender_id = user_id OR receiver_id = user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE WHEN sender_id = user_id THEN receiver_id ELSE sender_id END
    )
      CASE WHEN sender_id = user_id THEN receiver_id ELSE sender_id END AS other_id,
      content,
      created_at,
      sender_id
    FROM direct_messages
    WHERE sender_id = user_id OR receiver_id = user_id
    ORDER BY
      CASE WHEN sender_id = user_id THEN receiver_id ELSE sender_id END,
      created_at DESC
  ),
  unread_counts AS (
    SELECT
      sender_id AS from_user,
      COUNT(*) AS count
    FROM direct_messages
    WHERE receiver_id = user_id AND read_at IS NULL
    GROUP BY sender_id
  )
  SELECT
    c.other_id,
    p.username,
    p.avatar_url,
    lm.content,
    lm.created_at,
    lm.sender_id,
    COALESCE(uc.count, 0)
  FROM conversations c
  JOIN profiles p ON p.id = c.other_id
  LEFT JOIN last_messages lm ON lm.other_id = c.other_id
  LEFT JOIN unread_counts uc ON uc.from_user = c.other_id
  ORDER BY lm.created_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les droits d'exécution
GRANT EXECUTE ON FUNCTION get_dm_conversations(UUID) TO authenticated;

-- Activer Realtime pour direct_messages
ALTER PUBLICATION supabase_realtime ADD TABLE direct_messages;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Table direct_messages créée avec succès !';
  RAISE NOTICE 'RLS policies activées.';
  RAISE NOTICE 'Realtime activé.';
END $$;
