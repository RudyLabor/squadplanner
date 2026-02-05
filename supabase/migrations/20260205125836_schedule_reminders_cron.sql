-- =====================================================
-- MIGRATION: Configuration pg_cron pour send-reminders
-- Version: 1.0.0
-- Date: 2026-02-05
-- Description:
--   - Active l'extension pg_cron (si disponible)
--   - Active l'extension pg_net pour les appels HTTP
--   - Schedule l'Edge Function send-reminders toutes les heures
--
-- IMPORTANT:
--   - pg_cron doit etre active dans les settings Supabase
--   - pg_net doit etre active pour les appels HTTP
--   - Voir README ci-dessous pour configuration via Dashboard
-- =====================================================

-- =====================================================
-- STEP 1: Activer les extensions necessaires
-- =====================================================

-- pg_net permet de faire des appels HTTP depuis PostgreSQL
-- Cette extension est pre-installee sur Supabase
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- pg_cron permet de scheduler des jobs
-- IMPORTANT: Sur Supabase, pg_cron doit etre active via le Dashboard
-- Database > Extensions > pg_cron > Enable
-- Si cette commande echoue, activez pg_cron via le Dashboard d'abord
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- =====================================================
-- STEP 2: Creer la table de tracking des reminders
-- =====================================================

-- Table pour tracker les rappels envoyes (eviter les doublons)
CREATE TABLE IF NOT EXISTS reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('1h', '15min', '5min')),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'skipped')),
    error_message TEXT,
    UNIQUE(session_id, user_id, reminder_type)
);

-- Index pour les requetes de verification
CREATE INDEX IF NOT EXISTS idx_reminder_logs_session_user
ON reminder_logs(session_id, user_id);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at
ON reminder_logs(sent_at);

-- RLS pour reminder_logs
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

-- Politique: seuls les admins peuvent voir les logs
CREATE POLICY "Service role can manage reminder_logs"
ON reminder_logs
FOR ALL
USING (auth.role() = 'service_role');

-- =====================================================
-- STEP 3: Fonction pour appeler send-reminders
-- =====================================================

-- Fonction wrapper pour appeler l'Edge Function
CREATE OR REPLACE FUNCTION invoke_send_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    project_url TEXT;
    service_key TEXT;
    request_id BIGINT;
BEGIN
    -- Recuperer les variables d'environnement
    -- NOTE: Ces valeurs sont disponibles automatiquement dans Supabase
    project_url := current_setting('app.settings.supabase_url', true);
    service_key := current_setting('app.settings.service_role_key', true);

    -- Si les settings ne sont pas disponibles, utiliser les valeurs par defaut
    -- IMPORTANT: Remplacer ces valeurs par vos vraies valeurs en production
    IF project_url IS NULL THEN
        -- Sera remplace par le script de deploiement ou via Dashboard
        project_url := current_setting('supabase.url', true);
    END IF;

    -- Appeler l'Edge Function via pg_net
    -- L'authentification se fait via le service_role_key
    SELECT net.http_post(
        url := COALESCE(project_url, 'https://YOUR_PROJECT_REF.supabase.co') || '/functions/v1/send-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('supabase.service_key', true))
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 30000
    ) INTO request_id;

    -- Log l'appel
    RAISE NOTICE 'send-reminders called, request_id: %', request_id;
END;
$$;

-- =====================================================
-- STEP 4: Configurer le cron job
-- =====================================================

-- Supprimer le job existant s'il existe (pour pouvoir re-executer la migration)
SELECT cron.unschedule('send-reminders-hourly')
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'send-reminders-hourly'
);

-- Scheduler le job toutes les heures a :00
-- Cron syntax: minute hour day month weekday
-- '0 * * * *' = chaque heure a minute 0
SELECT cron.schedule(
    'send-reminders-hourly',           -- Nom unique du job
    '0 * * * *',                       -- Toutes les heures a :00
    $$SELECT invoke_send_reminders()$$ -- Commande a executer
);

-- Optionnel: Ajouter un job supplementaire pour les rappels 15 minutes
-- Utile pour les sessions qui commencent entre les heures
SELECT cron.schedule(
    'send-reminders-quarter',          -- Nom unique du job
    '15,30,45 * * * *',               -- A :15, :30, et :45 de chaque heure
    $$SELECT invoke_send_reminders()$$ -- Commande a executer
);

-- =====================================================
-- STEP 5: Verification et documentation
-- =====================================================

-- Vue pour voir les jobs schedules
CREATE OR REPLACE VIEW scheduled_jobs AS
SELECT
    jobid,
    jobname,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active
FROM cron.job
ORDER BY jobname;

-- Commenter la vue
COMMENT ON VIEW scheduled_jobs IS 'Vue des jobs cron schedules. Utiliser SELECT * FROM scheduled_jobs pour voir tous les jobs.';

-- =====================================================
-- DOCUMENTATION
-- =====================================================

/*
## Configuration pg_cron pour Squad Planner

### Jobs schedules:
1. `send-reminders-hourly` - Toutes les heures a :00
2. `send-reminders-quarter` - A :15, :30, :45 de chaque heure

### Verification:
```sql
-- Voir tous les jobs
SELECT * FROM scheduled_jobs;

-- Voir l'historique des executions
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Voir les logs de rappels envoyes
SELECT * FROM reminder_logs ORDER BY sent_at DESC LIMIT 20;
```

### Modification de la frequence:
```sql
-- Desactiver temporairement
SELECT cron.unschedule('send-reminders-hourly');

-- Changer la frequence (ex: toutes les 30 minutes)
SELECT cron.schedule(
    'send-reminders-hourly',
    '0,30 * * * *',
    $$SELECT invoke_send_reminders()$$
);
```

### Si pg_cron n'est pas disponible:
Voir les alternatives dans GEMINI.md:
- Supabase Dashboard (Database > Cron Jobs)
- Service externe (cron-job.org, EasyCron)
- GitHub Actions scheduled workflow
*/

-- =====================================================
-- ALTERNATIVE: Configuration via SQL direct (sans fonction)
-- =====================================================

-- Si la fonction invoke_send_reminders() ne fonctionne pas,
-- utiliser cette version directe (decommentez si necessaire):

/*
SELECT cron.schedule(
    'send-reminders-direct',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);
*/
