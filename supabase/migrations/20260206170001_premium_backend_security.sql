-- =====================================================
-- PREMIUM BACKEND SECURITY
-- Sécurise les features premium côté backend
-- =====================================================

-- =====================================================
-- 1. LIMITE DE CRÉATION DE SQUADS (FREE = 2 MAX)
-- =====================================================

-- Fonction pour compter les squads d'un utilisateur
CREATE OR REPLACE FUNCTION count_user_squads(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM squad_members
        WHERE user_id = p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction pour vérifier si l'utilisateur est premium
CREATE OR REPLACE FUNCTION is_user_premium(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_tier TEXT;
    v_expires TIMESTAMPTZ;
    v_has_premium_squad BOOLEAN;
BEGIN
    -- Vérifier le tier du profil
    SELECT subscription_tier::TEXT, subscription_expires_at
    INTO v_tier, v_expires
    FROM profiles
    WHERE id = p_user_id;

    -- Si premium et pas expiré
    IF v_tier = 'premium' AND (v_expires IS NULL OR v_expires > NOW()) THEN
        RETURN TRUE;
    END IF;

    -- Vérifier si membre d'une squad premium
    SELECT EXISTS (
        SELECT 1
        FROM squad_members sm
        JOIN squads s ON s.id = sm.squad_id
        WHERE sm.user_id = p_user_id
          AND s.is_premium = TRUE
    ) INTO v_has_premium_squad;

    -- Vérifier les subscriptions actives
    IF NOT v_has_premium_squad THEN
        SELECT EXISTS (
            SELECT 1
            FROM subscriptions sub
            JOIN squad_members sm ON sm.squad_id = sub.squad_id
            WHERE sm.user_id = p_user_id
              AND sub.status = 'active'
        ) INTO v_has_premium_squad;
    END IF;

    RETURN COALESCE(v_has_premium_squad, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Fonction pour vérifier si l'utilisateur peut créer une squad
CREATE OR REPLACE FUNCTION can_create_squad(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_squad_count INTEGER;
    v_is_premium BOOLEAN;
BEGIN
    v_is_premium := is_user_premium(p_user_id);

    -- Premium = illimité
    IF v_is_premium THEN
        RETURN TRUE;
    END IF;

    -- Free = max 2 squads
    v_squad_count := count_user_squads(p_user_id);
    RETURN v_squad_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Trigger pour bloquer la création de squad si limite atteinte
CREATE OR REPLACE FUNCTION check_squad_creation_limit()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier si l'utilisateur peut créer une squad
    IF NOT can_create_squad(NEW.owner_id) THEN
        RAISE EXCEPTION 'Limite de 2 squads atteinte. Passez Premium pour créer des squads illimités.'
            USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger sur INSERT
DROP TRIGGER IF EXISTS enforce_squad_limit ON squads;
CREATE TRIGGER enforce_squad_limit
    BEFORE INSERT ON squads
    FOR EACH ROW
    EXECUTE FUNCTION check_squad_creation_limit();

-- =====================================================
-- 2. HISTORIQUE LIMITÉ POUR FREE (30 JOURS)
-- =====================================================

-- Fonction pour récupérer les sessions avec limite de date pour free
CREATE OR REPLACE FUNCTION get_user_sessions_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    session_id UUID,
    squad_id UUID,
    squad_name TEXT,
    title TEXT,
    game TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT,
    duration_minutes INTEGER,
    my_rsvp TEXT,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    v_is_premium BOOLEAN;
    v_history_limit INTERVAL;
BEGIN
    v_is_premium := is_user_premium(p_user_id);

    -- Free = 30 jours, Premium = illimité (10 ans)
    v_history_limit := CASE WHEN v_is_premium THEN INTERVAL '10 years' ELSE INTERVAL '30 days' END;

    RETURN QUERY
    SELECT
        s.id as session_id,
        s.squad_id,
        sq.name as squad_name,
        s.title,
        s.game,
        s.scheduled_at,
        s.status::TEXT,
        s.duration_minutes,
        sr.response::TEXT as my_rsvp,
        s.created_at
    FROM sessions s
    JOIN squads sq ON sq.id = s.squad_id
    JOIN squad_members sm ON sm.squad_id = s.squad_id AND sm.user_id = p_user_id
    LEFT JOIN session_rsvps sr ON sr.session_id = s.id AND sr.user_id = p_user_id
    WHERE s.created_at >= NOW() - v_history_limit
    ORDER BY s.scheduled_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_sessions_history(UUID, INTEGER) TO authenticated;

-- =====================================================
-- 3. STATS AVANCÉES - GATING BACKEND
-- =====================================================

-- Fonction pour récupérer les stats (basiques pour free, avancées pour premium)
CREATE OR REPLACE FUNCTION get_squad_stats(
    p_squad_id UUID,
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_is_premium BOOLEAN;
    v_is_squad_premium BOOLEAN;
    v_basic_stats JSONB;
    v_advanced_stats JSONB;
BEGIN
    -- Vérifier les permissions premium
    v_is_premium := is_user_premium(p_user_id);

    SELECT is_premium INTO v_is_squad_premium
    FROM squads WHERE id = p_squad_id;

    -- Stats basiques (toujours disponibles)
    SELECT jsonb_build_object(
        'total_sessions', COALESCE(sq.total_sessions, 0),
        'total_members', COALESCE(sq.total_members, 0),
        'avg_reliability', COALESCE(sq.avg_reliability_score, 100)
    ) INTO v_basic_stats
    FROM squads sq
    WHERE sq.id = p_squad_id;

    -- Si non-premium, retourner seulement les stats basiques
    IF NOT v_is_premium AND NOT COALESCE(v_is_squad_premium, FALSE) THEN
        RETURN v_basic_stats || jsonb_build_object('premium_locked', TRUE);
    END IF;

    -- Stats avancées pour premium
    SELECT jsonb_build_object(
        -- Tendances sur 30 jours
        'sessions_last_30_days', (
            SELECT COUNT(*)
            FROM sessions
            WHERE squad_id = p_squad_id
              AND created_at >= NOW() - INTERVAL '30 days'
        ),
        'sessions_trend', (
            SELECT
                CASE
                    WHEN last_30 > prev_30 THEN 'up'
                    WHEN last_30 < prev_30 THEN 'down'
                    ELSE 'stable'
                END
            FROM (
                SELECT
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days') as prev_30
                FROM sessions WHERE squad_id = p_squad_id
            ) t
        ),
        -- Top joueurs
        'top_players', (
            SELECT jsonb_agg(jsonb_build_object(
                'user_id', user_id,
                'username', username,
                'sessions_attended', sessions_attended,
                'reliability', reliability
            ))
            FROM (
                SELECT
                    p.id as user_id,
                    p.username,
                    COUNT(sc.id) as sessions_attended,
                    p.reliability_score as reliability
                FROM profiles p
                JOIN squad_members sm ON sm.user_id = p.id
                LEFT JOIN session_checkins sc ON sc.user_id = p.id AND sc.status = 'present'
                WHERE sm.squad_id = p_squad_id
                GROUP BY p.id, p.username, p.reliability_score
                ORDER BY sessions_attended DESC
                LIMIT 5
            ) top
        ),
        -- Jours les plus actifs
        'most_active_days', (
            SELECT jsonb_agg(jsonb_build_object(
                'day', to_char(scheduled_at, 'Day'),
                'count', cnt
            ))
            FROM (
                SELECT
                    scheduled_at,
                    COUNT(*) as cnt
                FROM sessions
                WHERE squad_id = p_squad_id
                  AND status IN ('confirmed', 'completed')
                GROUP BY EXTRACT(DOW FROM scheduled_at), scheduled_at
                ORDER BY cnt DESC
                LIMIT 3
            ) days
        ),
        'premium_locked', FALSE
    ) INTO v_advanced_stats;

    RETURN v_basic_stats || v_advanced_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_squad_stats(UUID, UUID) TO authenticated;

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION count_user_squads(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_premium(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_squad(UUID) TO authenticated;

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Premium backend security migration completed!';
    RAISE NOTICE '🔒 Squad creation limit: Trigger enforces 2 squad limit for free users';
    RAISE NOTICE '📅 History filtering: get_user_sessions_history() limits to 30 days for free';
    RAISE NOTICE '📊 Stats gating: get_squad_stats() returns limited data for free users';
END $$;
