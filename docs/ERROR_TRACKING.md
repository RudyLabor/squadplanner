# Système de Tracking d'Erreurs

## Vue d'ensemble

Squad Planner utilise un système léger de tracking d'erreurs (~3 KB) qui remplace Sentry (@sentry/browser = 408 KB) tout en offrant les fonctionnalités essentielles :

- ✅ Capture automatique des erreurs globales
- ✅ Capture des rejets de promesses non gérés
- ✅ Capture des appels à `console.error`
- ✅ Breadcrumbs de navigation
- ✅ Contexte utilisateur (ID + username)
- ✅ Tags d'environnement (browser, device, platform, connection)
- ✅ Web Vitals médiocres signalées comme warnings
- ✅ Batch et envoi optimisé vers Supabase Edge Function
- ✅ SSR-safe (tous les APIs browser sont protégés)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Application                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  src/lib/errorTracker.ts                             │ │
│  │  - Capture errors globally                            │ │
│  │  - Buffer errors (max 50, flush every 5s)            │ │
│  │  - Track navigation breadcrumbs                       │ │
│  │  - Collect environment tags                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Supabase Edge Function: error-report                │ │
│  │  POST /functions/v1/error-report                     │ │
│  └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │  Supabase Table: error_reports                       │ │
│  │  - message, stack, url, timestamp                     │ │
│  │  - user_id, username, user_agent                      │ │
│  │  - level, extra, breadcrumbs, tags                    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Configuration

### 1. Variable d'environnement (optionnelle)

Le système fonctionne automatiquement si `VITE_SUPABASE_URL` est défini. Pour utiliser un DSN Sentry externe (si un jour on revient à Sentry), ajouter dans `.env` :

```bash
VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
```

**Note :** Actuellement, le système utilise uniquement Supabase et n'envoie rien à Sentry, même si `VITE_SENTRY_DSN` est défini.

### 2. Base de données

La table `error_reports` doit exister dans Supabase avec ce schéma :

```sql
CREATE TABLE error_reports (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  timestamp TIMESTAMPTZ,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  level TEXT DEFAULT 'error',
  extra JSONB,
  breadcrumbs JSONB,
  tags JSONB
);

CREATE INDEX idx_error_reports_timestamp ON error_reports (timestamp DESC);
CREATE INDEX idx_error_reports_user_id ON error_reports (user_id);
CREATE INDEX idx_error_reports_level ON error_reports (level);
```

### 3. Edge Function

L'edge function `error-report` est déjà déployée. Elle :
- Accepte des batches de max 50 erreurs
- Valide et sanitise les données
- Insert dans la table `error_reports`
- Retourne le nombre d'erreurs reçues

## Initialisation

L'initialisation est **automatique** dans `ClientShell.tsx` quand l'utilisateur est authentifié :

```typescript
import { initErrorTracker, setUser } from './lib/errorTracker'

// Dans ClientShell.tsx
useEffect(() => {
  if (user) {
    initErrorTracker()
    setUser({ id: user.id, username: user.username })
  }
}, [user])
```

## Utilisation manuelle

### Capturer une exception

```typescript
import { captureException } from '@/lib/errorTracker'

try {
  riskyOperation()
} catch (error) {
  captureException(error, {
    component: 'UserProfile',
    action: 'updateAvatar',
  })
}
```

### Capturer un message

```typescript
import { captureMessage } from '@/lib/errorTracker'

// Info
captureMessage('User completed onboarding', 'info')

// Warning
captureMessage('API rate limit approaching', 'warning')

// Error
captureMessage('Critical: Payment gateway unavailable', 'error')
```

### Ajouter un breadcrumb

```typescript
import { addBreadcrumb } from '@/lib/errorTracker'

addBreadcrumb('User clicked upgrade button', 'ui.click', 'info')
addBreadcrumb('Payment form submitted', 'payment', 'info')
```

### Mettre à jour le contexte utilisateur

```typescript
import { setUser } from '@/lib/errorTracker'

// Quand l'utilisateur se connecte
setUser({ id: 'user-123', username: 'john_doe' })

// Quand l'utilisateur se déconnecte
setUser(null)
```

## Captures automatiques

### 1. Erreurs globales

Toutes les erreurs non catchées sont automatiquement capturées :

```javascript
// Ceci sera automatiquement capturé
throw new Error('Something went wrong')
```

### 2. Rejets de promesses

```javascript
// Ceci sera automatiquement capturé
Promise.reject('API call failed')
```

### 3. Console.error

```javascript
// Ceci sera automatiquement capturé
console.error('User action failed', { reason: 'timeout' })
```

### 4. Navigation

Les changements de route sont automatiquement enregistrés comme breadcrumbs :

```
Navigation: /squads → /sessions/123
```

### 5. Web Vitals médiocres

Les Core Web Vitals avec rating "poor" sont automatiquement signalés :

```
Poor Core Web Vital: LCP = 4200ms
```

## ErrorBoundary

