# Analytics Implementation Summary

Infrastructure de tracking analytics avec PostHog (free tier) pour analyser les parcours utilisateurs et identifier les points d'abandon.

## ✅ Ce qui a été implémenté

### 1. Core Analytics System

**Fichier**: `src/utils/analytics.ts`

- ✅ Tracking d'événements typés avec `UserEvent`
- ✅ Batching (5s ou 20 événements)
- ✅ Respect du consentement cookies (RGPD)
- ✅ Identification utilisateur automatique
- ✅ Page views automatiques
- ✅ Lightweight (~3KB, fetch-based, pas de SDK)
- ✅ Graceful degradation si PostHog non configuré
- ✅ sendBeacon pour delivery fiable

### 2. Event Types

**23 événements** catégorisés pour analyser les funnels:

**Squad & Session**
- `squad_created`, `squad_joined`, `squad_left`
- `session_created`, `session_viewed`, `session_joined`, `session_left`

**RSVP Funnel**
- `rsvp_viewed`, `rsvp_submitted`, `rsvp_changed`

**Premium Conversion Funnel** ⭐
- `premium_viewed`, `premium_checkout_started`, `premium_subscribed`, `premium_cancelled`

**Onboarding Funnel** ⭐
- `onboarding_started`, `onboarding_step_completed`, `onboarding_skipped`, `onboarding_finished`

**Social Actions**
- `invite_sent`, `message_sent`, `voice_call_started`, `voice_call_ended`

**Engagement**
- `command_palette_opened`, `search_performed`, `notification_clicked`

### 3. Integration Points

**ClientShell.tsx**
- ✅ Initialisation automatique au mount
- ✅ Page view tracking sur changement de route
- ✅ Identification utilisateur à la connexion

**Premium.tsx** (exemple)
- ✅ Track `premium_viewed` au mount
- ✅ Track `premium_checkout_started` au click

**trackEvent.ts** (existant)
- ✅ Intégration avec data-track attributes
- ✅ Events des clics envoyés à PostHog

### 4. React Hook

**Fichier**: `src/hooks/useAnalytics.ts`

```typescript
const analytics = useAnalytics()

// Track event
analytics.track('squad_created', { game: 'valorant' })
```

Export dans `src/hooks/index.ts` pour import facile:
```typescript
import { useAnalytics } from '@/hooks'
```

### 5. Configuration

**.env.example**
```bash
VITE_POSTHOG_KEY=phc_xxxxx...
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

**CookieConsent.tsx**
- ✅ Export de `COOKIE_CONSENT_KEY` pour vérification consentement

### 6. Documentation

- ✅ `src/utils/ANALYTICS.md` - Guide d'utilisation complet
- ✅ `ANALYTICS-SETUP.md` - Guide de configuration PostHog
- ✅ `ANALYTICS-IMPLEMENTATION.md` - Ce fichier

### 7. Tests

- ✅ `src/utils/__tests__/analytics.test.ts` - Tests unitaires basiques

## 🎯 Funnels à créer dans PostHog

### Premium Conversion (Priorité 1)

```
1. premium_viewed              (100%)
2. premium_checkout_started    (~X%)
3. premium_subscribed          (~Y%)
```

**Métriques clés**:
- Taux de conversion global
- Temps moyen entre viewed → checkout
- Taux d'abandon au checkout

### RSVP Flow (Priorité 2)

```
1. session_viewed
2. rsvp_viewed
3. rsvp_submitted
```

**Métriques clés**:
- % utilisateurs qui ouvrent le RSVP
- % qui submitent
- Temps de décision

### Onboarding (Priorité 3)

```
1. onboarding_started
2. onboarding_step_completed (step=1)
3. onboarding_step_completed (step=2)
4. onboarding_step_completed (step=3)
5. onboarding_finished
```

**Métriques clés**:
- % qui complètent le tour
- À quelle étape les users abandonnent
- Impact sur la rétention

## 🔧 Prochaines étapes

### 1. Configuration PostHog (5 min)

1. Créer compte sur https://eu.posthog.com
2. Copier la clé API du projet
3. Ajouter dans Vercel:
   ```bash
   vercel env add VITE_POSTHOG_KEY
   ```

### 2. Ajouter tracking dans les composants clés (30 min)

**CreateSquadModal.tsx**
```typescript
import { useAnalytics } from '@/hooks'

const analytics = useAnalytics()

async function handleCreate(data: SquadData) {
  const squad = await createSquad(data)
  analytics.track('squad_created', {
    squad_id: squad.id,
    game: data.game,
    is_public: data.is_public
  })
}
```

**SessionDetail.tsx**
```typescript
// Page view
useEffect(() => {
  analytics.track('session_viewed', { session_id })
}, [])

