# PLAN DE GUERRE PERFORMANCE - Squad Planner 2026

> Objectif : Transformer Squad Planner en machine de guerre.
> Pas de compromis. Pas de raccourcis. Le meilleur de 2026.

---

## DIAGNOSTIC ACTUEL

### Bundle JS (build actuel)

| Chunk | Brut | Gzip | % total |
|-------|------|------|---------|
| **vendor-agora** | **1,364 KB** | **370 KB** | **47%** |
| **vendor-sentry** | **417 KB** | **138 KB** | **14%** |
| vendor-react | 233 KB | 75 KB | 8% |
| index (app shell) | 178 KB | 49 KB | 6% |
| vendor-supabase | 170 KB | 45 KB | 6% |
| vendor-motion | 137 KB | 46 KB | 5% |
| Messages.js | 94 KB | 26 KB | 3% |
| Landing.js | 72 KB | 18 KB | 2% |
| vendor-query | 50 KB | 15 KB | 2% |
| vendor-ui | 46 KB | 14 KB | 2% |
| Autres pages | ~140 KB | ~40 KB | 5% |
| **TOTAL JS** | **~2,900 KB** | **~870 KB** | **100%** |
| CSS | 173 KB | 25 KB | - |

### Metriques actuelles estimees

| Metrique | Valeur actuelle | Cible |
|----------|----------------|-------|
| LCP | ~1.5s | < 0.5s |
| FCP | ~1.0s | < 0.2s |
| TTI | ~2.5s | < 1.0s |
| Bundle initial (gzip) | ~870 KB | < 150 KB |
| Bundle total (gzip) | ~870 KB | < 300 KB |
| Lighthouse Performance | ~60-70 | 95+ |

---

## PHASE 1 : QUICK WINS SANS MIGRATION (2-3 jours)

> Impact : -175 KB gzip initial, -30% re-renders, navigation predictive

### 1.1 LazyMotion (Framer Motion)

**Pourquoi** : framer-motion charge 137 KB / 46 KB gzip au demarrage. Avec LazyMotion, seulement 4.6 KB au demarrage, le reste charge en async.

**Fichiers a modifier** :
- `src/App.tsx` - Wrapper LazyMotion au root
- **Tous les fichiers** qui importent `motion` -> remplacer par `m`

**Comment** :
```tsx
// src/App.tsx
import { LazyMotion, domAnimation } from 'framer-motion'

function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      {/* ... tout le reste de l'app */}
    </LazyMotion>
  )
}
```

```tsx
// AVANT (chaque composant)
import { motion } from 'framer-motion'
<motion.div animate={{ opacity: 1 }} />

// APRES
import { m } from 'framer-motion'
<m.div animate={{ opacity: 1 }} />
```

**Si on veut les features avancees (layout animations, AnimatePresence)** :
```tsx
// src/App.tsx
import { LazyMotion } from 'framer-motion'

// Charge domMax en async (inclut layout, AnimatePresence, etc.)
const loadFeatures = () => import('framer-motion').then(mod => mod.domMax)

function App() {
  return (
    <LazyMotion features={loadFeatures}>
      {/* ... */}
    </LazyMotion>
  )
}
```

**Gain** : -130 KB brut / -42 KB gzip sur le chargement initial
**Effort** : 0.5 jour (renommage global motion -> m + wrapper)

---

### 1.2 Sentry Lazy Loading

**Pourquoi** : Sentry = 417 KB / 138 KB gzip. Charge au boot alors qu'on n'en a besoin qu'apres que la page soit interactive.

**Fichier a modifier** : Le fichier qui initialise Sentry (probablement `src/lib/sentry.ts` ou `src/App.tsx`)

**Comment** :
```tsx
// src/lib/sentry.ts - NOUVEAU

let sentryLoaded = false

export async function initSentry() {
  if (sentryLoaded) return
  sentryLoaded = true

  const Sentry = await import('@sentry/browser')
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  })
}

// Capturer les erreurs meme avant que Sentry charge
window.addEventListener('error', (event) => {
  if (!sentryLoaded) {
    // Buffer les erreurs, Sentry les capturera au chargement
    console.error('[Pre-Sentry Error]', event.error)
  }
})
```

