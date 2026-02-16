-- ============================================================
-- Migration: Referral System (Phase 1.4)
-- Adds referrals table, referral_code to profiles,
-- and referral processing functions
-- ============================================================

-- 1. Add referral columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id);

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, signed_up, converted
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  referrer_reward_type TEXT, -- 'xp', 'premium_days', 'badge'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 4. RLS for referrals table
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Users can see their own referrals (as referrer or referred)
DROP POLICY IF EXISTS referrals_select_own ON referrals;
CREATE POLICY referrals_select_own ON referrals
  FOR SELECT USING (
    auth.uid() = referrer_id OR auth.uid() = referred_id
  );

-- Users can insert referrals (system creates them via edge function)
DROP POLICY IF EXISTS referrals_insert ON referrals;
CREATE POLICY referrals_insert ON referrals
  FOR INSERT WITH CHECK (true);

-- 5. Auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Format: USERNAME-SP26 (uppercase, max 20 chars)
  IF NEW.referral_code IS NULL AND NEW.username IS NOT NULL THEN
    NEW.referral_code := UPPER(LEFT(REPLACE(NEW.username, ' ', ''), 12)) || '-SP26';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_referral_code ON profiles;
CREATE TRIGGER trigger_generate_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION generate_referral_code();

-- 6. Generate referral codes for existing profiles that don't have one
UPDATE profiles
SET referral_code = UPPER(LEFT(REPLACE(username, ' ', ''), 12)) || '-SP26'
WHERE referral_code IS NULL AND username IS NOT NULL;

-- 7. Function to process a referral signup
CREATE OR REPLACE FUNCTION process_referral_signup(
  p_referral_code TEXT,
  p_new_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
  v_referrer_count INTEGER;
BEGIN
  -- Find the referrer
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = UPPER(p_referral_code);

  IF v_referrer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Code de parrainage invalide');
  END IF;

  -- Cannot refer yourself
  IF v_referrer_id = p_new_user_id THEN
    RETURN json_build_object('success', false, 'error', 'Tu ne peux pas te parrainer toi-même');
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referrer_id = v_referrer_id AND referred_id = p_new_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Déjà parrainé');
  END IF;

  -- Create referral record
  INSERT INTO referrals (referrer_id, referred_id, referral_code, status)
  VALUES (v_referrer_id, p_new_user_id, UPPER(p_referral_code), 'signed_up')
  RETURNING id INTO v_referral_id;

  -- Update new user's referred_by
  UPDATE profiles SET referred_by = v_referrer_id WHERE id = p_new_user_id;

  -- Reward: +500 XP to referrer
  UPDATE profiles SET xp = xp + 500 WHERE id = v_referrer_id;

  -- Reward: 7 days Premium trial to referred user
  UPDATE profiles
  SET subscription_tier = 'premium',
      subscription_expires_at = GREATEST(
        COALESCE(subscription_expires_at, now()),
        now()
      ) + interval '7 days'
  WHERE id = p_new_user_id AND subscription_tier = 'free';

  -- Reward: 7 days Premium to referrer
  UPDATE profiles
  SET subscription_tier = CASE
        WHEN subscription_tier = 'free' THEN 'premium'::subscription_tier
        ELSE subscription_tier
      END,
      subscription_expires_at = GREATEST(
        COALESCE(subscription_expires_at, now()),
        now()
      ) + interval '7 days'
  WHERE id = v_referrer_id;

  -- Check milestone badges
  SELECT COUNT(*) INTO v_referrer_count
  FROM referrals
  WHERE referrer_id = v_referrer_id AND status IN ('signed_up', 'converted');

  RETURN json_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id,
    'referrer_total_referrals', v_referrer_count,
    'rewards', json_build_object(
      'referrer_xp', 500,
      'referrer_premium_days', 7,
      'referred_premium_days', 7
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Function to get referral stats for a user
CREATE OR REPLACE FUNCTION get_referral_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'referral_code', p.referral_code,
    'total_referrals', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id),
    'signed_up', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status = 'signed_up'),
    'converted', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status = 'converted'),
    'pending', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status = 'pending'),
    'total_xp_earned', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status IN ('signed_up', 'converted')) * 500,
    'milestones', json_build_object(
      'recruiter_3', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status IN ('signed_up', 'converted')) >= 3,
      'recruiter_10', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status IN ('signed_up', 'converted')) >= 10,
      'recruiter_25', (SELECT COUNT(*) FROM referrals WHERE referrer_id = p_user_id AND status IN ('signed_up', 'converted')) >= 25
    )
  ) INTO v_result
  FROM profiles p
  WHERE p.id = p_user_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