Le `RootErrorBoundary` capture automatiquement les erreurs React et les envoie au tracker :

```typescript
// Dans root.tsx
export function ErrorBoundary() {
  const error = useRouteError()

  useEffect(() => {
    if (error instanceof Error) {
      import('./lib/errorTracker').then(({ captureException }) => {
        captureException(error, {
          errorBoundary: 'RootErrorBoundary',
          status: 500,
        })
      })
    }
  }, [error])

  return <ErrorUI />
}
```

## Données capturées

Chaque erreur contient :

```typescript
{
  message: string,           // Message d'erreur
  stack?: string,            // Stack trace
  url: string,               // URL où l'erreur s'est produite
  timestamp: string,         // ISO 8601
  userAgent: string,         // User agent complet
  userId?: string,           // ID utilisateur (si connecté)
  username?: string,         // Username (si connecté)
  level: 'error' | 'warning' | 'info',
  extra?: object,            // Contexte additionnel
  breadcrumbs?: [{           // Historique des actions
    timestamp: string,
    category: string,
    message: string,
    level: string
  }],
  tags?: {                   // Tags d'environnement
    env: 'production' | 'development',
    browser: 'chrome' | 'firefox' | 'safari' | 'edge',
    device: 'mobile' | 'tablet' | 'desktop',
    platform: 'windows' | 'macos' | 'linux' | 'ios' | 'android',
    connection: '4g' | '3g' | 'slow-2g' | ...
  }
}
```

## Erreurs ignorées

Certaines erreurs sont automatiquement filtrées pour éviter le bruit :

- Erreurs réseau (`Failed to fetch`, `NetworkError`, `Load failed`)
- Erreurs d'authentification Supabase (`Auth session missing`, `refresh_token_not_found`)
- Extensions de navigateur (`chrome-extension://`, `moz-extension://`)
- Erreurs ResizeObserver
- Erreurs WebSocket non critiques
- Erreurs AbortError (requêtes annulées)

## Performance

### Bundle size

- **Micro tracker** : ~3 KB gzipped
- **Sentry SDK** : ~408 KB (135x plus gros)

### Network

- **Batch** : Jusqu'à 50 erreurs par requête
- **Flush** : Toutes les 5 secondes ou au unload de la page
- **Keepalive** : Les requêtes ne bloquent pas la navigation

### CPU

- **Async** : Toutes les opérations sont asynchrones
- **No-op en dev** : Le tracker ne s'initialise qu'en production

## Monitoring des erreurs

### Via Supabase Dashboard

```sql
-- Erreurs récentes
SELECT
  created_at,
  level,
  message,
  username,
  tags->>'browser' as browser,
  tags->>'device' as device
FROM error_reports
ORDER BY created_at DESC
LIMIT 50;

-- Top erreurs par message
SELECT
  message,
  COUNT(*) as count,
  MAX(created_at) as last_seen
FROM error_reports
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY message
ORDER BY count DESC;

-- Erreurs par utilisateur
SELECT
  username,
  user_id,
  COUNT(*) as error_count
FROM error_reports
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY username, user_id
ORDER BY error_count DESC;

-- Distribution par browser/device
SELECT
  tags->>'browser' as browser,
  tags->>'device' as device,
  COUNT(*) as count
FROM error_reports
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY browser, device
ORDER BY count DESC;
```

### Alertes

Pour créer des alertes automatiques, utiliser Supabase Webhooks ou créer une fonction cron qui vérifie :

```sql
-- Erreurs critiques récentes
SELECT COUNT(*)
FROM error_reports
WHERE level = 'error'
  AND created_at > NOW() - INTERVAL '1 hour';
```

## Migration depuis Sentry

Le système est **rétro-compatible** avec l'API Sentry :

```typescript
// Ces imports fonctionnent toujours
import {
  initSentry,         // Alias de initErrorTracker
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction    // No-op, mais ne casse pas le code
} from '@/lib/sentry'
```

## Développement

### Mode développement

En mode dev, les erreurs sont loggées dans la console au lieu d'être envoyées :

```
[Error] Something went wrong { component: 'UserProfile' }
```

### Tests

Pour les tests, utiliser `destroyErrorTracker()` pour nettoyer :

```typescript
import { destroyErrorTracker } from '@/lib/errorTracker'

afterEach(() => {
  destroyErrorTracker()
})
```

## Roadmap

- [ ] Dashboard de visualisation des erreurs dans l'admin
- [ ] Groupement automatique des erreurs similaires
- [ ] Source maps pour dé-minifier les stack traces
- [ ] Rate limiting par utilisateur
- [ ] Alertes par email/Slack pour erreurs critiques
- [ ] Intégration avec la metric "Reliability Score"

## Support

Pour toute question sur le système de tracking d'erreurs :
- Voir le code source : `src/lib/errorTracker.ts`
- Edge function : `supabase/functions/error-report/index.ts`
- Cette documentation : `docs/ERROR_TRACKING.md`
