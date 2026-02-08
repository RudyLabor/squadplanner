# Plan Remotion Videos — Squad Planner

> Ce fichier est le plan complet pour intégrer des vidéos Remotion dans Squad Planner.
> Il peut être partagé à un nouvel agent pour reprendre le travail là où on s'est arrêté.
> Dernière mise à jour : 8 février 2026

---

## Contexte

La Phase 5 du projet mentionne "Vidéo/GIF démo Landing" comme item 🟡 non résolu. L'objectif est d'ajouter 5 types de vidéos générées avec Remotion pour élever la landing page et l'onboarding au niveau des meilleures apps mondiales — **sans aucun impact sur les performances** de l'app existante.

**Contrainte critique :** Remotion est un outil de BUILD uniquement. Aucune dépendance Remotion n'entre dans le bundle client. Les vidéos sont pré-rendues en fichiers statiques (.webm/.mp4) placés dans `public/videos/`.

**Méthodologie :** On avance vidéo par vidéo. Chaque vidéo est validée par l'utilisateur avant de passer à la suivante.

---

## Architecture : Isolation totale

```
squad-planner/
  src/                          # App existante (INCHANGÉE côté build)
  public/
    videos/                     # NOUVEAU — Fichiers vidéo rendus
      hero-walkthrough.webm / .mp4 / -poster.webp
      pillar-voice.webm / .mp4 / -poster.webp
      pillar-planning.webm / .mp4 / -poster.webp
      pillar-reliability.webm / .mp4 / -poster.webp
      social-proof.webm / .mp4 / -poster.webp
      onboarding.webm / .mp4 / -poster.webp
  remotion/                     # NOUVEAU — Projet Remotion isolé
    package.json                # Dépendances propres (jamais dans le bundle app)
    tsconfig.json               # Propre tsconfig (pas référencé par l'app)
    remotion.config.ts
    src/
      Root.tsx                  # Toutes les compositions enregistrées
      tokens.ts                 # Miroir des design tokens (theme.ts)
      compositions/             # 6 vidéos
        HeroWalkthrough.tsx
        PillarVoice.tsx
        PillarPlanning.tsx
        PillarReliability.tsx
        SocialProof.tsx
        OnboardingVideo.tsx
        ShareCard.tsx           # Phase 2 — dynamique, nécessite serveur
      components/               # Composants Remotion partagés
        PhoneFrame.tsx          # Cadre iPhone réaliste
        AppScreen.tsx           # Wrapper écran app
        AnimatedAvatar.tsx      # Avatar avec ring animé
        ReliabilityCircle.tsx   # Cercle de progression SVG
        CounterDigit.tsx        # Chiffre animé avec roll
    render.ts                   # Script de rendu batch
```

**Garantie perf :** `npm run dev` et `npm run build` ne touchent JAMAIS au dossier `remotion/`. Aucun import croisé. Le `vite.config.ts` n'est PAS modifié.

---

## Design Tokens (à miroir dans remotion/src/tokens.ts)

Source de vérité : `src/lib/theme.ts`

```ts
export const tokens = {
  bgBase: '#08090a',
  bgElevated: '#101012',
  bgSurface: '#18191b',
  bgHover: '#1f2023',
  textPrimary: '#f7f8f8',
  textSecondary: '#c9cace',
  textTertiary: '#8b8d90',
  primary: '#5e6dd2',
  primaryHover: '#6a79db',
  success: '#4ade80',
  warning: '#f5a623',
  info: '#60a5fa',
  purple: '#8b93ff',
  error: '#f87171',
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: 'rgba(255, 255, 255, 0.08)',
  // Couleurs piliers (depuis Landing.tsx)
  voiceGreen: '#34d399',
  planningOrange: '#f5a623',
  reliabilityRed: '#f87171',
  brandIndigo: '#6366f1',
} as const;
```

---

## Vidéo 1 : Hero Walkthrough (PRIORITÉ #1)

### Spec technique
- **Résolution :** 540x960px (portrait, ratio iPhone)
- **FPS :** 30
- **Durée :** 10 secondes (300 frames)
- **Loop :** oui (transition seamless du dernier écran au premier)
- **Budget taille :** WebM < 800KB, MP4 < 1.2MB, poster < 15KB

### Scénario (reproduit HeroMockup.tsx — 680 lignes de JS remplacées)
1. **Frames 0-75 (0-2.5s)** — Écran Home : header "Salut MaxGamer_94!", badge fiabilité 94%, prochaine session, grille stats
2. **Frames 75-150 (2.5-5s)** — Slide vers écran Squad : code invite, party vocale avec indicateurs, liste sessions
3. **Frames 150-225 (5-7.5s)** — Slide vers écran Party : waveforms audio, avatars avec rings, boutons mute/unmute
4. **Frames 225-300 (7.5-10s)** — Slide vers écran Profile : fade retour au début pour loop seamless

