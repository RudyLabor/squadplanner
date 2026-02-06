# Configuration des Cron Jobs - Squad Planner

## Vue d'ensemble

L'Edge Function `send-reminders` envoie des rappels automatiques pour les sessions a venir.
Elle doit etre executee regulierement via un scheduler.

## Methode 1: pg_cron (Recommande - Supabase Native)

### Prerequis

1. **Activer pg_cron via le Dashboard Supabase:**
   - Aller dans Database > Extensions
   - Chercher `pg_cron`
   - Cliquer sur Enable

2. **Activer pg_net (pour les appels HTTP):**
   - Database > Extensions > `pg_net` > Enable

### Application de la migration

```bash
# Via Supabase CLI
supabase db push

# Ou manuellement via SQL Editor dans le Dashboard
# Copier le contenu de: supabase/migrations/20260205125836_schedule_reminders_cron.sql
```

### Verification

```sql
-- Voir tous les jobs schedules
SELECT * FROM scheduled_jobs;

-- Voir l'historique des executions
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- Voir les logs de rappels
SELECT * FROM reminder_logs
ORDER BY sent_at DESC
LIMIT 20;
```

### Jobs configures

| Job | Frequence | Description |
|-----|-----------|-------------|
| `send-reminders-hourly` | Toutes les heures a :00 | Rappels principaux |
| `send-reminders-quarter` | A :15, :30, :45 | Rappels complementaires |

### Modification de la frequence

```sql
-- Desactiver un job
SELECT cron.unschedule('send-reminders-hourly');

-- Changer la frequence (ex: toutes les 30 minutes)
SELECT cron.schedule(
    'send-reminders-custom',
    '0,30 * * * *',  -- Toutes les 30 minutes
    $$SELECT invoke_send_reminders()$$
);
```

---

## Methode 2: Supabase Dashboard (Alternative)

Si pg_cron n'est pas disponible ou si vous preferez une interface graphique:

1. Aller dans **Database > Cron Jobs** dans le Dashboard Supabase
2. Cliquer sur **"New Job"**
3. Configurer:
   - **Name:** `send-reminders`
   - **Schedule:** `0 * * * *` (toutes les heures)
   - **Command:**
     ```sql
     SELECT net.http_post(
         url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders',
         headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
         body := '{}'::jsonb
     );
     ```
4. Remplacer:
   - `YOUR_PROJECT_REF` par votre Project Reference (ex: `abcdefghijklmnop`)
   - `YOUR_ANON_KEY` par votre clef anon (pas service_role pour la securite)

---

## Methode 3: Service externe (Fallback)

Si pg_cron et le Dashboard ne fonctionnent pas.

### Option A: cron-job.org (Gratuit)

1. Creer un compte sur https://cron-job.org
2. Creer un nouveau job:
   - **URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders`
   - **Schedule:** Every hour
   - **Method:** POST
   - **Headers:**
     ```
     Authorization: Bearer YOUR_ANON_KEY
     Content-Type: application/json
     ```
3. Activer le job

### Option B: EasyCron (Alternative)

1. Creer un compte sur https://www.easycron.com
2. Configuration similaire a cron-job.org

### Option C: GitHub Actions

Creer `.github/workflows/send-reminders.yml`:

```yaml
name: Send Reminders

on:
  schedule:
    # Toutes les heures
    - cron: '0 * * * *'
  workflow_dispatch: # Permet l'execution manuelle

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger send-reminders Edge Function
        run: |
          curl -X POST \
            "${{ secrets.SUPABASE_URL }}/functions/v1/send-reminders" \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json"
```

**Secrets a configurer dans GitHub:**
- `SUPABASE_URL`: `https://YOUR_PROJECT_REF.supabase.co`
- `SUPABASE_ANON_KEY`: Votre clef anon publique

---

## Securite

### Bonnes pratiques

1. **Utiliser la clef anon** (pas service_role) pour les appels externes
2. L'Edge Function verifie l'authentification et utilise sa propre service_role_key
3. Ne jamais exposer la service_role_key dans le code client ou les workflows publics

### Variables d'environnement requises (Edge Function)

L'Edge Function `send-reminders` utilise ces variables (automatiques sur Supabase):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Troubleshooting

### Le job ne s'execute pas

1. Verifier que pg_cron est active:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Verifier que pg_net est active:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_net';
   ```

3. Verifier les erreurs:
   ```sql
   SELECT * FROM cron.job_run_details
   WHERE status = 'failed'
   ORDER BY start_time DESC;
   ```

### L'Edge Function echoue

1. Verifier les logs dans Supabase Dashboard > Edge Functions > send-reminders > Logs

2. Tester manuellement:
   ```bash
   curl -X POST \
     "https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-reminders" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

### Pas de notifications envoyees

1. Verifier qu'il y a des sessions confirmees a venir:
   ```sql
   SELECT * FROM sessions
   WHERE status = 'confirmed'
   AND scheduled_at > NOW()
   AND scheduled_at < NOW() + INTERVAL '2 hours';
   ```

2. Verifier que les utilisateurs ont des RSVP "present":
   ```sql
   SELECT * FROM session_rsvps
   WHERE response = 'present'
   AND session_id IN (
     SELECT id FROM sessions
     WHERE status = 'confirmed'
     AND scheduled_at > NOW()
   );
   ```

---

## Monitoring

### Dashboard recommande

Creer une vue de monitoring:

```sql
CREATE OR REPLACE VIEW cron_monitoring AS
SELECT
    j.jobname,
    j.schedule,
    j.active,
    jrd.start_time AS last_run,
    jrd.status AS last_status,
    jrd.return_message
FROM cron.job j
LEFT JOIN LATERAL (
    SELECT * FROM cron.job_run_details
    WHERE jobid = j.jobid
    ORDER BY start_time DESC
    LIMIT 1
) jrd ON true
ORDER BY j.jobname;
```

### Alertes (optionnel)

Pour etre alerte en cas d'echec, integrer avec:
- Supabase Webhooks
- Sentry
- PagerDuty
- Slack via webhook

---

## Resume

| Methode | Complexite | Fiabilite | Cout |
|---------|------------|-----------|------|
| pg_cron | Faible | Haute | Gratuit (Supabase) |
| Dashboard | Tres faible | Haute | Gratuit |
| cron-job.org | Faible | Moyenne | Gratuit |
| GitHub Actions | Moyenne | Moyenne | Gratuit (limites) |

**Recommandation:** Utiliser pg_cron via la migration SQL fournie.
