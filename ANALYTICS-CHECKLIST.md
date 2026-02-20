# Analytics Implementation Checklist

Checklist rapide pour la mise en place du tracking PostHog.

## ✅ Phase 1: Configuration (5 min)

- [ ] Créer compte PostHog sur https://eu.posthog.com
- [ ] Créer un projet "Squad Planner"
- [ ] Choisir région **EU** (RGPD)
- [ ] Copier la clé API (Project Settings)
- [ ] Ajouter dans Vercel: `vercel env add VITE_POSTHOG_KEY`
- [ ] Ajouter dans Vercel: `vercel env add VITE_POSTHOG_HOST` → `https://eu.i.posthog.com`

## ✅ Phase 2: Composants prioritaires (30 min)

### Premium Flow (Priorité 1 - Impact $$$)

- [x] `Premium.tsx` - Track `premium_viewed` ✅ FAIT
- [x] `Premium.tsx` - Track `premium_checkout_started` ✅ FAIT
- [ ] `PremiumSuccess.tsx` - Track `premium_subscribed`
- [ ] `PremiumCancel.tsx` - Track `premium_cancelled`

### Squad & Session (Priorité 2 - Engagement)

- [ ] `CreateSquadModal.tsx` - Track `squad_created`
- [ ] `SessionDetail.tsx` - Track `session_viewed`
- [ ] `SessionDetail.tsx` - Track `rsvp_submitted`
- [ ] `CreateSessionModal.tsx` - Track `session_created`

### Onboarding (Priorité 3 - Rétention)

- [ ] `TourGuide.tsx` - Track `onboarding_started`
- [ ] `TourGuide.tsx` - Track `onboarding_step_completed`
- [ ] `TourGuide.tsx` - Track `onboarding_finished`
- [ ] `TourGuide.tsx` - Track `onboarding_skipped`

### Social Actions (Priorité 4)

- [ ] `InviteModal.tsx` - Track `invite_sent`
- [ ] `MessagesStore.ts` - Track `message_sent`
- [ ] `VoiceCallStore.ts` - Track `voice_call_started`
- [ ] `VoiceCallStore.ts` - Track `voice_call_ended`

### Engagement (Priorité 5)

- [ ] `CommandPalette.tsx` - Track `command_palette_opened`
- [ ] `GlobalSearch.tsx` - Track `search_performed`
- [ ] `NotificationBanner.tsx` - Track `notification_clicked`

## ✅ Phase 3: Dashboards PostHog (15 min)

### Dashboard "Overview"

- [ ] Créer dashboard
- [ ] Ajouter "Total Users" (unique)
- [ ] Ajouter "DAU" (Daily Active Users)
- [ ] Ajouter "Top Events" (bar chart)
- [ ] Ajouter "Page Views" (line chart)

### Dashboard "Conversion"

- [ ] Créer dashboard
- [ ] Ajouter "Premium Funnel" (viewed → checkout → subscribed)
- [ ] Ajouter "RSVP Funnel" (viewed → submitted)
- [ ] Ajouter "Onboarding Funnel" (started → finished)

### Dashboard "Engagement"

- [ ] Créer dashboard
- [ ] Ajouter "Sessions Created" (per user)
- [ ] Ajouter "Messages Sent" (trend)
- [ ] Ajouter "Voice Calls" (count + duration)
- [ ] Ajouter "Retention Cohorts" (D1, D7, D30)

## ✅ Phase 4: Tests (10 min)

### En développement

- [ ] Lancer `npm run dev`
- [ ] Ouvrir DevTools Console
- [ ] Vérifier: `[Analytics] PostHog initialized`
- [ ] Accepter cookies analytics
- [ ] Naviguer → Vérifier: `[Analytics] Page view: /squads`
- [ ] Créer squad → Vérifier: `[Analytics] squad_created`
- [ ] Tester 2-3 autres événements

### En production

- [ ] Déployer avec `vercel --prod`
- [ ] Ouvrir PostHog > Live Events
- [ ] Naviguer sur l'app en prod
- [ ] Vérifier événements en temps réel (latence 5-30s)
- [ ] Tester sur mobile

