# PLAN - Bundle 500KB + Tests 80%

> **Date** : 10 Fevrier 2026
> **Contexte** : Suite a BIBLEV3 Section 8 (dette technique). Fichiers splittes, fonts fixees, 20 tests ajoutes.
> **Objectifs** : Bundle gzip < 500KB + Hook test coverage >= 80%

---

## ETAT ACTUEL

### Bundle (apres Section 8)

| Chunk | Raw | Gzip | Chargement | Notes |
|-------|-----|------|------------|-------|
| vendor-agora | 1,363 KB | 370 KB | Lazy (dynamic import sur /party) | Agora SDK - le plus gros |
| vendor-sentry | 442 KB | 146 KB | Lazy (post-auth uniquement) | @sentry/react v10.38 |
| vendor-core | 233 KB | 75 KB | Initial | React + Router + Zustand |
| vendor-ui | 199 KB | 64 KB | Initial | framer-motion + lucide + sonner |
| vendor-data | 219 KB | 60 KB | Initial | Supabase + TanStack Query |
| index | 202 KB | 56 KB | Initial | App entry |
| Pages (lazy) | ~500 KB | ~120 KB | Lazy par page | Tous lazy loaded |
| **TOTAL** | **~3,158 KB** | **~891 KB** | | |

**Bundle initial (landing page)** : ~303 KB gzip (deja bon)
**Bundle total** : ~891 KB gzip (objectif 500 KB)

### Tests hooks (apres Section 8)

- **Testes** : 28/45 = 62%
- **Objectif** : 36/45 = 80%
- **Manquent** : 8 tests minimum (on en fera 10 pour marge)

---

## PHASE 1 : TESTS HOOKS → 80% (Rapide, ~1h)

Ecrire 10 tests pour atteindre 84.4% (38/45).

### Hooks a tester (par priorite)

| # | Hook | Taille | Ce qu'il fait | Complexite test |
|---|------|--------|---------------|-----------------|
| 1 | **useAI** | 14.6 KB | Integration IA coach, suggestions | Haute (mock Supabase functions) |
| 2 | **useUnreadCount** | 6.5 KB | Compteur messages non lus | Moyenne (mock Supabase realtime) |
| 3 | **useTypingIndicator** | 5.6 KB | Indicateur "en train d'ecrire" | Moyenne (mock channels) |
| 4 | **useNetworkQuality** | 7.3 KB | Monitoring qualite reseau/appels | Moyenne (mock navigator) |
| 5 | **useSquadNotifications** | 4.1 KB | Notifications squad | Moyenne (mock Supabase) |
| 6 | **useSessionExpiry** | 3.8 KB | Expiration de sessions | Basse (timers) |
| 7 | **useUserStatus** | 3.4 KB | Statut en ligne/absent/invisible | Moyenne (mock presence) |
| 8 | **useRingtone** | 5.2 KB | Son de sonnerie appels | Basse (mock Audio API) |
| 9 | **useNotificationBanner** | 2.0 KB | Banniere de notifications | Basse (state simple) |
| 10 | **usePWAInstall** | 2.5 KB | Prompt installation PWA | Basse (mock beforeinstallprompt) |

### Commande pour verifier apres

```bash
npx vitest run src/hooks/__tests__/ --reporter=verbose
# Objectif : 38 fichiers, tous verts
```

### Hooks restants NON testes (pas critiques pour 80%)

- useAudioAnalyser (4.2 KB) - analyse audio WebRTC
- useDelayedLoading (1.1 KB) - loading delayed
- useFocusTrap (52 bytes) - stub vide
- useHashNavigation (1.4 KB) - navigation hash
- useInfiniteScroll (1.8 KB) - scroll infini
- useNavigationProgress (1.8 KB) - barre de progression
- useParticipantVolumes (3.4 KB) - volumes participants
- useSoundEffects (3.2 KB) - effets sonores

---

## PHASE 2 : MIGRATION SENTRY MODULAIRE (-60 a 100 KB gzip)