// RSVP
function handleRSVP(status: 'yes' | 'no' | 'maybe') {
  analytics.track('rsvp_submitted', { session_id, status })
}
```

**TourGuide.tsx**
```typescript
// Start
useEffect(() => {
  analytics.track('onboarding_started')
}, [])

// Step completed
function handleStepComplete(step: number) {
  analytics.track('onboarding_step_completed', { step })
}

// Finish
function handleFinish() {
  analytics.track('onboarding_finished', {
    duration: Date.now() - startTime
  })
}
```

**InviteModal.tsx**
```typescript
async function handleSendInvite(email: string) {
  await sendInvite(email)
  analytics.track('invite_sent', { squad_id, method: 'email' })
}
```

**MessagesStore.ts**
```typescript
async sendMessage(content: string) {
  const message = await this.api.sendMessage(content)
  trackEvent('message_sent', { squad_id: this.squadId })
}
```

**VoiceCallStore.ts**
```typescript
async startCall() {
  await this.livekit.connect()
  trackEvent('voice_call_started', { squad_id })
}
```

### 3. Créer les dashboards PostHog (15 min)

1. **Overview Dashboard**
   - Total users (unique)
   - DAU/MAU
   - Top events
   - Page views

2. **Conversion Dashboard**
   - Premium funnel
   - RSVP funnel
   - Onboarding funnel

3. **Engagement Dashboard**
   - Sessions created per user
   - Messages sent
   - Voice calls

### 4. Tester en dev (5 min)

```bash
# 1. Lancer l'app
npm run dev

# 2. Ouvrir console DevTools
# Vous devriez voir:
[Analytics] PostHog initialized: ...

# 3. Accepter cookies analytics

# 4. Naviguer
[Analytics] Page view: /squads

# 5. Faire des actions
[Analytics] squad_created { game: 'valorant' }
```

### 5. Déployer en prod (2 min)

```bash
# Vercel
vercel env add VITE_POSTHOG_KEY
vercel --prod

# Vérifier dans PostHog > Live Events
```

### 6. Analyser les abandons (Après 1 semaine de data)

1. Aller dans PostHog > Insights
2. Créer les funnels
3. Identifier où users drop:
   - Premium: viewed → checkout (trop cher? pas clair?)
   - RSVP: session → rsvp (bouton pas visible?)
   - Onboarding: étape X (trop complexe? pas clair?)

4. Prioriser les fixes selon impact:
   - Premium funnel = $$$
   - Onboarding = rétention
   - RSVP = engagement

## 📊 Métriques de succès

### Après 1 semaine

- ✅ PostHog reçoit des événements
- ✅ Les funnels sont créés
- ✅ On identifie 1-2 points d'abandon majeurs

### Après 1 mois

- ✅ Taux de conversion Premium mesuré
- ✅ Taux de completion RSVP mesuré
- ✅ Taux de completion Onboarding mesuré
- ✅ On a itéré sur 1-2 améliorations

### Après 3 mois

- ✅ Taux de conversion Premium +10-20%
- ✅ Taux de completion Onboarding +15-30%
- ✅ On comprend bien les parcours users

## 🔒 Privacy & RGPD

- ✅ Hébergement EU (eu.posthog.com)
- ✅ Consentement cookies requis
- ✅ Pas de tracking sans consentement
- ✅ Pas de données sensibles trackées
- ✅ Droit à l'oubli possible dans PostHog

## 💡 Tips

### Dev mode

Les événements sont loggés dans la console au lieu d'être envoyés:
```
[Analytics] squad_created { squad_id: '123' }
```

### Désactiver temporairement

Ne pas définir `VITE_POSTHOG_KEY` dans `.env`.

### Ajouter un événement

1. Ajouter le type dans `UserEvent` (`analytics.ts`)
2. Appeler `trackEvent()` dans le composant
3. Créer le funnel dans PostHog

### Propriétés utiles à tracker

- `squad_id`, `session_id`, `user_id` → Pour drill-down
- `source` → D'où vient l'action (navigation, modal, etc.)
- `duration` → Temps passé
- `error` → Si échec
- `plan`, `price` → Pour premium
- `step` → Pour onboarding

## 🚀 Impact attendu

**Avant analytics**:
- On ne sait pas où les users abandonnent
- On optimise à l'aveugle
- Pas de data pour prioriser

**Après analytics**:
- On voit les points d'abandon clairs
- On priorise les fixes par impact
- On mesure l'effet des changements

**ROI estimé**:
- Setup: 1h
- Amélioration conversion Premium: +10-20% → +X€/mois
- Amélioration rétention Onboarding: +15-30% → +Y users actifs

## 📚 Ressources

- **Code**: `src/utils/analytics.ts`
- **Hook**: `src/hooks/useAnalytics.ts`
- **Docs**: `src/utils/ANALYTICS.md`
- **Setup**: `ANALYTICS-SETUP.md`
- **PostHog Docs**: https://posthog.com/docs
