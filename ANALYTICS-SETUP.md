# Analytics Setup Guide - PostHog (Free Tier)

Guide de configuration rapide pour le tracking analytics avec PostHog.

## Pourquoi PostHog?

- **Free tier généreux**: 1M événements/mois gratuits
- **RGPD compliant**: Hébergement EU disponible
- **Open source**: Pas de vendor lock-in
- **Fonctionnalités avancées**:
  - Funnels pour analyser les abandons
  - Session replay (optionnel)
  - Feature flags
  - A/B testing
  - Heatmaps

## 1. Créer un compte PostHog

### Option 1: Cloud EU (Recommandé pour RGPD)

1. Aller sur **https://eu.posthog.com**
2. Créer un compte avec email
3. Créer un projet "Squad Planner"
4. Choisir la région **EU** pour conformité RGPD

### Option 2: Self-hosted (Pour contrôle total)

Si vous préférez héberger PostHog vous-même:
```bash
# Docker Compose
git clone https://github.com/PostHog/posthog
cd posthog
docker-compose up -d
```

## 2. Récupérer la clé API

1. Dans PostHog, aller dans **Project Settings**
2. Copier le **Project API Key** (format: `phc_xxxxx...`)
3. Note: Il existe 2 types de clés:
   - **Project API Key** (publique, pour le client) ✅ Celle-ci
   - **Personal API Key** (privée, pour les scripts) ❌ Pas celle-ci

## 3. Configurer les variables d'environnement

### Développement local

Créer un fichier `.env.local` (non commité):

```bash
# .env.local
VITE_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

### Production (Vercel)

```bash
# Via CLI
vercel env add VITE_POSTHOG_KEY
# Coller la clé API PostHog

vercel env add VITE_POSTHOG_HOST
# Entrer: https://eu.i.posthog.com
```

Ou via le dashboard Vercel:
1. Aller dans **Settings > Environment Variables**
2. Ajouter:
   - `VITE_POSTHOG_KEY` = `phc_xxxxx...`
   - `VITE_POSTHOG_HOST` = `https://eu.i.posthog.com`
3. Sélectionner **Production, Preview, Development**

### Production (Autre plateforme)

**Netlify**:
```bash
netlify env:set VITE_POSTHOG_KEY phc_xxxxx...
netlify env:set VITE_POSTHOG_HOST https://eu.i.posthog.com
```

**Railway**:
```bash
railway variables set VITE_POSTHOG_KEY=phc_xxxxx...
railway variables set VITE_POSTHOG_HOST=https://eu.i.posthog.com
```

## 4. Vérifier l'installation

### En développement

1. Lancer l'app: `npm run dev`
2. Ouvrir la console DevTools
3. Naviguer sur une page
4. Vous devriez voir:
   ```
   [Analytics] PostHog initialized: { host: 'https://eu.i.posthog.com', consent: '❌ Not granted' }
   ```

5. Accepter les cookies analytics dans le banner
6. Naviguer sur une autre page
7. Vous devriez voir:
   ```
   [Analytics] Page view: /squads
   ```

### En production

1. Déployer l'app avec les variables d'env configurées
2. Dans PostHog, aller dans **Live Events**
3. Naviguer sur votre app en production
4. Les événements devraient apparaître en temps réel dans PostHog

**Latence**: Les événements peuvent prendre 5-30 secondes pour apparaître (batching).

## 5. Créer des funnels

### Funnel Premium (exemple)

1. Dans PostHog, aller dans **Insights > New Insight**
2. Choisir **Funnel**
3. Ajouter les étapes:
   - Étape 1: `premium_viewed`
   - Étape 2: `premium_checkout_started`
   - Étape 3: `premium_subscribed`
4. Sauvegarder le funnel
5. Analyser:
   - Taux de conversion global
   - Temps moyen entre chaque étape
   - Où les utilisateurs abandonnent

### Funnel RSVP (exemple)

```
1. session_viewed
2. rsvp_viewed
3. rsvp_submitted
```

### Funnel Onboarding (exemple)

```
1. onboarding_started
2. onboarding_step_completed (step=1)
3. onboarding_step_completed (step=2)
4. onboarding_step_completed (step=3)
5. onboarding_finished
```

## 6. Ajouter du tracking dans le code

### Exemple: Squad creation

```typescript
// src/components/CreateSquadModal.tsx
import { useAnalytics } from '@/hooks'

export function CreateSquadModal() {
  const analytics = useAnalytics()

  async function handleCreate(data: SquadData) {
    const squad = await createSquad(data)

    // Track l'événement
    analytics.track('squad_created', {
      squad_id: squad.id,
      game: data.game,
      is_public: data.is_public,
      members_count: 1
    })

    navigate(`/squads/${squad.id}`)
  }
}
```

### Exemple: RSVP flow

```typescript
// src/pages/SessionDetail.tsx
import { useEffect } from 'react'
import { useAnalytics } from '@/hooks'

export function SessionDetail() {
  const analytics = useAnalytics()

  // Track page view
  useEffect(() => {
    analytics.track('session_viewed', { session_id: sessionId })
  }, [])

  function handleRSVP(status: 'yes' | 'no' | 'maybe') {
    analytics.track('rsvp_submitted', {
      session_id: sessionId,
      status
    })

    submitRSVP(status)
  }
}
```