### Probleme
@sentry/react v10.38 = 442 KB raw / 146 KB gzip. On importe le bundle complet alors qu'on utilise peu de features.

### Solution
Passer au SDK modulaire Sentry (disponible depuis v8) :

```typescript
// AVANT (src/lib/sentry.ts) - charge tout
const Sentry = await import('@sentry/react')
Sentry.init({ ... })

// APRES - charge uniquement ce qu'on utilise
import { init, browserTracingIntegration, replayIntegration } from '@sentry/browser'
// OU en dynamic import modulaire :
const { init, browserTracingIntegration } = await import('@sentry/browser')
```

### Actions

| # | Action | Fichiers | Impact |
|---|--------|----------|--------|
| 2.1 | Remplacer `@sentry/react` par `@sentry/browser` dans package.json | package.json | -20-40 KB gzip (pas de hooks React) |
| 2.2 | Mettre a jour src/lib/sentry.ts pour importer depuis @sentry/browser | src/lib/sentry.ts | |
| 2.3 | Supprimer les imports Sentry.ErrorBoundary si utilises (remplacer par notre ErrorBoundary) | Verifier App.tsx, ErrorBoundary.tsx | |
| 2.4 | N'importer que les integrations necessaires (browserTracing, pas replay si inutile) | src/lib/sentry.ts | -20-30 KB gzip |
| 2.5 | Verifier que captureException/captureMessage fonctionnent encore | Tester en dev | |

### Verification

```bash
npm uninstall @sentry/react && npm install @sentry/browser
npx vite build 2>&1 | grep sentry
# Objectif : vendor-sentry < 300 KB raw / < 80 KB gzip
```

---

## PHASE 3 : FRAMER-MOTION → MOTION/MINI (-35 a 45 KB gzip)

### Probleme
framer-motion = ~40 KB gzip dans vendor-ui. Utilise dans 156 fichiers mais la plupart n'ont besoin que de `motion` et `AnimatePresence`.

### Solution
framer-motion v12 propose `motion/mini` (aussi appele `m` from `framer-motion/m`) qui est ~5KB au lieu de ~40KB.

### Actions

| # | Action | Impact |
|---|--------|--------|
| 3.1 | Auditer les usages de framer-motion : quels composants utilisent LayoutGroup, useMotionValue, useTransform, useScroll ? | Diagnostic |
| 3.2 | Pour les composants simples (fade, slide, scale) : migrer vers motion/mini ou CSS animations natives | -25 KB gzip |
| 3.3 | Garder framer-motion complet UNIQUEMENT pour les composants qui utilisent LayoutGroup, layout animations, complex gestures | |
| 3.4 | Creer un barrel export `src/lib/motion.ts` qui re-exporte depuis le bon package | Centralisation |
| 3.5 | Mettre a jour les 156 fichiers pour importer depuis le barrel | Consistance |

### Alternative plus radicale
Remplacer completement framer-motion par des CSS animations Tailwind + un helper minimal :

```typescript
// src/lib/animations.ts
export const fadeIn = 'animate-in fade-in duration-200'
export const slideUp = 'animate-in slide-in-from-bottom-4 duration-300'
```

Impact : -40 KB gzip mais GROS effort de migration (156 fichiers).

### Verification

```bash
npx vite build 2>&1 | grep vendor-ui
# Objectif : vendor-ui < 130 KB raw / < 30 KB gzip
```

---

## PHASE 4 : OPTIMISATIONS LEGERES (-15 a 30 KB gzip)

### 4.1 Lucide-React tree-shaking
Les imports sont deja corrects (named imports) mais verifier :
```bash
# Compter les icones uniques utilisees
grep -roh "import { [A-Z][a-zA-Z]*" src/ --include="*.tsx" | grep "from 'lucide-react'" | sort -u | wc -l
```
Si trop d'icones, considerer `@lucide/react` v2 qui est plus leger.

### 4.2 Supabase tree-shaking
Verifier si on importe des modules Supabase inutiles :
- `@supabase/supabase-js` inclut realtime, storage, auth, functions
- Si on n'utilise pas storage, on peut l'exclure