```tsx
// src/App.tsx
import { initSentry } from './lib/sentry'

useEffect(() => {
  // Charger Sentry apres 3 secondes OU apres la premiere interaction
  const timer = setTimeout(initSentry, 3000)
  const handler = () => { initSentry(); cleanup() }
  const cleanup = () => {
    clearTimeout(timer)
    window.removeEventListener('click', handler)
    window.removeEventListener('keydown', handler)
  }
  window.addEventListener('click', handler, { once: true })
  window.addEventListener('keydown', handler, { once: true })
  return cleanup
}, [])
```

**Gain** : -417 KB brut / -138 KB gzip sur le chargement initial (charge apres)
**Effort** : 0.5 jour

---

### 1.3 React Compiler (auto-memoization)

**Pourquoi** : React 19 inclut le React Compiler qui elimine automatiquement les re-renders inutiles. Plus besoin de useMemo/useCallback manuels.

**Installation** :
```bash
npm install babel-plugin-react-compiler
```

**Configuration** :
```ts
// vite.config.ts
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}]
        ]
      }
    }),
  ],
})
```

**Gain** : 0 KB bundle, mais -20 a -40% de re-renders inutiles
**Effort** : 1 heure

---

### 1.4 Speculation Rules API (prefetch predictif)

**Pourquoi** : Le navigateur pre-rend les pages probables. Navigation instantanee, 0 JS a ecrire.

**Fichier** : `public/index.html` ou `index.html`

```html
<script type="speculationrules">
{
  "prerender": [
    {
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "href_matches": "/auth*" } },
          { "not": { "href_matches": "/api/*" } }
        ]
      },
      "eagerness": "moderate"
    }
  ],
  "prefetch": [
    {
      "where": {
        "and": [
          { "href_matches": "/*" },
          { "not": { "selector_matches": "[data-no-prefetch]" } }
        ]
      },
      "eagerness": "moderate"
    }
  ]
}
</script>
```

**Gain** : Navigation entre pages quasi-instantanee (< 50ms)
**Effort** : 30 minutes

---

### 1.5 View Transitions API (transitions CSS natives)

**Pourquoi** : Remplacer les transitions de route Framer Motion (JS) par des transitions CSS natives du navigateur. 0 JS.

**Fichier** : `src/AppRoutes.tsx`

```tsx
// React Router 7 supporte nativement viewTransition
<NavLink to="/home" viewTransition>Accueil</NavLink>
```

```css
/* src/index.css */
@view-transition {
  navigation: auto;
}

::view-transition-old(root) {
  animation: fade-out 150ms ease-out;
}

::view-transition-new(root) {
  animation: fade-in 150ms ease-in;
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

**Gain** : -50 KB de JS d'animation de transition, transitions plus fluides (GPU-accelerated)
**Effort** : 1 jour

---

### Bilan Phase 1

| Avant Phase 1 | Apres Phase 1 |
|---------------|---------------|
| 870 KB gzip initial | **~650 KB gzip initial** |
| Sentry bloque le rendu | Sentry charge apres |
| Re-renders inutiles | Auto-memoization |
| Transitions JS | Transitions CSS natives |
| Navigation normale | Navigation pre-rendue |

---

## PHASE 2 : AGORA -> LIVEKIT (-1,250 KB)

> Le changement le plus impactant de tout le plan. A lui seul, il divise le bundle par 2.

### 2.1 Pourquoi LiveKit

| | Agora SDK | LiveKit |
|---|---|---|
| Bundle client | 1,364 KB (370 KB gzip) | ~80-120 KB (~30 KB gzip) |
| Open source | Non | Oui (Apache 2.0) |
| Self-host | Non | Oui, gratuit |
| Cout | 0.99$/1000 min | Gratuit (self-host) ou cloud |
| Audio quality | Excellente | Excellente (Opus codec) |
| Video support | Oui | Oui (WebRTC natif) |
| React SDK | Basique | `@livekit/components-react` complet |
| AI Agents | Non | Oui (voix IA integree) |

### 2.2 Installation

```bash
# Supprimer Agora
npm uninstall agora-rtc-sdk-ng

# Installer LiveKit
npm install livekit-client @livekit/components-react
```

### 2.3 Backend : Token Server

Creer une Supabase Edge Function pour generer les tokens LiveKit :

```ts
// supabase/functions/livekit-token/index.ts
import { AccessToken } from 'livekit-server-sdk'

