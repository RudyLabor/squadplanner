# Analytics Tracking avec PostHog

Infrastructure légère de suivi analytics pour comprendre les parcours utilisateurs et identifier les points d'abandon.

## Architecture

- **Lightweight**: Approche fetch-based (~3KB), pas de SDK lourd
- **Batching**: Les événements sont mis en file d'attente et envoyés par lots toutes les 5 secondes
- **Privacy-first**: Respecte le consentement cookies (RGPD)
- **Graceful degradation**: Fonctionne même si PostHog n'est pas configuré
- **No-op in dev**: Les événements sont loggés dans la console en dev, envoyés en production

## Configuration

### 1. Créer un compte PostHog (Free Tier)

1. Aller sur https://eu.posthog.com (région EU pour conformité RGPD)
2. Créer un compte et un projet
3. Copier la clé API du projet (Project Settings)

### 2. Configurer les variables d'environnement

```bash
# .env.local
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Optionnel: hôte personnalisé (par défaut: https://eu.i.posthog.com)
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

### 3. Déployer en production

```bash
# Vercel
vercel env add VITE_POSTHOG_KEY
# Entrer la clé API PostHog

# Ou ajouter dans le dashboard Vercel:
# Settings > Environment Variables > Add
```

## Utilisation

### Tracking d'événements

```typescript
import { trackEvent } from '@/utils/analytics'

// Événement simple
trackEvent('squad_created')

// Événement avec propriétés
trackEvent('squad_created', {
  squad_id: '123',
  game: 'valorant',
  members_count: 5
})

// Premium funnel
trackEvent('premium_viewed', { source: 'settings' })
trackEvent('premium_checkout_started', { plan: 'yearly' })
trackEvent('premium_subscribed', { plan: 'yearly', price: 49.99 })
```

### Événements disponibles

**Squad & Session**
- `squad_created`, `squad_joined`, `squad_left`
- `session_created`, `session_viewed`, `session_joined`, `session_left`

**RSVP Funnel**
- `rsvp_viewed`, `rsvp_submitted`, `rsvp_changed`

**Premium Conversion Funnel**
- `premium_viewed`, `premium_checkout_started`, `premium_subscribed`, `premium_cancelled`

**Onboarding Funnel**
- `onboarding_started`, `onboarding_step_completed`, `onboarding_skipped`, `onboarding_finished`

**Social Actions**
- `invite_sent`, `message_sent`, `voice_call_started`, `voice_call_ended`

**Engagement**
- `command_palette_opened`, `search_performed`, `notification_clicked`

### Page Views (automatique)

Les page views sont trackées automatiquement dans `ClientShell.tsx` à chaque changement de route.

```typescript
// Pas besoin d'appeler manuellement, c'est automatique
// trackPageView('/squads/123')
```

### Identification utilisateur (automatique)

L'identification est faite automatiquement dans `ClientShell.tsx` quand l'utilisateur se connecte.

```typescript
// Automatique lors de l'authentification
identifyUser(user.id, {
  username: user.username,
  email: user.email,
  premium: user.premium,
  created_at: user.created_at,
})
```

## Exemples d'intégration

### Dans un composant de création de squad

```typescript
import { trackEvent } from '@/utils/analytics'

async function handleCreateSquad(data: SquadData) {
  const squad = await createSquad(data)

  // Track l'événement
  trackEvent('squad_created', {
    squad_id: squad.id,
    game: data.game,
    is_public: data.is_public,
  })

  navigate(`/squads/${squad.id}`)
}
```

### Dans le funnel Premium

```typescript
// Page Premium
useEffect(() => {
  trackEvent('premium_viewed', { source: 'navigation' })
}, [])

// Click sur "S'abonner"
function handleSubscribe(plan: 'monthly' | 'yearly') {
  trackEvent('premium_checkout_started', {
    plan,
    price: plan === 'yearly' ? 49.99 : 4.99
  })

  // Redirection vers Stripe...
}

