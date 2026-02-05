-- ==============================================================
-- SCRIPT: Create calls table for voice call history
-- Parcours D - Appels vocaux 1-to-1 avec Agora
-- ==============================================================

-- Table calls pour l'historique des appels vocaux
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'missed' CHECK (status IN ('missed', 'answered', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les requetes frequentes
CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_receiver_id ON calls(receiver_id);
CREATE INDEX IF NOT EXISTS idx_calls_started_at ON calls(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_status ON calls(status);

-- Index composite pour l'historique d'un utilisateur
CREATE INDEX IF NOT EXISTS idx_calls_user_history ON calls(caller_id, receiver_id, started_at DESC);

-- RLS (Row Level Security)
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own calls (as caller or receiver)
CREATE POLICY "Users can view their own calls" ON calls
  FOR SELECT
  USING (
    auth.uid() = caller_id OR
    auth.uid() = receiver_id
  );

-- Policy: Users can create calls where they are the caller
CREATE POLICY "Users can create calls as caller" ON calls
  FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

-- Policy: Users can update calls they are part of
CREATE POLICY "Users can update their own calls" ON calls
  FOR UPDATE
  USING (
    auth.uid() = caller_id OR
    auth.uid() = receiver_id
  );

-- Enable realtime for calls table (for incoming call notifications)
ALTER PUBLICATION supabase_realtime ADD TABLE calls;

-- ==============================================================
-- FONCTION: Get call history for a user
-- ==============================================================
CREATE OR REPLACE FUNCTION get_call_history(user_id UUID, limit_count INT DEFAULT 50)
RETURNS TABLE (
  id UUID,
  caller_id UUID,
  caller_username TEXT,
  caller_avatar_url TEXT,
  receiver_id UUID,
  receiver_username TEXT,
  receiver_avatar_url TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  status TEXT,
  is_outgoing BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.caller_id,
    caller_profile.username AS caller_username,
    caller_profile.avatar_url AS caller_avatar_url,
    c.receiver_id,
    receiver_profile.username AS receiver_username,
    receiver_profile.avatar_url AS receiver_avatar_url,
    c.started_at,
    c.ended_at,
    c.duration_seconds,
    c.status,
    (c.caller_id = user_id) AS is_outgoing
  FROM calls c
  LEFT JOIN profiles caller_profile ON caller_profile.id = c.caller_id
  LEFT JOIN profiles receiver_profile ON receiver_profile.id = c.receiver_id
  WHERE c.caller_id = user_id OR c.receiver_id = user_id
  ORDER BY c.started_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- FONCTION: Get recent calls with a specific user
-- ==============================================================
CREATE OR REPLACE FUNCTION get_calls_with_user(current_user_id UUID, other_user_id UUID, limit_count INT DEFAULT 20)
RETURNS TABLE (
  id UUID,
  caller_id UUID,
  receiver_id UUID,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INT,
  status TEXT,
  is_outgoing BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.caller_id,
    c.receiver_id,
    c.started_at,
    c.ended_at,
    c.duration_seconds,
    c.status,
    (c.caller_id = current_user_id) AS is_outgoing
  FROM calls c
  WHERE
    (c.caller_id = current_user_id AND c.receiver_id = other_user_id) OR
    (c.caller_id = other_user_id AND c.receiver_id = current_user_id)
  ORDER BY c.started_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================
-- COMMENTAIRES
-- ==============================================================
COMMENT ON TABLE calls IS 'Historique des appels vocaux 1-to-1';
COMMENT ON COLUMN calls.caller_id IS 'ID de l''utilisateur qui a initie l''appel';
COMMENT ON COLUMN calls.receiver_id IS 'ID de l''utilisateur qui a recu l''appel';
COMMENT ON COLUMN calls.started_at IS 'Timestamp du debut de l''appel';
COMMENT ON COLUMN calls.ended_at IS 'Timestamp de fin de l''appel';
COMMENT ON COLUMN calls.duration_seconds IS 'Duree de l''appel en secondes (si connecte)';
COMMENT ON COLUMN calls.status IS 'Statut final: missed (manque), answered (repondu), rejected (refuse)';