Deno.serve(async (req) => {
  const { roomName, participantName, participantId } = await req.json()

  const token = new AccessToken(
    Deno.env.get('LIVEKIT_API_KEY')!,
    Deno.env.get('LIVEKIT_API_SECRET')!,
    {
      identity: participantId,
      name: participantName,
    }
  )

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  })

  return new Response(JSON.stringify({ token: await token.toJwt() }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 2.4 Frontend : Remplacer VoiceChat

**Fichiers a modifier** :
- `src/components/VoiceChat.tsx` - Composant principal
- `src/hooks/useVoiceChatStore.ts` - Store Zustand
- `src/pages/Party.tsx` - Page Party
- `src/components/call/CallControls.tsx` - Controles
- `src/components/call/CallAvatar.tsx` - Avatars participants
- `src/components/NetworkQualityIndicator.tsx` - Qualite reseau

**Nouveau VoiceChat avec LiveKit** :
```tsx
// src/components/VoiceChat.tsx
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  useTracks,
  AudioTrack,
  TrackToggle,
  DisconnectButton,
  ConnectionState,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

interface VoiceChatProps {
  roomName: string
  token: string
  serverUrl: string
  onDisconnect?: () => void
}

export function VoiceChat({ roomName, token, serverUrl, onDisconnect }: VoiceChatProps) {
  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token}
      connect={true}
      audio={true}
      video={false}
      onDisconnected={onDisconnect}
    >
      <VoiceChatUI />
    </LiveKitRoom>
  )
}

function VoiceChatUI() {
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const audioTracks = useTracks([Track.Source.Microphone])

  return (
    <div className="flex flex-col gap-4">
      {/* Participants */}
      <div className="flex flex-wrap gap-2">
        {participants.map(p => (
          <ParticipantBubble key={p.sid} participant={p} />
        ))}
      </div>

      {/* Audio rendering (invisible) */}
      {audioTracks
        .filter(t => t.participant.sid !== localParticipant?.sid)
        .map(t => (
          <AudioTrack key={t.participant.sid} trackRef={t} />
        ))}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <TrackToggle source={Track.Source.Microphone} />
        <ConnectionState />
        <DisconnectButton>Quitter</DisconnectButton>
      </div>
    </div>
  )
}
```

### 2.5 Store Zustand (simplifie)

```ts
// src/hooks/useVoiceChatStore.ts
import { create } from 'zustand'

interface VoiceChatState {
  isConnected: boolean
  isConnecting: boolean
  currentRoom: string | null
  token: string | null

  // Actions
  fetchToken: (roomName: string, userId: string, username: string) => Promise<string>
  setConnected: (room: string | null) => void
  disconnect: () => void
}

export const useVoiceChatStore = create<VoiceChatState>((set) => ({
  isConnected: false,
  isConnecting: false,
  currentRoom: null,
  token: null,

  fetchToken: async (roomName, userId, username) => {
    set({ isConnecting: true })
    const res = await fetch('/api/livekit-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, participantId: userId, participantName: username }),
    })
    const { token } = await res.json()
    set({ token, isConnecting: false })
    return token
  },

  setConnected: (room) => set({ isConnected: !!room, currentRoom: room }),
  disconnect: () => set({ isConnected: false, currentRoom: null, token: null }),
}))
```

### 2.6 Infrastructure LiveKit

**Option A : LiveKit Cloud (plus simple)**
- Creer un compte sur https://cloud.livekit.io
- Obtenir API Key + Secret + WebSocket URL
- Mettre en variables d'environnement

**Option B : Self-host (plus economique)**
```yaml
# docker-compose.yml
version: '3'
services:
  livekit:
    image: livekit/livekit-server:latest
    ports:
      - "7880:7880"  # HTTP
      - "7881:7881"  # WebSocket
      - "50000-60000:50000-60000/udp"  # WebRTC
    environment:
      - LIVEKIT_KEYS=devkey:secret
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    command: --config /etc/livekit.yaml
```

Deployer sur un VPS (Hetzner, OVH) pour ~5EUR/mois.

### Bilan Phase 2

| Avant | Apres |
|-------|-------|
| vendor-agora : 1,364 KB | livekit-client : ~100 KB |
| Bundle total : 2,900 KB | Bundle total : ~1,636 KB |
| Gzip total : 870 KB | Gzip total : ~530 KB |
| Pas de video | Video possible (WebRTC natif) |
| Payant | Gratuit (self-host) |

**Gain : -1,264 KB brut / -340 KB gzip**

---

## PHASE 3 : MIGRATION REACT ROUTER 7 FRAMEWORK MODE + SSR (1-2 semaines)

> Le changement architectural le plus profond. Passer du SPA pur au SSR avec streaming.

### 3.1 Pourquoi React Router 7 Framework Mode

On utilise deja React Router 7.13. La migration vers Framework Mode est **naturelle** :
- Meme API de routing
- Meme ecosysteme
- SSR + streaming integre
- Pre-rendering des pages statiques
- Code splitting automatique par route
- RSC support (preview)
- Pas besoin de migrer vers Next.js

### 3.2 Restructuration du projet

```
squadplanner/
  app/                          # <-- Nouveau dossier (remplace src/)
    routes.ts                   # Definition des routes
    root.tsx                    # Root layout (remplace App.tsx)
    entry.client.tsx            # Point d'entree client
    entry.server.tsx            # Point d'entree serveur
    routes/
      _index.tsx                # Landing page (/)
      auth.tsx                  # /auth
      home.tsx                  # /home (protected)
      squads.tsx                # /squads
      squads.$id.tsx            # /squads/:id (SquadDetail)
      sessions.tsx              # /sessions
      session.$id.tsx           # /session/:id
      messages.tsx              # /messages
      party.tsx                 # /party
      discover.tsx              # /discover
      profile.tsx               # /profile
      profile.$id.tsx           # /profile/:id (PublicProfile)
      settings.tsx              # /settings
      help.tsx                  # /help
      legal.tsx                 # /legal
      premium.tsx               # /premium
    components/                 # Composants (identique a src/components/)
    hooks/                      # Hooks (identique)
    lib/                        # Libs (identique)
    utils/                      # Utils (identique)
    types/                      # Types (identique)
  react-router.config.ts        # Config React Router
  vite.config.ts                # Config Vite (modifiee)
  package.json
```

### 3.3 Configuration

```ts
// react-router.config.ts
import type { Config } from "@react-router/dev/config"

export default {
  // SSR active pour les pages dynamiques
  ssr: true,

  // Pre-render les pages statiques au build
  prerender: [
    "/",           // Landing
    "/auth",       // Auth
    "/legal",      // Legal
    "/help",       // Help
  ],
} satisfies Config
```

```ts
// app/routes.ts
import { type RouteConfig, route, index, layout } from "@react-router/dev/routes"

export default [
  // Pages publiques (pre-rendues)
  index("./routes/_index.tsx"),
  route("auth", "./routes/auth.tsx"),
  route("legal", "./routes/legal.tsx"),
  route("help", "./routes/help.tsx"),

  // Pages protegees (SSR + streaming)
  layout("./routes/_protected.tsx", [
    route("home", "./routes/home.tsx"),
    route("squads", "./routes/squads.tsx"),
    route("squad/:id", "./routes/squads.$id.tsx"),
    route("sessions", "./routes/sessions.tsx"),
    route("session/:id", "./routes/session.$id.tsx"),
    route("messages", "./routes/messages.tsx"),
    route("party", "./routes/party.tsx"),
    route("discover", "./routes/discover.tsx"),
    route("profile", "./routes/profile.tsx"),
    route("profile/:id", "./routes/profile.$id.tsx"),
    route("settings", "./routes/settings.tsx"),
    route("premium", "./routes/premium.tsx"),
    route("call-history", "./routes/call-history.tsx"),
  ]),

  // 404
  route("*", "./routes/not-found.tsx"),
] satisfies RouteConfig
```

### 3.4 Loaders cote serveur

Chaque route peut avoir un `loader` qui fetch les donnees cote serveur :

```tsx
// app/routes/home.tsx
import type { Route } from "./+types/home"
import { createServerClient } from '@supabase/ssr'

export async function loader({ request }: Route.LoaderArgs) {
  const supabase = createServerClient(/* ... */)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw redirect('/auth')

  const [squads, sessions, profile] = await Promise.all([
    supabase.from('squad_members').select('squads(*)').eq('user_id', user.id),
    supabase.from('sessions').select('*').gte('scheduled_at', new Date().toISOString()).limit(5),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  return {
    user,
    squads: squads.data,
    sessions: sessions.data,
    profile: profile.data,
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user, squads, sessions, profile } = loaderData
  // ... rendu avec les donnees deja chargees, pas de loading spinner !
}
```

### 3.5 Streaming avec Suspense

```tsx
// app/routes/home.tsx
import { Suspense } from 'react'
import { Await } from 'react-router'

export async function loader({ request }: Route.LoaderArgs) {
  // Donnees critiques (attendues)
  const profile = await getProfile(userId)

  // Donnees non-critiques (streamees)
  const aiCoach = getAICoachAdvice(userId) // PAS de await = Promise

  return {
    profile,
    aiCoach, // sera streame
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div>
      {/* Rendu immediatement */}
      <h1>Salut {loaderData.profile.username} !</h1>

      {/* Streame quand pret */}
      <Suspense fallback={<AICoachSkeleton />}>
        <Await resolve={loaderData.aiCoach}>
          {(advice) => <AICoachCard advice={advice} />}
        </Await>
      </Suspense>
    </div>
  )
}
```

### 3.6 Deploiement Vercel

```json
// vercel.json
{
  "framework": "react-router"
}
```

React Router 7 Framework Mode est supporte nativement par Vercel. Le SSR s'execute en Edge Functions.

### Bilan Phase 3

| Metrique | SPA actuel | Avec SSR |
|----------|-----------|----------|
| FCP (First Contentful Paint) | ~1.0s | **< 200ms** |
| LCP (Largest Contentful Paint) | ~1.5s | **< 500ms** |
| TTI (Time to Interactive) | ~2.5s | **< 1.0s** |
| SEO | Mauvais (SPA) | **Excellent** |
| Landing page JS | 72 KB | **0 KB** (pre-rendue) |
| Initial paint | Ecran blanc | **HTML instantane** |

---

## PHASE 4 : CHIRURGIE DU BUNDLE (3-5 jours)

### 4.1 Remplacer Sentry par un micro error tracker

Au lieu de juste lazy-loader Sentry (Phase 1), le remplacer completement :

```ts
// src/lib/errorTracker.ts (~3 KB au lieu de 417 KB)

interface ErrorReport {
  message: string
  stack?: string
  url: string
  timestamp: string
  userAgent: string
  userId?: string
}

const ERROR_ENDPOINT = import.meta.env.VITE_SUPABASE_URL + '/functions/v1/error-report'
const buffer: ErrorReport[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

function report(error: ErrorReport) {
  buffer.push(error)
  if (!flushTimer) {
    flushTimer = setTimeout(flush, 5000) // Batch toutes les 5s
  }
}

async function flush() {
  if (buffer.length === 0) return
  const batch = buffer.splice(0)
  flushTimer = null
  try {
    await fetch(ERROR_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: batch }),
      keepalive: true, // Envoie meme si la page se ferme
    })
  } catch {
    // Re-ajouter au buffer si l'envoi echoue
    buffer.unshift(...batch)
  }
}

// Capturer les erreurs JS globales
window.addEventListener('error', (event) => {
  report({
    message: event.message,
    stack: event.error?.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  })
})

// Capturer les rejections de Promise non gerees
window.addEventListener('unhandledrejection', (event) => {
  report({
    message: String(event.reason),
    stack: event.reason?.stack,
    url: window.location.href,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  })
})

// Envoyer avant fermeture de page
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flush()
})

export { report, flush }
```

**Edge Function pour recevoir les erreurs** :
```ts
// supabase/functions/error-report/index.ts
Deno.serve(async (req) => {
  const { errors } = await req.json()

  // Inserer dans une table Supabase
  const { error } = await supabaseAdmin
    .from('error_reports')
    .insert(errors.map(e => ({
      message: e.message,
      stack: e.stack,
      url: e.url,
      user_agent: e.userAgent,
      user_id: e.userId,
      created_at: e.timestamp,
    })))

  if (error) return new Response('Error', { status: 500 })
  return new Response('OK')
})
```

**Gain** : -417 KB brut / -138 KB gzip (completement supprime)

---

### 4.2 Supabase Client Leger

Le client Supabase complet fait 170 KB. On peut le splitter :

```ts
// src/lib/supabase-light.ts (~5 KB)
// Client leger pour les requetes REST simples

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export async function query<T>(
  table: string,
  options: {
    select?: string
    filter?: Record<string, string>
    limit?: number
    order?: { column: string, ascending?: boolean }
  } = {}
): Promise<T[]> {
  const params = new URLSearchParams()
  if (options.select) params.set('select', options.select)
  if (options.limit) params.set('limit', String(options.limit))
  if (options.order) {
    params.set('order', `${options.order.column}.${options.order.ascending ? 'asc' : 'desc'}`)
  }

  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${getAccessToken()}`,
      'Content-Type': 'application/json',
    },
  })
  return res.json()
}
```

```ts
// src/lib/supabase-realtime.ts (lazy loaded, seulement pour Messages/Party)
// Client complet charge uniquement quand on a besoin du realtime
export const getRealtimeClient = () => import('@supabase/supabase-js').then(
  ({ createClient }) => createClient(SUPABASE_URL, SUPABASE_KEY)
)
```

**Gain** : -120 KB brut / -35 KB gzip sur le chargement initial

---

### 4.3 Lucide Icons -> SVG Inline

Lucide (28 KB) est tree-shake mais reste lourd pour ~40 icones utilisees.

**Option A : Copier les SVG utilises en tant que composants React** :
```tsx
// src/components/icons.tsx
export const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
    strokeLinejoin="round" {...props}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)