### Composant PhoneFrame
Reproduit le cadre iPhone de HeroMockup.tsx (lignes 603-646) :
- `rounded-[2.5rem]`, encoche, glow, barre de statut
- Ombre portée et reflets subtils

### Intégration dans l'app
Remplace `<HeroMockup />` à `src/pages/Landing.tsx` ligne ~447 :
```tsx
<OptimizedVideo
  webmSrc="/videos/hero-walkthrough.webm"
  mp4Src="/videos/hero-walkthrough.mp4"
  posterSrc="/videos/hero-walkthrough-poster.webp"
  alt="Démonstration de l'application Squad Planner"
  width={280} height={480}
  loop priority
/>
```

---

## Vidéo 2 : Pillar Voice Party (5s loop)

### Spec technique
- **Résolution :** 480x320px (paysage, format carte)
- **FPS :** 30
- **Durée :** 5 secondes (150 frames)
- **Budget :** WebM < 300KB

### Scénario
- 4 avatars en cercle, un pulse avec ring vert (#34d399) de "speaking"
- Barres waveform audio qui s'animent
- Header "Party vocale", indicateur "2 en ligne" qui clignote
- Fond sombre (#101012) avec glow subtil vert

### Intégration
Section Features de Landing.tsx (~L686-761), onglet Voice

---

## Vidéo 3 : Pillar Planning RSVP (5s loop)

### Spec technique
- **Résolution :** 480x320px
- **FPS :** 30
- **Durée :** 5 secondes (150 frames)
- **Budget :** WebM < 300KB

### Scénario
- UI calendrier avec une session "Mardi 21h" mise en valeur
- 4 checkmarks RSVP qui apparaissent un par un (stagger 0.3s)
- Badge "4/4 Confirmée" qui pop in à la fin avec scale spring
- Couleur accent : #f5a623 (orange warning)

### Intégration
Section Features de Landing.tsx, onglet Planning

---

## Vidéo 4 : Pillar Reliability Score (6s loop)

### Spec technique
- **Résolution :** 480x320px
- **FPS :** 30
- **Durée :** 6 secondes (180 frames)
- **Budget :** WebM < 350KB

### Scénario
- Cercle SVG progressif animé de 0% à 94%
- Points d'historique sessions (vert/rouge) qui apparaissent un par un
- Username "MaxGamer_94" fade in
- Compteur streak "🔥 5" avec scale bounce
- Couleur accent : #f87171 (rouge → vert quand score monte)

### Intégration
Section Features de Landing.tsx, onglet Reliability

---

## Vidéo 5 : Social Proof Stats (4-5s loop)

### Spec technique
- **Résolution :** 960x240px (bannière large)
- **FPS :** 30
- **Durée :** 5 secondes (150 frames)
- **Budget :** WebM < 250KB

### Scénario
- 4 cartes stat en stagger (0.15s entre chaque) :
  - "100%" fiabilité (vert #34d399)
  - "3x" plus de sessions (indigo #6366f1)
  - "30s" pour planifier (orange #f5a623)
  - "4.9 ★" satisfaction (cyan #06B6D4)
- Chaque nombre fait un digit-roll animation (comme un compteur mécanique)
- Pulse glow subtil sur chaque icône

### Intégration
Section Social Proof de Landing.tsx (~L456-482). Optionnel — peut compléter les AnimatedCounter existants plutôt que les remplacer.

---

## Vidéo 6 : Onboarding Welcome (18s, play once)

### Spec technique
- **Résolution :** 720x1280px (mobile-first)
- **FPS :** 30
- **Durée :** 18 secondes (540 frames)
- **Loop :** NON — joue une seule fois
- **Budget :** WebM < 1.5MB

### Scénario
1. **0-3s** — Logo Squad Planner reveal avec particle burst
2. **3-7s** — "Crée ta squad" — mockup téléphone montrant le formulaire de création
3. **7-11s** — "Invite tes potes" — code invite qui apparaît, avatars qui rejoignent en stagger
4. **11-15s** — "Planifiez ensemble" — calendrier avec RSVP checks qui apparaissent
5. **15-18s** — "Jouez ensemble" — UI party vocale avec confetti, transition vers texte "Ta squad t'attend"

### Intégration
Page `src/pages/Onboarding.tsx`, étape `splash` (ligne 56)

---

## Composant d'intégration : OptimizedVideo

**Fichier :** `src/components/OptimizedVideo.tsx`

Calqué sur le pattern existant de `src/components/OptimizedImage.tsx` :

### Props
```tsx
interface OptimizedVideoProps {
  webmSrc: string;
  mp4Src: string;
  posterSrc: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loop?: boolean;          // default: true
  priority?: boolean;      // default: false (true = skip IO, charge immédiat)
}
```

### Comportement
1. Affiche un skeleton placeholder (réutilise `src/components/ui/Skeleton.tsx`)
2. Affiche immédiatement le poster en `<img>` (10-15KB, instantané)
3. Quand IntersectionObserver fire (200px avant le viewport) :
   - Vérifie `prefers-reduced-motion` → si reduce, STOP (poster only, aucun téléchargement vidéo)
   - Vérifie Network Information API → si 2G ou saveData, STOP
   - Crée `<video muted autoplay playsinline loop>` avec `<source>` WebM puis MP4
   - Sur événement `canplay` : fade-in vidéo par dessus le poster (300ms)
4. Si `priority={true}` : skip IO, charge immédiatement (hero uniquement)
5. En cas d'erreur : poster reste visible, UX intacte

### Fallback 5 niveaux
1. Connexion rapide + navigateur moderne → WebM autoplay muted loop
2. Connexion correcte → Poster instantané, vidéo en background, fade-in quand prête
3. `prefers-reduced-motion` → Poster uniquement, AUCUN téléchargement vidéo
4. 2G / saveData → Poster uniquement, AUCUN téléchargement vidéo
5. Erreur vidéo / format non supporté → Poster reste visible

---

## Service Worker : Cache vidéo

**Fichier :** `public/sw.js`

Ajouter un 4ème tier de cache :
```js
const VIDEO_CACHE = `squadplanner-videos-v4`;
```

Détection dans le fetch handler :
```js
function isVideoRequest(request, url) {
  return request.destination === 'video' || /\.(mp4|webm)$/.test(url.pathname);
}
```

Stratégie : Cache First (les vidéos ne changent pas entre les déploiements, juste les hash).

---

## Budget Performance Total

| Vidéo | WebM | MP4 | Poster | Chargé quand ? |
|-------|------|-----|--------|----------------|
| Hero (10s) | 800KB | 1.2MB | 15KB | Immédiat (above fold) |
| Pillar Voice (5s) | 300KB | 450KB | 10KB | Au scroll (IO) |
| Pillar Planning (5s) | 300KB | 450KB | 10KB | Au scroll (IO) |
| Pillar Reliability (6s) | 350KB | 500KB | 10KB | Au scroll (IO) |
| Social Proof (5s) | 250KB | 400KB | 8KB | Au scroll (IO) |
| Onboarding (18s) | 1.5MB | 2.2MB | 15KB | Page onboarding seulement |

**Landing page typique :** ~1.1MB vidéo chargée (hero + poster). Les autres vidéos se chargent au scroll uniquement.

---

## Fichiers critiques app modifiés

| Fichier | Modification |
|---------|-------------|
| `src/components/OptimizedVideo.tsx` | **NOUVEAU** |
| `src/pages/Landing.tsx` | Remplacement HeroMockup + piliers + social proof |
| `src/pages/Onboarding.tsx` | Vidéo splash |
| `index.html` | `<link rel="preload">` poster hero |
| `public/sw.js` | Cache tier vidéo |
| `package.json` | Scripts `videos:studio`, `videos:render` |

**Fichiers NON modifiés :** `vite.config.ts`, `tsconfig.json`, `src/App.tsx`, aucun hook, aucun store.

---

## Ordre d'exécution

```
Fondation Remotion → Hero Video → OptimizedVideo composant → Intégration hero
→ VALIDATION UTILISATEUR
→ Pillar Voice → VALIDATION
→ Pillar Planning → VALIDATION
→ Pillar Reliability → VALIDATION
→ Social Proof → VALIDATION
→ Onboarding → VALIDATION
→ Service Worker cache → Audit Lighthouse final
```

Chaque vidéo est validée individuellement avant de passer à la suivante.

---

## Checklist pour un nouvel agent

1. Lire ce fichier en entier
2. Lire `GEMINI.md` pour le contexte projet complet
3. Identifier où en est la progression (quelle vidéo est en cours)
4. Reprendre à l'étape suivante
5. Toujours vérifier que `npm run build` passe après chaque modification
6. Toujours vérifier que les vidéos respectent le budget taille
