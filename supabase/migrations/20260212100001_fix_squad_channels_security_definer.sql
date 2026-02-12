-- ============================================================
-- FIX: Add SECURITY DEFINER to create_default_channel()
--
-- BUG: 100% of new users are blocked at onboarding because the
-- trigger fires AFTER INSERT ON squads but runs with the calling
-- user's permissions. RLS on squad_channels requires the user to
-- be a leader/co_leader in squad_members — but that row may not
-- exist yet when the trigger fires. SECURITY DEFINER makes the
-- function run as the DB owner, bypassing RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_channel()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO squad_channels (squad_id, name, description, channel_type, is_default, created_by)
    VALUES (NEW.id, 'général', 'Chat général de la squad', 'text', true, NEW.owner_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