```

**Option B : Utiliser unplugin-icons** (genere les icones au build) :
```bash
npm install -D unplugin-icons @iconify-json/lucide
```

```ts
// vite.config.ts
import Icons from 'unplugin-icons/vite'

plugins: [
  Icons({
    compiler: 'jsx',
    jsx: 'react',
  }),
]
```

```tsx
// Utilisation
import HomeIcon from '~icons/lucide/home'
// Genere un SVG inline au build - 0 runtime
```

**Gain** : -28 KB brut / -9 KB gzip

---

### 4.4 Confetti cleanup

On a 2 libs de confetti (canvas-confetti + react-confetti = 21 KB). Garder seulement `canvas-confetti` :

```bash
npm uninstall react-confetti
```

Adapter `LazyConfetti` pour utiliser uniquement `canvas-confetti` :
```tsx
// src/components/LazyConfetti.tsx
import { useEffect } from 'react'

export default function Confetti({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return
    import('canvas-confetti').then(({ default: confetti }) => {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    })
  }, [active])
  return null
}
```

**Gain** : -10 KB brut / -4 KB gzip

---

### 4.5 react-countup -> CSS Counter Animation

```css
/* Remplacer react-countup par une animation CSS pure */
@property --num {
  syntax: "<integer>";
  initial-value: 0;
  inherits: false;
}