## 7. Dashboards recommandés

### Dashboard "Overview"

- **Total Users**: Unique users
- **Daily Active Users**: Tendance sur 30 jours
- **Top Events**: Events les plus fréquents
- **Page Views**: Pages les plus visitées

### Dashboard "Conversion"

- **Premium Funnel**: 3 étapes (viewed → checkout → subscribed)
- **RSVP Funnel**: 2 étapes (viewed → submitted)
- **Onboarding Funnel**: 5 étapes (started → finished)

### Dashboard "Engagement"

- **Sessions per User**: Moyenne
- **Messages Sent**: Tendance
- **Voice Calls**: Durée moyenne
- **Retention Cohorts**: Taux de rétention J1, J7, J30

### Dashboard "Funnels Analysis"

- **Where users drop**: Analyse des abandons
- **Time to convert**: Temps moyen entre étapes
- **Conversion rate trends**: Évolution dans le temps

## 8. Alertes (optionnel)

Configurer des alertes dans PostHog pour être notifié:

1. Aller dans **Alerts**
2. Créer une alerte:
   - "Premium conversion < 5%" → Email
   - "RSVP completion > 80%" → Slack
   - "Onboarding completion < 30%" → Email

## 9. Session Replay (optionnel)

⚠️ **Privacy warning**: Les session replays enregistrent l'écran de l'utilisateur.

1. Dans PostHog, activer **Session Replay**
2. Configurer les exclusions (champs sensibles):
   - Inputs password
   - Champs email
   - Numéros de carte bancaire
3. Ajouter `data-ph-no-capture` aux éléments sensibles:
   ```html
   <input type="password" data-ph-no-capture />
   ```

## 10. Conformité RGPD

### Checklist

- ✅ **Hébergement EU**: Utiliser `eu.posthog.com`
- ✅ **Consentement cookies**: Implémenté via `CookieConsent.tsx`
- ✅ **Droit à l'oubli**: Possible dans PostHog > Person > Delete
- ✅ **Transparence**: Documenter dans Privacy Policy
- ✅ **Pas de données sensibles**: Ne pas tracker email/password
- ✅ **Anonymisation**: Désactiver `identifyUser()` si nécessaire

### Privacy Policy à ajouter

Ajouter cette section dans `src/pages/legal/PrivacyContent.tsx`:

```markdown
## Analytics et cookies

Nous utilisons PostHog (hébergé en Europe) pour analyser l'utilisation de l'application et améliorer votre expérience. Les données collectées incluent:

- Pages visitées
- Actions effectuées (création de squad, envoi de messages, etc.)
- Informations techniques (navigateur, OS, résolution d'écran)

Ces données sont anonymisées et **ne sont jamais vendues à des tiers**.

Vous pouvez refuser les cookies analytics dans le banner de consentement sans impact sur les fonctionnalités de l'application.

Pour exercer votre droit à l'oubli ou obtenir une copie de vos données, contactez-nous à contact@squadplanner.fr.
```

## 11. Troubleshooting

### Les événements n'apparaissent pas

1. Vérifier que `VITE_POSTHOG_KEY` est défini:
   ```bash
   echo $VITE_POSTHOG_KEY
   ```

2. Vérifier le consentement cookies:
   ```javascript
   localStorage.getItem('sq-cookie-consent') // Doit être 'accepted'
   ```

3. Vérifier les logs console (dev):
   ```
   [Analytics] PostHog initialized: ...
   [Analytics] Page view: ...
   ```

4. Vérifier les requêtes réseau:
   - Ouvrir DevTools > Network
   - Filtrer par `posthog`
   - Vérifier les requêtes POST vers `/capture/`

### Erreur CORS

Si vous avez une erreur CORS en dev:

```bash
# Utiliser le proxy Vite
# vite.config.ts
export default {
  server: {
    proxy: {
      '/posthog': {
        target: 'https://eu.i.posthog.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/posthog/, '')
      }
    }
  }
}
```

Puis changer dans analytics.ts:
```typescript
const POSTHOG_HOST = import.meta.env.DEV
  ? '/posthog'
  : 'https://eu.i.posthog.com'
```

### Performance impact

Si vous constatez un impact performance:

1. Réduire `FLUSH_INTERVAL` (actuellement 5s)
2. Réduire `MAX_BUFFER_SIZE` (actuellement 20 événements)
3. Désactiver temporairement avec:
   ```bash
   # .env.local
   VITE_POSTHOG_KEY=  # Vide = désactivé
   ```

## Ressources

- **PostHog Docs**: https://posthog.com/docs
- **Funnels Guide**: https://posthog.com/docs/user-guides/funnels
- **Session Replay**: https://posthog.com/docs/session-replay
- **RGPD Compliance**: https://posthog.com/docs/privacy/gdpr-compliance
- **API Reference**: https://posthog.com/docs/api

## Support

Questions? Contactez:
- PostHog Support: support@posthog.com
- Squad Planner: contact@squadplanner.fr