### 4.3 Compression Brotli
Verifier que Vercel sert bien en Brotli (pas juste gzip) :
```bash
curl -s -H "Accept-Encoding: br" https://squadplanner.fr -o /dev/null -w "%{size_download}"
```
Brotli donne 15-20% de mieux que gzip.

### 4.4 Sonner
sonner (toast library) est dans vendor-ui. Si elle est lourde, considerer une alternative plus legere ou notre propre composant Toast.

---

## PHASE 5 : AUDIT AGORA SDK (-50 a 100 KB gzip, RECHERCHE)

### Probleme
agora-rtc-sdk-ng = 1,363 KB raw / 370 KB gzip. C'est de loin le plus gros chunk.

### Pistes

| Piste | Description | Faisabilite |
|-------|-------------|-------------|
| agora-rtc-sdk-ng/esm | Version ESM modulaire si disponible | A verifier |
| @aspect/agora-web-sdk | Fork plus leger ? | A rechercher |
| LiveKit | Alternative open-source a Agora, SDK plus leger | Migration lourde |
| WebRTC natif | Implementer P2P sans SDK | Tres complexe |
| Charger Agora depuis CDN | `<script>` externe, pas dans le bundle | -370 KB gzip mais latence |

### Action recommandee
1. Verifier si Agora propose un build modulaire (audio-only, sans video)
2. Tester le chargement depuis CDN comme fallback
3. Si rien ne marche, accepter que Agora reste gros mais est deja lazy-loaded

---

## ESTIMATION FINALE

| Phase | Impact gzip | Effort | Priorite |
|-------|-------------|--------|----------|
| Phase 1 : Tests 80% | 0 KB (pas de bundle) | 1-2h | **P0** |
| Phase 2 : Sentry modulaire | -60 a 100 KB | 2-3h | **P1** |
| Phase 3 : motion/mini | -35 a 45 KB | 4-6h | **P2** |
| Phase 4 : Optimisations legeres | -15 a 30 KB | 1-2h | **P1** |
| Phase 5 : Agora audit | -50 a 100 KB (incertain) | Recherche | **P3** |

### Projections

| Scenario | Bundle gzip | Tests |
|----------|-------------|-------|
| **Actuel** | 891 KB | 62% (28/45) |
| **Phase 1** | 891 KB | **84%** (38/45) |
| **Phase 1+2** | ~791-831 KB | 84% |
| **Phase 1+2+3** | ~746-796 KB | 84% |
| **Phase 1+2+3+4** | ~716-781 KB | 84% |
| **Phase 1+2+3+4+5** | ~616-731 KB | 84% |
| **Optimiste (tout reussi)** | **~550 KB** | **84%** |

### Realite honnete
Atteindre exactement 500 KB gzip total est EXTREMEMENT ambitieux avec Agora SDK (370 KB a lui seul). Le bundle initial (landing) est deja a ~303 KB gzip, ce qui est excellent. Les chunks lazy (Agora, Sentry) ne chargent que quand necessaire.

**Recommandation** : Viser 600-650 KB gzip total en faisant Phases 1-4, et considerer le chargement CDN d'Agora (Phase 5) si on veut vraiment descendre sous 500 KB.

---

## COMMANDES UTILES

```bash
# Build et voir les tailles
npx vite build 2>&1 | grep -E "(assets/|built in)"

# Analyser le bundle visuellement
npx vite-bundle-visualizer

# Lancer les tests hooks
npx vitest run src/hooks/__tests__/

# Compter les fichiers > 300 lignes
find src -name "*.tsx" -exec wc -l {} + | sort -rn | awk '$1 > 300 {print}'

# Verifier zero text-[Xpx]
grep -r "text-\[[0-9]*px\]" src/ --include="*.tsx"
```

---

> Ce plan est HONNETE sur les limites. Le 500KB total gzip est un objectif tres agressif
> a cause de l'Agora SDK. Mais le bundle initial est deja excellent a ~303KB.
> L'objectif 80% tests est facilement atteignable avec 10 tests supplementaires.