.count-up {
  animation: counter 1s ease-out forwards;
  counter-reset: num var(--num);
}

.count-up::after {
  content: counter(num);
}

@keyframes counter {
  from { --num: 0; }
  to { --num: var(--target); }
}
```

```bash
npm uninstall react-countup
```

**Gain** : ~5 KB

---

### Bilan Phase 4

| Supprime | Taille economisee |
|----------|-------------------|
| Sentry complet | -417 KB / -138 KB gzip |
| Supabase client (partiel) | -120 KB / -35 KB gzip |
| Lucide runtime | -28 KB / -9 KB gzip |
| react-confetti | -10 KB / -4 KB gzip |
| react-countup | -5 KB / -2 KB gzip |
| **Total Phase 4** | **-580 KB / -188 KB gzip** |

---

## PHASE 5 : INFRASTRUCTURE EDGE & CDN (1 semaine)

### 5.1 Vercel Edge Runtime

Avec React Router 7 Framework Mode sur Vercel :
- SSR execute en Edge Functions (< 50ms cold start)
- Pages statiques servies depuis le CDN le plus proche
- Streaming SSR avec Edge Runtime

```ts
// Forcer Edge Runtime pour certaines routes
export const config = {
  runtime: 'edge',
}
```

### 5.2 Cache Headers agressifs

```ts
// app/entry.server.tsx
export function headers() {
  return {
    // Assets statiques : cache 1 an (hash dans le nom)
    'Cache-Control': 'public, max-age=31536000, immutable',
  }
}

