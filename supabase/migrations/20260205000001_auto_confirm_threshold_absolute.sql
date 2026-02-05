-- =====================================================
-- MIGRATION: Auto-confirmation avec seuil absolu
-- Version: 1.0.0
-- Date: 2026-02-05
-- Description:
--   - Change la logique d'auto-confirmation : seuil absolu (nombre de "Oui") au lieu de pourcentage
--   - Defaut: 3, Minimum: 2
--   - Envoie un message systeme lors de l'auto-confirmation
-- =====================================================

-- Modifier le commentaire et la valeur par defaut de auto_confirm_threshold
COMMENT ON COLUMN sessions.auto_confirm_threshold IS 'Nombre minimum de RSVP "present" pour auto-confirmer la session (defaut: 3, min: 2)';

-- Mettre a jour la valeur par defaut de 70 (pourcentage) a 3 (nombre absolu)
ALTER TABLE sessions ALTER COLUMN auto_confirm_threshold SET DEFAULT 3;

-- Ajouter une contrainte de validation (minimum 2)
ALTER TABLE sessions ADD CONSTRAINT check_auto_confirm_threshold_min
  CHECK (auto_confirm_threshold >= 2 OR auto_confirm_threshold IS NULL);

-- Mettre a jour les sessions existantes qui ont la valeur 70 (ancien defaut pourcentage)
-- vers la nouvelle valeur par defaut de 3
UPDATE sessions
SET auto_confirm_threshold = 3
WHERE auto_confirm_threshold = 70;

-- =====================================================
-- Fonction amelioree d'auto-confirmation avec message systeme
-- =====================================================

CREATE OR REPLACE FUNCTION check_session_auto_confirm()
RETURNS TRIGGER AS $$
DECLARE
    positive_responses INTEGER;
    session_record RECORD;
    session_date TEXT;
    system_user_id UUID;
BEGIN
    -- Recuperer les infos de la session
    SELECT s.*, sq.owner_id INTO session_record
    FROM sessions s
    JOIN squads sq ON sq.id = s.squad_id
    WHERE s.id = NEW.session_id;

    -- Ne rien faire si la session n'est pas en statut "proposed"
    IF session_record.status != 'proposed' THEN
        RETURN NEW;
    END IF;

    -- Compter les reponses "present" (Oui)
    SELECT COUNT(*) INTO positive_responses
    FROM session_rsvps
    WHERE session_id = NEW.session_id AND response = 'present';

    -- Auto-confirmer si le seuil absolu est atteint
    -- Le seuil est maintenant un nombre absolu, pas un pourcentage
    IF positive_responses >= COALESCE(session_record.auto_confirm_threshold, 3) THEN
        -- Mettre a jour le statut de la session
        UPDATE sessions SET status = 'confirmed' WHERE id = NEW.session_id;

        -- Formater la date pour le message
        session_date := TO_CHAR(session_record.scheduled_at AT TIME ZONE 'Europe/Paris', 'DD/MM/YYYY a HH24:MI');

        -- Utiliser le owner de la squad comme sender pour le message systeme
        system_user_id := session_record.owner_id;

        -- Inserer un message systeme dans le chat de la squad
        INSERT INTO messages (
            squad_id,
            session_id,
            sender_id,
            content,
            is_system_message,
            is_ai_suggestion
        ) VALUES (
            session_record.squad_id,
            NEW.session_id,
            system_user_id,
            'Session confirmee pour le ' || session_date || ' ! ' || positive_responses || ' joueurs sont presents.',
            true,
            false
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Le trigger existe deja (on_rsvp_check_confirm), pas besoin de le recreer
-- Il utilise automatiquement la nouvelle version de la fonction