// Après succès du paiement
function handlePaymentSuccess(plan: string) {
  trackEvent('premium_subscribed', {
    plan,
    conversion_time: Date.now() - startTime
  })
}
```

### Dans le tour d'onboarding

```typescript
import { trackEvent } from '@/utils/analytics'

function TourGuide() {
  useEffect(() => {
    trackEvent('onboarding_started')
  }, [])

  function handleStepComplete(step: number) {
    trackEvent('onboarding_step_completed', { step })
  }

  function handleSkip() {
    trackEvent('onboarding_skipped', { last_step: currentStep })
  }

  function handleFinish() {
    trackEvent('onboarding_finished', { duration: completionTime })
  }
}
```

## Analytics dans PostHog

### Créer des funnels

1. Aller dans PostHog > Insights > New Insight
2. Choisir "Funnel"
3. Configurer les étapes:

**Exemple: RSVP Funnel**
```
1. rsvp_viewed
2. rsvp_submitted
```

**Exemple: Premium Conversion Funnel**
```
1. premium_viewed
2. premium_checkout_started
3. premium_subscribed
```

**Exemple: Onboarding Funnel**
```
1. onboarding_started
2. onboarding_step_completed (step=1)
3. onboarding_step_completed (step=2)
4. onboarding_step_completed (step=3)
5. onboarding_finished
```

### Analyser les abandons

1. Dans le funnel, cliquer sur le taux de conversion entre deux étapes
2. PostHog montre:
   - Taux de conversion
   - Temps moyen entre les étapes
   - Utilisateurs qui ont abandonné (avec replay si activé)

### Dashboards recommandés

**Overview Dashboard**
- Total users (unique)
- Active users (DAU/MAU)
- Top events
- Page views

**Conversion Dashboard**
- Premium funnel
- RSVP funnel
- Onboarding funnel

**Engagement Dashboard**
- Sessions created per user
- Messages sent
- Voice calls started
- Retention cohorts

## Performance

### Overhead
- Taille: ~3KB (fetch-based, pas de SDK)
- Impact: Minimal, les événements sont batchés et envoyés en arrière-plan
- Network: 1 requête toutes les 5 secondes max (ou 20 événements)

### Optimisations
- Lazy load: `import('./utils/analytics')` uniquement quand nécessaire
- Batching: Les événements sont groupés
- sendBeacon: Utilise `navigator.sendBeacon` pour une livraison fiable
- No blocking: Erreurs catchées silencieusement

## Conformité RGPD

- ✅ Consentement cookies requis (via `CookieConsent.tsx`)
- ✅ Hébergement EU (PostHog EU: `eu.i.posthog.com`)
- ✅ Anonymisation possible (désactiver `identifyUser`)
- ✅ Droit à l'oubli (supprimer les données dans PostHog)
- ✅ Transparence (docs dans Privacy Policy)

## Debugging

### En développement

Les événements sont loggés dans la console au lieu d'être envoyés:

```
[Analytics] squad_created { squad_id: '123', game: 'valorant' }
[Analytics] Page view: /squads/123
[Analytics] User identified: user-123 { username: 'john', premium: true }
```

### En production

Vérifier dans PostHog > Live Events pour voir les événements en temps réel.

### Désactiver temporairement

```typescript
// Dans analytics.ts, mettre:
const POSTHOG_API_KEY = undefined // Force disable
```

Ou ne pas définir `VITE_POSTHOG_KEY` dans `.env`.

## Migration depuis trackEvent.ts

L'ancien système `trackEvent.ts` (data-track attributes) est maintenant intégré avec PostHog:

```html
<!-- Ancien système: toujours fonctionnel -->
<button data-track="squad_created">Créer</button>

<!-- Nouveau système: plus de contrôle -->
<button onClick={() => trackEvent('squad_created', { game: 'valorant' })}>
  Créer
</button>
```

Les deux systèmes coexistent et envoient à PostHog.