// Pour les pages SSR
export function headers({ loaderHeaders }) {
  return {
    // SSR : cache 60s avec revalidation
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  }
}
```

### 5.3 Brotli Compression

Vercel supporte Brotli nativement. Verifier que c'est active :
```
Content-Encoding: br
```

Brotli est 15-20% plus petit que gzip. Impact sur le total :
- 870 KB gzip -> ~720 KB Brotli (estimation)

### 5.4 Service Worker avance

```js
// public/sw.js - Strategie de cache avancee

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DATA_CACHE = `data-${CACHE_VERSION}`

// Pre-cache les assets critiques
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Assets statiques : Cache First
  if (request.url.match(/\.(js|css|woff2|png|jpg|svg)$/)) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached || fetch(request).then(res => {
          const clone = res.clone()
          caches.open(STATIC_CACHE).then(cache => cache.put(request, clone))
          return res
        })
      )
    )
    return
  }

  // API Supabase : Network First avec fallback cache
  if (request.url.includes('supabase.co/rest')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(DATA_CACHE).then(cache => cache.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Pages HTML : Stale While Revalidate
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request).then(res => {
          caches.open(STATIC_CACHE).then(cache => cache.put(request, res.clone()))
          return res
        })
        return cached || fetchPromise
      })
    )
  }
})
```

### 5.5 Image Optimization

```tsx
// src/components/ui/OptimizedImage.tsx
interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