## ✅ Phase 5: Privacy (5 min)

- [ ] Vérifier hébergement EU activé
- [ ] Vérifier consentement cookies requis
- [ ] Ajouter section Analytics dans Privacy Policy
- [ ] Documenter process droit à l'oubli
- [ ] Vérifier qu'aucune donnée sensible n'est trackée

## ✅ Phase 6: Analyse (Après 1 semaine)

### Premium Funnel

- [ ] Ouvrir funnel dans PostHog
- [ ] Noter taux de conversion global: ____%
- [ ] Noter taux viewed → checkout: ____%
- [ ] Noter taux checkout → subscribed: ____%
- [ ] Identifier point d'abandon principal
- [ ] Prioriser fix #1: ___________

### RSVP Funnel

- [ ] Noter taux de completion: ____%
- [ ] Identifier point d'abandon
- [ ] Prioriser fix #2: ___________

### Onboarding Funnel

- [ ] Noter taux de completion: ____%
- [ ] Noter étape avec plus grand drop: Step ___
- [ ] Prioriser fix #3: ___________

## ✅ Phase 7: Itérations (Ongoing)

### Semaine 1

- [ ] Implémenter fix #1 (Premium)
- [ ] Déployer
- [ ] Mesurer impact après 3 jours

### Semaine 2

- [ ] Implémenter fix #2 (RSVP ou Onboarding)
- [ ] Déployer
- [ ] Mesurer impact après 3 jours

### Semaine 3-4

- [ ] Continuer itérations basées sur data
- [ ] Documenter learnings
- [ ] Partager insights avec l'équipe

## 📊 Métriques cibles

Baselines (à mesurer après 1 semaine):

| Funnel | Taux actuel | Cible +30 jours | Cible +90 jours |
|--------|-------------|-----------------|-----------------|
| Premium | ___% | ___% (+10-20%) | ___% (+30-50%) |
| RSVP | ___% | ___% (+5-10%) | ___% (+15-25%) |
| Onboarding | ___% | ___% (+15-30%) | ___% (+40-60%) |

## 🚨 Troubleshooting rapide

**Événements n'apparaissent pas:**
```bash
# Vérifier env var
echo $VITE_POSTHOG_KEY

# Vérifier consentement
localStorage.getItem('sq-cookie-consent') # Doit être 'accepted'
```

**Erreurs console:**
```bash
# Vérifier la clé API est valide
# Format: phc_xxxxxxxxxxxxx...
```

**Trop d'événements:**
```typescript
// Réduire le batching dans analytics.ts
const FLUSH_INTERVAL = 10000 // 10s au lieu de 5s
const MAX_BUFFER_SIZE = 50 // 50 au lieu de 20
```

## 🎯 Quick Wins

**Top 3 actions à impact rapide:**

1. **Premium page** (30 min)
   - ✅ Track viewed, checkout, subscribed
   - Créer funnel PostHog
   - Identifier 1 amélioration

2. **Onboarding** (45 min)
   - Track started, steps, finished
   - Créer funnel PostHog
   - Simplifier étape avec + grand drop

3. **RSVP flow** (20 min)
   - Track viewed, submitted
   - Créer funnel PostHog
   - Rendre bouton RSVP plus visible

**ROI estimé**: 2h setup → +10-20% conversion Premium → +X€/mois

## 📚 Documentation

- **Setup guide**: `ANALYTICS-SETUP.md`
- **Implementation**: `ANALYTICS-IMPLEMENTATION.md`
- **Usage guide**: `src/utils/ANALYTICS.md`
- **Code**: `src/utils/analytics.ts`
- **Hook**: `src/hooks/useAnalytics.ts`

## ✅ Status

- [x] Core system implemented
- [x] Premium tracking (example)
- [ ] All components instrumented
- [ ] PostHog dashboards created
- [ ] Funnels analyzed
- [ ] First optimizations deployed

**Date de début**: ___________
**Date de fin Phase 1-3**: ___________
**Date première analyse**: ___________
