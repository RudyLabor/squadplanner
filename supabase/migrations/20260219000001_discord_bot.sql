-- ============================================================
-- Migration: Discord Bot Integration (Phase 2.1)
-- Adds discord_user_id to profiles, creates discord_server_subscriptions,
-- and discord-specific linking + tier functions
-- ============================================================

-- 1. Add discord_user_id to profiles (immutable Discord ID, more reliable than username)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_discord_user_id
  ON profiles(discord_user_id)
  WHERE discord_user_id IS NOT NULL;

-- 2. Create discord_server_subscriptions table
CREATE TABLE IF NOT EXISTS discord_server_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT NOT NULL UNIQUE,
  guild_name TEXT,
  admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'free'
    CHECK (status IN ('free', 'premium', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  total_commands_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_discord_subs_guild
  ON discord_server_subscriptions(discord_guild_id);
CREATE INDEX IF NOT EXISTS idx_discord_subs_stripe
  ON discord_server_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_discord_subs_status
  ON discord_server_subscriptions(status);

-- 3. RLS (bot uses service role key, but enable for safety)
ALTER TABLE discord_server_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their admin subscriptions"
  ON discord_server_subscriptions
  FOR SELECT USING (admin_user_id = auth.uid());

-- 4. Updated_at trigger (reuse existing function)
CREATE TRIGGER update_discord_subs_updated_at
  BEFORE UPDATE ON discord_server_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Function: link discord user to SP profile
CREATE OR REPLACE FUNCTION link_discord_account(
  p_sp_username TEXT,
  p_discord_user_id TEXT,
  p_discord_username TEXT
)
RETURNS JSON AS $$
DECLARE
  v_profile_id UUID;
  v_existing UUID;
BEGIN
  -- Check if discord_user_id already linked to another profile
  SELECT id INTO v_existing
  FROM profiles
  WHERE discord_user_id = p_discord_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce compte Discord est deja lie a un autre profil SquadPlanner'
    );
  END IF;

  -- Find profile by username (case-insensitive)
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE LOWER(username) = LOWER(p_sp_username);

  IF v_profile_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Aucun profil SquadPlanner trouve avec ce username'
    );
  END IF;

  -- Link the account
  UPDATE profiles
  SET discord_user_id = p_discord_user_id,
      discord_username = p_discord_username
  WHERE id = v_profile_id;

  RETURN json_build_object(
    'success', true,
    'profile_id', v_profile_id,
    'username', p_sp_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Function: get server subscription status
CREATE OR REPLACE FUNCTION get_discord_server_tier(p_guild_id TEXT)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT status, current_period_end
  INTO v_status, v_period_end
  FROM discord_server_subscriptions
  WHERE discord_guild_id = p_guild_id;

  IF v_status IS NULL OR v_status = 'free' THEN
    RETURN 'free';
  END IF;

  IF v_status = 'premium' AND (v_period_end IS NULL OR v_period_end > now()) THEN
    RETURN 'premium';
  END IF;

  RETURN 'free';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