export function OptimizedImage({ src, alt, width, height, className, priority }: OptimizedImageProps) {
  // Utiliser Vercel Image Optimization ou Cloudflare Images
  const optimizedSrc = `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=80`

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
```

### 5.6 Font Optimization

```css
/* Preload la font principale */
/* Dans index.html ou root.tsx */
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>

/* Utiliser font-display: swap pour eviter le FOIT */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2');
  font-display: swap;
  font-weight: 100 900;
}
```

### 5.7 Resource Hints

```html
<!-- index.html / root.tsx -->
<!-- DNS prefetch pour les domaines tiers -->
<link rel="dns-prefetch" href="https://your-supabase-url.supabase.co">
<link rel="dns-prefetch" href="https://livekit-server.your-domain.com">

<!-- Preconnect pour les APIs critiques -->
<link rel="preconnect" href="https://your-supabase-url.supabase.co" crossorigin>

<!-- Preload CSS critique -->
<link rel="preload" href="/assets/index.css" as="style">
```

---

## PHASE 6 : REACT SERVER COMPONENTS (1-2 semaines)

> React Router 7.9+ supporte RSC en preview. C'est la prochaine frontiere.

### 6.1 Quelles pages migrer en RSC

| Page | Interactive ? | RSC candidat ? |
|------|-------------|----------------|
| Landing | Non (statique) | **Oui - pre-rendue** |
| Legal | Non (statique) | **Oui - pre-rendue** |
| Help | Peu (FAQ) | **Oui** |
| Auth | Formulaire | Non (client) |
| Home | Tres interactif | **Hybride** (shell RSC + client) |
| Messages | Tres interactif | Non (realtime) |
| Party | Tres interactif | Non (realtime) |
| Discover | Filtres + liste | **Hybride** |
| Profile | Mixte | **Hybride** |
| Squads | Liste + actions | **Hybride** |

### 6.2 Exemple de composant RSC hybride

```tsx
// app/routes/home.tsx (Server Component)
// Ce composant s'execute UNIQUEMENT sur le serveur
// Zero JS envoye au client pour ce composant

import { HomeClientShell } from '../components/home/HomeClientShell'

export async function loader({ request }) {
  const supabase = createServerSupabase(request)
  const { data: profile } = await supabase.from('profiles').select('*').single()
  const { data: squads } = await supabase.from('squads').select('*')
  const { data: sessions } = await supabase.from('sessions').select('*').limit(5)

  return { profile, squads, sessions }
}

// Le composant Home est un Server Component
// Seul HomeClientShell sera hydrate cote client
export default function Home({ loaderData }) {
  const { profile, squads, sessions } = loaderData

  return (
    <div>
      {/* Rendu serveur - 0 JS */}
      <h1>Salut {profile.username} !</h1>
      <ReliabilityBadge score={profile.reliability_score} />

      {/* Ce composant client sera hydrate */}
      <HomeClientShell
        squads={squads}
        sessions={sessions}
        userId={profile.id}
      />
    </div>
  )
}
```

---

## PHASE 7 : MONITORING & PERFORMANCE CONTINUE

### 7.1 Web Vitals en production

```ts
// src/lib/webVitals.ts
import { onLCP, onFID, onCLS, onINP, onTTFB } from 'web-vitals'

function sendMetric(metric) {
  // Envoyer a Supabase ou un service d'analytics
  fetch('/api/vitals', {
    method: 'POST',
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating, // "good", "needs-improvement", "poor"
      url: window.location.href,
    }),
    keepalive: true,
  })
}

