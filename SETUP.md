# 🚀 SETUP SQUAD PLANNER - Instructions

## État actuel (4 février 2026)

❌ **Le projet Supabase `nxbqiwmfyafgshxzcxo` n'est PAS accessible après 5 minutes de vérification.**

Le DNS ne résout pas. Cela signifie probablement :
- Le projet n'a pas été créé complètement
- Il y a une erreur dans le project ID
- Le projet est dans un état "Paused" ou "Inactive"

**⚠️ ACTION REQUISE AU RÉVEIL :**

1. Va sur https://supabase.com/dashboard/projects
2. Vérifie que le projet existe et est en état **"Active"**
3. Copie l'URL exacte du projet (Settings > API > URL)
4. Si l'URL est différente, mets à jour le fichier `.env` :
   ```
   VITE_SUPABASE_URL=https://[ton-project-id].supabase.co
   ```
5. Relance le script de vérification :
   ```bash
   node scripts/check-supabase.mjs
   ```

## Ce qui a été fait ✅

### Backend Supabase
1. **Migration SQL complète** - `supabase/migrations/20260204000001_initial_schema.sql`
   - 9 tables (profiles, squads, squad_members, sessions, session_rsvps, session_checkins, messages, ai_insights, subscriptions)
   - Politiques RLS pour toutes les tables
   - Triggers automatiques (auto-create profile, calcul fiabilité, auto-confirm session)
   - Fonctions IA (get_best_slots, get_slot_reliability, calculate_reliability_score)
   - Vues (session_stats, squad_members_with_profiles)

2. **Edge Functions** - `supabase/functions/`
   - `ai-planning` - Suggestions de créneaux optimaux
   - `ai-decision` - Recommandations confirm/cancel/reschedule
   - `ai-reliability` - Analyse de fiabilité par joueur
   - `stripe-webhook` - Gestion des paiements Stripe

### Frontend React
3. **Types TypeScript** mis à jour - `src/types/database.ts`
4. **Hooks créés** - `src/hooks/`
   - `useMessages` - Chat realtime avec Supabase
   - `useAI` - Intégration des fonctionnalités IA
   - `useSubscription` - Gestion abonnements Stripe
5. **Page Messages** - Chat fonctionnel avec conversations par squad
6. **Page Sessions** - Suggestions IA intégrées

### Qualité
7. **Build** vérifié et fonctionnel ✅
8. **Lint** vérifié sans erreurs ✅
9. **Tests E2E** configurés avec Playwright
10. **Fichier .env** configuré avec les nouvelles clés

## À faire quand le projet Supabase est prêt

### 1. Vérifier que le projet est accessible

```bash
node scripts/check-supabase.mjs
```

### 2. Exécuter la migration SQL

1. Va sur https://supabase.com/dashboard/project/nxbqiwmfyafgshxzcxo/sql
2. Copie le contenu de `supabase/migrations/20260204000001_initial_schema.sql`
3. Exécute le SQL

### 3. Tester l'application

```bash
npm run dev
```

L'app sera disponible sur http://localhost:5173

### 4. Lancer les tests E2E

```bash
npm run test
```

## En cas de problème

Si le projet Supabase ne répond toujours pas après 30 minutes, vérifie :
1. Le dashboard Supabase pour voir l'état du projet
2. Que le project ID est correct : `nxbqiwmfyafgshxzcxo`

## Clés configurées

- **URL:** https://nxbqiwmfyafgshxzcxo.supabase.co
- **Anon Key:** configurée dans .env
- **Service Role Key:** configurée dans .env (ne pas exposer !)
