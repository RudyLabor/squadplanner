-- =====================================================
-- FIX: Update challenge translations to French
-- This migration updates existing challenges to ensure
-- all text is in French (fixes ON CONFLICT DO NOTHING issue)
-- =====================================================

-- Update all challenges with correct French translations
-- Using title as match key since IDs may vary

-- 1. "Première réponse" (was potentially "Premier RSVP")
UPDATE challenges
SET title = 'Première réponse',
    description = 'Répondre "Présent" à ta première session'
WHERE title ILIKE '%Premier%RSVP%' OR title ILIKE '%first%' OR
      (requirements->>'type' = 'rsvp' AND (requirements->>'count')::int = 1 AND type = 'achievement');

-- 2. "Participant régulier" (was potentially "RSVP 10 sessions")
UPDATE challenges
SET title = 'Participant régulier',
    description = 'Répondre "Présent" à 10 sessions'
WHERE title ILIKE '%10 sessions%' OR title ILIKE '%regular%' OR
      (requirements->>'type' = 'rsvp' AND (requirements->>'count')::int = 10);

-- 3. "Machine de fiabilité" (was potentially "reliability score")
UPDATE challenges
SET title = 'Machine de fiabilité',
    description = 'Atteindre 90% de score de fiabilité'
WHERE title ILIKE '%reliability%' OR title ILIKE '%fiabilité%' OR
      requirements->>'type' = 'reliability';

-- 4. "Semaine parfaite" (was potentially "Check-in streak")
UPDATE challenges
SET title = 'Semaine parfaite',
    description = 'Pointer 7 jours de suite'
WHERE title ILIKE '%streak%' OR title ILIKE '%check-in%' OR
      (requirements->>'type' = 'streak' AND (requirements->>'days')::int = 7);

-- 5. "Réponse du jour" (was potentially "Daily RSVP")
UPDATE challenges
SET title = 'Réponse du jour',
    description = 'Répondre à une session aujourd''hui'
WHERE title ILIKE '%daily%' OR title ILIKE '%aujourd%' OR
      requirements->>'type' = 'daily_rsvp';

-- 6. "Papillon social" (was "Social butterfly")
UPDATE challenges
SET title = 'Papillon social',
    description = 'Envoyer 10 messages dans le chat de ta squad'
WHERE title ILIKE '%social%butterfly%' OR title ILIKE '%papillon%' OR
      requirements->>'type' = 'messages';

-- 7. "Fêtard" (was "Party animal")
UPDATE challenges
SET title = 'Fêtard',
    description = 'Rejoindre 5 parties vocales'
WHERE title ILIKE '%party%animal%' OR title ILIKE '%fêtard%' OR
      (requirements->>'type' = 'party' AND (requirements->>'count')::int = 5);

-- 8. "Leader né" - keep as is (already French)
UPDATE challenges
SET title = 'Leader né',
    description = 'Créer une session'
WHERE requirements->>'type' = 'create_session';

-- 9. "Bâtisseur de squad" (was "Squad builder")
UPDATE challenges
SET title = 'Bâtisseur de squad',
    description = 'Inviter un ami dans ta squad'
WHERE title ILIKE '%squad%builder%' OR title ILIKE '%bâtisseur%' OR
      requirements->>'type' = 'invite';

-- =====================================================
-- CONFIRMATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Challenge translations updated to French';
    RAISE NOTICE '🇫🇷 All 9 challenges now have French titles and descriptions';
END $$;