onLCP(sendMetric)
onFID(sendMetric)
onCLS(sendMetric)
onINP(sendMetric)
onTTFB(sendMetric)
```

### 7.2 Budget Performance automatise

```json
// .lighthouserc.json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 1000 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
        "resource-summary:script:size": ["error", { "maxNumericValue": 300000 }]
      }
    }
  }
}
```

### 7.3 Bundle Size CI Check

```yaml
# .github/workflows/bundle-check.yml
name: Bundle Size Check
on: [pull_request]

jobs:
  bundle:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - name: Check bundle size
        run: |
          TOTAL=$(du -sb dist/assets/*.js | awk '{total += $1} END {print total}')
          MAX=1000000  # 1 MB max
          if [ "$TOTAL" -gt "$MAX" ]; then
            echo "Bundle too large: ${TOTAL} bytes (max: ${MAX})"
            exit 1
          fi
          echo "Bundle OK: ${TOTAL} bytes"
```

---

## RESUME : PROJECTIONS FINALES

### Bundle JS

| Phase | Brut | Gzip | Brotli (est.) |
|-------|------|------|---------------|
| **Actuel** | **2,900 KB** | **870 KB** | **720 KB** |
| Phase 1 (Quick wins) | 2,900 KB | 650 KB (lazy) | 540 KB |
| Phase 2 (Agora -> LiveKit) | 1,636 KB | 530 KB | 440 KB |
| Phase 3 (SSR) | 1,636 KB | **~100 KB initial** | **~85 KB initial** |
| Phase 4 (Chirurgie) | **~1,050 KB** | **~300 KB total** | **~250 KB total** |
| Phase 5 (Edge) | ~1,050 KB | ~300 KB | ~250 KB |
| Phase 6 (RSC) | **~800 KB** | **~220 KB total** | **~180 KB total** |

### Metriques Web Vitals

| Metrique | Actuel | Cible finale |
|----------|--------|-------------|
| **FCP** | ~1.0s | **< 200ms** |
| **LCP** | ~1.5s | **< 400ms** |
| **TTI** | ~2.5s | **< 800ms** |
| **INP** | ~200ms | **< 100ms** |
| **CLS** | ~0.05 | **< 0.01** |
| **TTFB** | ~300ms | **< 50ms** (edge) |
| **Lighthouse** | ~65 | **95+** |
| **Bundle initial** | 870 KB gzip | **< 100 KB gzip** |
| **Bundle total** | 870 KB gzip | **< 250 KB gzip** |

### Timeline estimee

| Phase | Duree | Prerequis |
|-------|-------|-----------|
| Phase 1 : Quick Wins | 2-3 jours | Aucun |
| Phase 2 : LiveKit | 3-5 jours | Phase 1 |
| Phase 3 : SSR | 1-2 semaines | Phase 1 |
| Phase 4 : Chirurgie Bundle | 3-5 jours | Phase 2 |
| Phase 5 : Infrastructure | 1 semaine | Phase 3 |
| Phase 6 : RSC | 1-2 semaines | Phase 3 |
| Phase 7 : Monitoring | 2-3 jours | Phase 5 |
| **TOTAL** | **5-7 semaines** | - |

### Couts infrastructure

| Service | Actuel | Apres migration |
|---------|--------|----------------|
| Agora | Payant (usage) | **0 EUR** (LiveKit self-host) |
| Sentry | Gratuit (tier) | **0 EUR** (custom tracker) |
| LiveKit Server | - | **~5 EUR/mois** (VPS Hetzner) |
| Vercel | Gratuit/Pro | Inchange |
| Supabase | Gratuit/Pro | Inchange |
| **Total** | Variable | **~5 EUR/mois** |

---

## ORDRE D'EXECUTION RECOMMANDE

```
Semaine 1 : Phase 1 (Quick Wins) + debut Phase 2 (LiveKit setup)
Semaine 2 : Phase 2 (migration complete Agora -> LiveKit)
Semaine 3 : Phase 3 debut (restructuration projet, React Router Framework Mode)
Semaine 4 : Phase 3 fin (SSR, loaders, streaming, deploiement)
Semaine 5 : Phase 4 (chirurgie bundle) + Phase 5 debut (infrastructure)
Semaine 6 : Phase 5 fin + Phase 6 debut (RSC)
Semaine 7 : Phase 6 fin + Phase 7 (monitoring, CI, budgets)
```

> A la fin de ce plan, Squad Planner sera plus rapide que 99% des apps web.
> FCP < 200ms. Bundle < 250 KB. Navigation instantanee.
> Machine de guerre.
