# Remotion Videos — Squad Planner

> Document de travail pour la production de 3 vidéos Remotion premium.
> Peut être partagé à d'autres agents pour continuer le travail.

---

## Contexte Projet

- **App** : Squad Planner — "Le Calendly du gaming"
- **Stack** : React + Vite + React Router 7 (framework mode SSR)
- **Remotion** : `remotion@^4.0.421`, `@remotion/cli@^4.0.421`, `@remotion/player@^4.0.421`
- **Skills Remotion** : `.claude/skills/remotion/` (30+ rule files)
- **Branche** : `feature/phase3-ssr-framework-mode`

---

## Design System

### Couleurs (Dark Theme — défaut pour les vidéos)

| Token | Valeur | Usage |
|-------|--------|-------|
| `background` | `#050506` | Fond principal |
| `backgroundElevated` | `#0a0a0c` | Surfaces élevées |
| `backgroundSurface` | `#0f1012` | Cards, panels |
| `backgroundHover` | `#141518` | Hover states |
| `primary` | `#6366f1` | Indigo — couleur de marque |
| `primaryHover` | `#818cf8` | Indigo clair |
| `secondary` | `#06B6D4` | Cyan électrique |
| `secondaryHover` | `#22D3EE` | Cyan clair |
| `success` | `#34d399` | Vert — confirmations |
| `warning` | `#fbbf24` | Or — planning |
| `error` | `#f87171` | Rouge — refus/problèmes |
| `purple` | `#a78bfa` | Violet accent |
| `textPrimary` | `#fafafa` | Texte principal |
| `textSecondary` | `#a1a1a6` | Texte secondaire |
| `textTertiary` | `#7d7d82` | Texte tertiaire |
| `logoPrimary` | `#5e6dd2` | Logo indigo |
| `logoAccent` | `#8b93ff` | Logo violet |
| `logoGreen` | `#4ade80` | Logo vert |
| `borderSubtle` | `rgba(255,255,255,0.04)` | Bordures subtiles |
| `borderDefault` | `rgba(255,255,255,0.06)` | Bordures par défaut |

### Typographie

| Usage | Font | Weight |
|-------|------|--------|
| Headings / Display | Space Grotesk | 700-900 |
| Body / UI | Inter | 400-600 |
| Mono | SF Mono, ui-monospace | 400-500 |

### Principes Visuels

- Dark-first, premium, minimal
- Depth through layering (backgrounds multiples)
- Subtle glows (opacity 0.1-0.15)
- Mesh gradients pour hero sections
- Noise texture overlay (opacity 0.03)
- Spring animations + smooth easing
- WCAG AA contrast ratios

---

## Assets Disponibles

| Fichier | Chemin | Type | Description |
|---------|--------|------|-------------|
| `favicon.svg` | `public/favicon.svg` | Logo SVG | 4 cercles aux coins (indigo/violet/vert) + hub central vert, reliés par des lignes |
| `og-image.png` | `public/og-image.png` | Image OG | 781KB, fond dark avec "Le Calendly du gaming", logo Squad Planner |
| `screenshots/` | `public/screenshots/` | Dossier | **Vide** — pas de captures UI existantes |

> Les mockups UI dans les vidéos doivent être créés programmatiquement en React/Remotion (pas de screenshots).

---

## Structure Remotion à Créer

```
src/
  remotion/
    index.ts                    # Root file — registerRoot
    compositions.tsx            # Toutes les compositions
    shared/
      colors.ts                 # Palette de couleurs
      fonts.ts                  # Chargement des fonts
      types.ts                  # Types partagés
      components/
        Logo.tsx                # Composant logo SVG animé
        MockupUI.tsx            # Composant mockup interface SP
        Avatar.tsx              # Composant avatar générique
        Waveform.tsx            # Composant waveform audio
        Badge.tsx               # Badge OUI/NON/Step number
        Button.tsx              # Bouton CTA animé
    video1-hero/
      HeroVideo.tsx             # Composition principale
      Scene1-DiscordChaos.tsx
      Scene2-TransformUI.tsx
      Scene3-SquadReady.tsx
      Scene4-HeroLoop.tsx
    video2-demo/
      DemoVideo.tsx             # Composition principale
      Scene1-Intro.tsx
      Scene2-CreateSquad.tsx
      Scene3-InviteFriends.tsx
      Scene4-PlanDecide.tsx
      Scene5-PlayTogether.tsx
      Scene6-CTA.tsx
    video3-ad/
      AdVideo.tsx               # Composition principale
      Scene1-Hook.tsx
      Scene2-PainPoints.tsx
      Scene3-ProductReveal.tsx
      Scene4-CTA.tsx
remotion.config.ts              # Config Remotion CLI
```

---

## VIDEO 1 — Hero Video : "De 'on verra' à 'on y est'"

### Specs

| Propriété | Valeur |
|-----------|--------|
| Durée | 16 secondes |
| FPS | 30 |
| Résolution | 1920x1080 (16:9) |
| Usage | Background autoplay loop, muted, sur le Hero de la landing |
| Style | Motion design minimal, dark theme, typographie bold |
| Références | Linear, Arc, Raycast hero backgrounds |

### Tableau des Scènes

| Scène | Frames | Overlap | Transition | Fichier | Contenu |
|-------|--------|---------|------------|---------|---------|
| 1 | 0-120 | - | - | Scene1-DiscordChaos.tsx | Messages Discord "on verra", "je sais pas", "peut-être demain" qui apparaissent puis s'effacent |
| 2 | 100-240 | 20 | morph | Scene2-TransformUI.tsx | Transition morphing du chat Discord vers l'interface Squad Planner — session créée |
| 3 | 220-390 | 20 | crossfade | Scene3-SquadReady.tsx | 4/5 confirmés, check-in validé, waveform active |
| 4 | 370-480 | 20 | crossfade | Scene4-HeroLoop.tsx | Logo + tagline "Fini les 'on verra'" — boucle seamless vers Scene1 |

### JSON Directives

```json
{
  "project": {
    "title": "Squad Planner — Hero Video",
    "description": "Animation loop pour le Hero de la landing : du chaos Discord à la squad organisée",
    "style": "tech"
  },
  "timing": {
    "totalDurationInSeconds": 16,
    "fps": 30,
    "numberOfScenes": 4
  },
  "scenes": [
    {
      "id": "scene_1",
      "name": "Discord Chaos",
      "startFrame": 0,
      "endFrame": 120,
      "durationInFrames": 120,
      "durationInSeconds": 4,
      "overlap": {
        "withPrevious": 0,
        "transitionType": "none"
      },
      "description": "Fond dark (#050506). Un faux écran Discord apparaît avec des messages qui popent un par un : 'on joue ce soir ?', 'je sais pas', 'on verra', 'peut-être demain', '...'. Chaque message a un avatar générique. Les messages deviennent gris, puis s'effacent progressivement — le chat meurt.",
      "elements": [
        { "type": "text", "content": "on joue ce soir ?", "image": null, "importance": "primary" },
        { "type": "text", "content": "je sais pas", "image": null, "importance": "secondary" },
        { "type": "text", "content": "on verra", "image": null, "importance": "primary" },
        { "type": "text", "content": "peut-être demain", "image": null, "importance": "secondary" },
        { "type": "text", "content": "...", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_2",
      "name": "Transform UI",
      "startFrame": 100,
      "endFrame": 240,
      "durationInFrames": 140,
      "durationInSeconds": 4.67,
      "overlap": {
        "withPrevious": 20,
        "transitionType": "morph"
      },
      "description": "Le chat Discord se déforme et se transforme (morph) en interface Squad Planner. La barre latérale apparaît, le nom de la squad 'Les Invaincus' se forme. Une session 'Ranked Valorant — Vendredi 21h' apparaît. L'interface est stylisée, dark theme premium, pas un screenshot — un mockup UI en React.",
      "elements": [
        { "type": "text", "content": "Les Invaincus", "image": null, "importance": "primary" },
        { "type": "text", "content": "Ranked Valorant — Vendredi 21h", "image": null, "importance": "secondary" },
        { "type": "image", "content": null, "image": "favicon.svg", "importance": "secondary" }
      ]
    },
    {
      "id": "scene_3",
      "name": "Squad Ready",
      "startFrame": 220,
      "endFrame": 390,
      "durationInFrames": 170,
      "durationInSeconds": 5.67,
      "overlap": {
        "withPrevious": 20,
        "transitionType": "crossfade"
      },
      "description": "Les avatars des membres apparaissent un par un avec des badges OUI (vert). Compteur animé : 1/5... 2/5... 3/5... 4/5 confirmés. Un check-in s'active avec une animation de pulse vert. Une waveform audio animée apparaît en bas — la party vocale est active. Sentiment : la squad est vivante, prête à jouer.",
      "elements": [
        { "type": "text", "content": "4/5 confirmés", "image": null, "importance": "primary" },
        { "type": "text", "content": "Check-in validé", "image": null, "importance": "secondary" },
        { "type": "text", "content": "Party vocale active", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_4",
      "name": "Hero Loop Transition",
      "startFrame": 370,
      "endFrame": 480,
      "durationInFrames": 110,
      "durationInSeconds": 3.67,
      "overlap": {
        "withPrevious": 20,
        "transitionType": "crossfade"
      },
      "description": "L'interface se réduit, le logo Squad Planner apparaît au centre avec un glow indigo subtil. Tagline 'Fini les « on verra »' apparaît en dessous en Space Grotesk bold. Puis fondu progressif vers le noir (#050506) pour boucler seamlessly vers Scene1.",
      "elements": [
        { "type": "image", "content": null, "image": "favicon.svg", "importance": "primary" },
        { "type": "text", "content": "Fini les « on verra »", "image": null, "importance": "primary" }
      ]
    }
  ],
  "design": {
    "colorPalette": {
      "background": "#050506",
      "backgroundElevated": "#0a0a0c",
      "backgroundSurface": "#0f1012",
      "primary": "#6366f1",
      "primaryHover": "#818cf8",
      "secondary": "#06B6D4",
      "success": "#34d399",
      "warning": "#fbbf24",
      "error": "#f87171",
      "textPrimary": "#fafafa",
      "textSecondary": "#a1a1a6",
      "logoPrimary": "#5e6dd2",
      "logoAccent": "#8b93ff",
      "logoGreen": "#4ade80"
    },
    "mood": "dark",
    "typography": {
      "headingFont": "Space Grotesk",
      "bodyFont": "Inter",
      "headingWeight": "800",
      "bodyWeight": "500"
    }
  },
  "assets": {
    "images": [
      { "filename": "favicon.svg", "path": "/public/favicon.svg", "usage": "logo", "usedInScenes": ["scene_2", "scene_4"] },
      { "filename": "og-image.png", "path": "/public/og-image.png", "usage": "background", "usedInScenes": [] }
    ]
  },
  "animation": {
    "rhythm": "moderate",
    "transitions": "smooth",
    "intensity": "moderate",
    "overallVibe": "Dark premium tech — du chaos à l'ordre, du désorganisé au structuré, avec des micro-animations élégantes"
  }
}
```

### Statut : TERMINE

### Fichiers créés

| Fichier | Chemin | Lignes |
|---------|--------|--------|
| Config Remotion | `remotion.config.ts` | 4 |
| Entry point | `src/remotion/index.ts` | 4 |
| Compositions | `src/remotion/compositions.tsx` | 22 |
| Couleurs | `src/remotion/shared/colors.ts` | 37 |
| Fonts | `src/remotion/shared/fonts.ts` | 17 |
| Composition principale | `src/remotion/video1-hero/HeroVideo.tsx` | 42 |
| Scene 1 - Discord Chaos | `src/remotion/video1-hero/Scene1-DiscordChaos.tsx` | ~150 |
| Scene 2 - Transform UI | `src/remotion/video1-hero/Scene2-TransformUI.tsx` | ~310 |
| Scene 3 - Squad Ready | `src/remotion/video1-hero/Scene3-SquadReady.tsx` | ~270 |
| Scene 4 - Hero Loop | `src/remotion/video1-hero/Scene4-HeroLoop.tsx` | ~170 |

### Notes techniques

- Space Grotesk max weight = **700** (pas 800) — utilisé partout
- `@remotion/transitions` + `@remotion/google-fonts` installés
- `TransitionSeries` avec `fade()` pour les transitions entre scènes
- Warning zod (4.x vs 3.22.3) — non bloquant
- Scripts ajoutés au `package.json` : `remotion:preview`, `remotion:render`, `remotion:render:gif`

### Commandes

```bash
npm run remotion:preview      # Ouvrir Remotion Studio (localhost:3000)
npm run remotion:render       # Rendre en MP4 dans out/hero-video.mp4
npx remotion still src/remotion/index.ts HeroVideo out/frame.png --frame=60  # Rendre un frame
```

### Validation visuelle (frames clés rendus)

- Frame 0 : Fond noir (début du fade-in)
- Frame 60 : Chat Discord avec 4 messages visibles
- Frame 160 : Interface Squad Planner avec sidebar + session "Ranked Valorant"
- Frame 300 : 4/5 confirmés avec avatars et badges OUI verts
- Frame 340 : Check-in validé + waveform "Party vocale active"
- Frame 420 : Logo SVG + tagline "Fini les « on verra »"

---

## VIDEO 2 — Product Demo : "30 secondes pour comprendre"

### Specs

| Propriété | Valeur |
|-----------|--------|
| Durée | 35 secondes |
| FPS | 30 |
| Résolution | 1920x1080 (16:9) |
| Usage | Section "Comment ça marche" de la landing |
| Style | Tutoriel premium, mockups UI stylisés, transitions fluides |

### Tableau des Scènes

| Scène | Frames | Overlap | Transition | Fichier | Contenu |
|-------|--------|---------|------------|---------|---------|
| 1 | 0-90 | - | - | Scene1-Intro.tsx | Titre "Comment ça marche" + sous-titre animé |
| 2 | 75-300 | 15 | slideOver | Scene2-CreateSquad.tsx | Step 1 : UI mockup création de squad (nom + jeu) |
| 3 | 280-510 | 20 | slideOver | Scene3-InviteFriends.tsx | Step 2 : Lien partagé, 4 avatars rejoignent un par un |
| 4 | 490-720 | 20 | slideOver | Scene4-PlanDecide.tsx | Step 3 : Créneau proposé, réponses OUI/NON temps réel |
| 5 | 700-930 | 20 | slideOver | Scene5-PlayTogether.tsx | Step 4 : Check-in, party vocale, waveform animée |
| 6 | 910-1050 | 20 | crossfade | Scene6-CTA.tsx | CTA final "Créer ma squad gratuitement" |

### JSON Directives

```json
{
  "project": {
    "title": "Squad Planner — Product Demo",
    "description": "Vidéo de démo animée pour la section Comment ça marche — 4 étapes en 35 secondes",
    "style": "tech"
  },
  "timing": {
    "totalDurationInSeconds": 35,
    "fps": 30,
    "numberOfScenes": 6
  },
  "scenes": [
    {
      "id": "scene_1",
      "name": "Intro Title",
      "startFrame": 0,
      "endFrame": 90,
      "durationInFrames": 90,
      "durationInSeconds": 3,
      "overlap": { "withPrevious": 0, "transitionType": "none" },
      "description": "Fond dark avec gradient mesh subtil indigo/cyan. Le titre 'Comment ça marche' apparaît en Space Grotesk 800 avec un effet de reveal lettre par lettre. Sous-titre 'De la création de squad à la session de jeu en 30 secondes' fade in en Inter 500.",
      "elements": [
        { "type": "text", "content": "Comment ça marche", "image": null, "importance": "primary" },
        { "type": "text", "content": "De la création de squad à la session de jeu en 30 secondes", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_2",
      "name": "Step 1 — Crée ta Squad",
      "startFrame": 75,
      "endFrame": 300,
      "durationInFrames": 225,
      "durationInSeconds": 7.5,
      "overlap": { "withPrevious": 15, "transitionType": "slideOver" },
      "description": "Badge '01' avec glow indigo. UI mockup animé : un champ 'Nom de la squad' se remplit avec 'Les Invaincus' en typewriter. Un dropdown 'Jeu' s'ouvre et sélectionne 'Valorant'. Un bouton 'Créer' pulse puis se clique. Feedback visuel : la squad est créée avec une animation de confetti subtil.",
      "elements": [
        { "type": "text", "content": "01", "image": null, "importance": "primary" },
        { "type": "text", "content": "Crée ta Squad", "image": null, "importance": "primary" },
        { "type": "text", "content": "Les Invaincus", "image": null, "importance": "secondary" },
        { "type": "text", "content": "Valorant", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_3",
      "name": "Step 2 — Invite tes potes",
      "startFrame": 280,
      "endFrame": 510,
      "durationInFrames": 230,
      "durationInSeconds": 7.67,
      "overlap": { "withPrevious": 20, "transitionType": "slideOver" },
      "description": "Badge '02' avec glow cyan. Un lien d'invitation apparaît et se copie (animation clipboard). Puis 4 avatars colorés rejoignent un par un avec un effet de 'pop' visuel — chaque arrivée fait un petit bounce. Compteur de membres : 1... 2... 3... 4. Texte 'Tout le monde au même endroit'.",
      "elements": [
        { "type": "text", "content": "02", "image": null, "importance": "primary" },
        { "type": "text", "content": "Invite tes potes", "image": null, "importance": "primary" },
        { "type": "text", "content": "squad.gg/join/abc123", "image": null, "importance": "secondary" },
        { "type": "text", "content": "Tout le monde au même endroit", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_4",
      "name": "Step 3 — Planifie, décide, confirme",
      "startFrame": 490,
      "endFrame": 720,
      "durationInFrames": 230,
      "durationInSeconds": 7.67,
      "overlap": { "withPrevious": 20, "transitionType": "slideOver" },
      "description": "Badge '03' avec glow gold (#fbbf24). UI : une card 'Session proposée — Vendredi 21h' apparaît. Les 4 avatars ont chacun un badge qui flip : OUI (vert), OUI (vert), NON (rouge), OUI (vert). Score final : '3/4 confirmés — Session maintenue'. Le NON a une petite animation de shake. Texte 'Plus de on verra'.",
      "elements": [
        { "type": "text", "content": "03", "image": null, "importance": "primary" },
        { "type": "text", "content": "Planifie, décide, confirme", "image": null, "importance": "primary" },
        { "type": "text", "content": "Vendredi 21h — Ranked Valorant", "image": null, "importance": "secondary" },
        { "type": "text", "content": "3/4 confirmés — Session maintenue", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_5",
      "name": "Step 4 — Jouez ensemble",
      "startFrame": 700,
      "endFrame": 930,
      "durationInFrames": 230,
      "durationInSeconds": 7.67,
      "overlap": { "withPrevious": 20, "transitionType": "slideOver" },
      "description": "Badge '04' avec glow vert (#34d399). Les 3 avatars confirmés font un check-in (animation checkmark bounce). La party vocale s'active : waveform animée avec 3 barres oscillantes par avatar. Score de fiabilité qui monte : 85%... 90%... 95%. Texte 'Semaine après semaine, ta squad devient fiable'.",
      "elements": [
        { "type": "text", "content": "04", "image": null, "importance": "primary" },
        { "type": "text", "content": "Jouez chaque semaine", "image": null, "importance": "primary" },
        { "type": "text", "content": "Check-in", "image": null, "importance": "secondary" },
        { "type": "text", "content": "Score de fiabilité : 95%", "image": null, "importance": "secondary" }
      ]
    },
    {
      "id": "scene_6",
      "name": "CTA Final",
      "startFrame": 910,
      "endFrame": 1050,
      "durationInFrames": 140,
      "durationInSeconds": 4.67,
      "overlap": { "withPrevious": 20, "transitionType": "crossfade" },
      "description": "Tout disparaît. Logo Squad Planner centré avec glow indigo/vert. Tagline 'Fini les « on verra »' en Space Grotesk 800. Bouton CTA animé 'Créer ma squad gratuitement' avec pulse glow. Fond dark avec mesh gradient subtil.",
      "elements": [
        { "type": "image", "content": null, "image": "favicon.svg", "importance": "primary" },
        { "type": "text", "content": "Fini les « on verra »", "image": null, "importance": "primary" },
        { "type": "text", "content": "Créer ma squad gratuitement", "image": null, "importance": "secondary" }
      ]
    }
  ],
  "design": {
    "colorPalette": {
      "background": "#050506",
      "backgroundElevated": "#0a0a0c",
      "backgroundSurface": "#0f1012",
      "primary": "#6366f1",
      "primaryHover": "#818cf8",
      "secondary": "#06B6D4",
      "success": "#34d399",
      "warning": "#fbbf24",
      "error": "#f87171",
      "textPrimary": "#fafafa",
      "textSecondary": "#a1a1a6",
      "logoPrimary": "#5e6dd2",
      "logoAccent": "#8b93ff",
      "logoGreen": "#4ade80",
      "step1Accent": "#6366f1",
      "step2Accent": "#06B6D4",
      "step3Accent": "#fbbf24",
      "step4Accent": "#34d399"
    },
    "mood": "dark",
    "typography": {
      "headingFont": "Space Grotesk",
      "bodyFont": "Inter",
      "headingWeight": "800",
      "bodyWeight": "500"
    }
  },
  "assets": {
    "images": [
      { "filename": "favicon.svg", "path": "/public/favicon.svg", "usage": "logo", "usedInScenes": ["scene_6"] }
    ]
  },
  "animation": {
    "rhythm": "moderate",
    "transitions": "smooth",
    "intensity": "moderate",
    "overallVibe": "Tutoriel premium avec des mockups UI stylisés — chaque étape est un mini-moment satisfaisant, rythme régulier, transitions fluides entre les steps"
  }
}
```

### Statut : A FAIRE

---

## VIDEO 3 — Social Proof Ad : Clip Vertical TikTok/Reels/Shorts

### Specs

| Propriété | Valeur |
|-----------|--------|
| Durée | 15 secondes |
| FPS | 30 |
| Résolution | 1080x1920 (9:16 vertical) |
| Usage | TikTok, Instagram Reels, YouTube Shorts |
| Style | Énergique, hooks agressifs, montage rapide |

### Tableau des Scènes

| Scène | Frames | Overlap | Transition | Fichier | Contenu |
|-------|--------|---------|------------|---------|---------|
| 1 | 0-75 | - | - | Scene1-Hook.tsx | Hook texte "Tes potes disent toujours 'on verra' ?" — gros texte bold |
| 2 | 60-195 | 15 | wipe | Scene2-PainPoints.tsx | Montage rapide des 4 pain points avec emojis |
| 3 | 180-330 | 15 | zoom | Scene3-ProductReveal.tsx | Reveal produit avec les 3 piliers visuels |
| 4 | 315-450 | 15 | crossfade | Scene4-CTA.tsx | CTA "Crée ta squad gratuitement" + logo |

### JSON Directives

```json
{
  "project": {
    "title": "Squad Planner — Social Proof Ad (Vertical)",
    "description": "Clip vertical 15s pour TikTok/Reels/Shorts — hook viral + reveal produit",
    "style": "energetic"
  },
  "timing": {
    "totalDurationInSeconds": 15,
    "fps": 30,
    "numberOfScenes": 4
  },
  "scenes": [
    {
      "id": "scene_1",
      "name": "Hook",
      "startFrame": 0,
      "endFrame": 75,
      "durationInFrames": 75,
      "durationInSeconds": 2.5,
      "overlap": { "withPrevious": 0, "transitionType": "none" },
      "description": "FORMAT VERTICAL 1080x1920. Fond noir. Texte géant 'Tes potes disent toujours' apparaît du bas. Puis '« on verra »' slam au centre en gros, couleur error (#f87171), avec un shake effect. Le texte '?' apparaît en dernier avec un bounce. Style TikTok — direct, impactant, zéro déchet.",
      "elements": [
        { "type": "text", "content": "Tes potes disent toujours", "image": null, "importance": "secondary" },
        {
          "type": "text", "content": "« on verra »", "image": null, "importance": "primary",
          "effects": [
            { "type": "textZoom", "target": "« on verra »", "startFrame": 20, "endFrame": 45, "zoomScale": 1.3, "easing": "spring" }
          ]
        },
        { "type": "text", "content": "?", "image": null, "importance": "primary" }
      ]
    },
    {
      "id": "scene_2",
      "name": "Pain Points Montage",
      "startFrame": 60,
      "endFrame": 195,
      "durationInFrames": 135,
      "durationInSeconds": 4.5,
      "overlap": { "withPrevious": 15, "transitionType": "wipe" },
      "description": "Montage rapide — chaque pain point apparaît ~1s avec un swipe vertical (style TikTok). Pain 1 : 'On joue ce soir ? -> Personne ne répond' (fond rouge subtil). Pain 2 : 'Je sais pas, on verra -> Rien ne se passe' (fond orange subtil). Pain 3 : 'Session prévue -> 2 sur 5 se connectent' (fond violet subtil). Pain 4 : 'Tout le monde attend que quelqu'un organise' (fond gris). Chaque card slide up et disparaît.",
      "elements": [
        { "type": "text", "content": "On joue ce soir ?\nPersonne ne répond", "image": null, "importance": "primary" },
        { "type": "text", "content": "Je sais pas, on verra\nRien ne se passe", "image": null, "importance": "primary" },
        { "type": "text", "content": "Session prévue\n2 sur 5 se connectent", "image": null, "importance": "primary" },
        { "type": "text", "content": "Tout le monde attend\nque quelqu'un organise", "image": null, "importance": "primary" }
      ]
    },
    {
      "id": "scene_3",
      "name": "Product Reveal — 3 Piliers",
      "startFrame": 180,
      "endFrame": 330,
      "durationInFrames": 150,
      "durationInSeconds": 5,
      "overlap": { "withPrevious": 15, "transitionType": "zoom" },
      "description": "Zoom in depuis le noir. Logo Squad Planner apparaît avec un flash lumineux. Puis les 3 piliers apparaissent empilés verticalement : Pilier 1 : icône micro + 'Party vocale 24/7' (glow vert). Pilier 2 : icône calendrier + 'Planning avec décision' (glow gold). Pilier 3 : icône badge + 'Fiabilité mesurée' (glow rouge). Chaque pilier slide in depuis la droite avec un stagger de 10 frames.",
      "elements": [
        { "type": "image", "content": null, "image": "favicon.svg", "importance": "primary" },
        { "type": "text", "content": "Party vocale 24/7", "image": null, "importance": "primary" },
        { "type": "text", "content": "Planning avec décision", "image": null, "importance": "primary" },
        { "type": "text", "content": "Fiabilité mesurée", "image": null, "importance": "primary" }
      ]
    },
    {
      "id": "scene_4",
      "name": "CTA Final",
      "startFrame": 315,
      "endFrame": 450,
      "durationInFrames": 135,
      "durationInSeconds": 4.5,
      "overlap": { "withPrevious": 15, "transitionType": "crossfade" },
      "description": "Les 3 piliers se fondent. Grand bouton CTA au centre 'Crée ta squad gratuitement' avec pulse glow indigo, style TikTok overlay. Logo Squad Planner en bas. Texte '100% gratuit' en petit sous le bouton. Le bouton pulse en boucle pour les dernières secondes.",
      "elements": [
        {
          "type": "text", "content": "Crée ta squad gratuitement", "image": null, "importance": "primary",
          "effects": [
            { "type": "glowPulse", "target": "Crée ta squad gratuitement", "startFrame": 0, "endFrame": 135, "highlightColor": "#6366f1", "easing": "easeOut" }
          ]
        },
        { "type": "text", "content": "100% gratuit", "image": null, "importance": "secondary" },
        { "type": "image", "content": null, "image": "favicon.svg", "importance": "secondary" }
      ]
    }
  ],
  "design": {
    "colorPalette": {
      "background": "#050506",
      "backgroundElevated": "#0a0a0c",
      "primary": "#6366f1",
      "primaryHover": "#818cf8",
      "secondary": "#06B6D4",
      "success": "#34d399",
      "warning": "#fbbf24",
      "error": "#f87171",
      "textPrimary": "#fafafa",
      "textSecondary": "#a1a1a6",
      "logoPrimary": "#5e6dd2",
      "logoAccent": "#8b93ff",
      "logoGreen": "#4ade80"
    },
    "mood": "dark",
    "typography": {
      "headingFont": "Space Grotesk",
      "bodyFont": "Inter",
      "headingWeight": "900",
      "bodyWeight": "600"
    }
  },
  "assets": {
    "images": [
      { "filename": "favicon.svg", "path": "/public/favicon.svg", "usage": "logo", "usedInScenes": ["scene_3", "scene_4"] }
    ]
  },
  "animation": {
    "rhythm": "fast",
    "transitions": "sharp",
    "intensity": "high",
    "overallVibe": "Énergie TikTok — hook agressif, montage rapide des frustrations, reveal satisfaisant du produit, CTA qui pulse. Pensé pour le scroll-stopping."
  }
}
```

### Statut : A FAIRE

---

## Progression

| Video | Statut | Date début | Date fin |
|-------|--------|------------|----------|
| 1 — Hero Video | TERMINE | 2026-02-11 | 2026-02-11 |
| 2 — Product Demo | A FAIRE | - | - |
| 3 — Social Proof Ad | A FAIRE | - | - |

---

## Notes pour les agents

- **Ne rien mettre en prod** — chaque vidéo doit être validée visuellement avant
- Utiliser le **skill Remotion** (`.claude/skills/remotion/`) pour générer les compositions
- Les mockups UI sont créés en React (pas de screenshots)
- Les fonts Space Grotesk (max weight 700) et Inter sont chargées via `@remotion/google-fonts`
- Le logo SVG est dans `public/favicon.svg` — 4 cercles + hub central
- Toutes les couleurs viennent du design system — centralisées dans `src/remotion/shared/colors.ts`
- La structure Remotion est en place : `src/remotion/` + `remotion.config.ts`
- Packages installés : `remotion`, `@remotion/cli`, `@remotion/player`, `@remotion/transitions`, `@remotion/google-fonts`
- Pour prévisualiser : `npm run remotion:preview` (ouvre localhost:3000)
- Pour rendre un frame : `npx remotion still src/remotion/index.ts <CompositionId> out/frame.png --frame=N`
- Pour rendre la vidéo : `npm run remotion:render`
- Warning zod 4.x vs 3.22.3 : non bloquant mais peut être corrigé avec `npx remotion add zod`

### Architecture pour les vidéos 2 et 3

Créer les fichiers dans `src/remotion/video2-demo/` et `src/remotion/video3-ad/` respectivement.
Ajouter les compositions dans `src/remotion/compositions.tsx`.
Réutiliser les shared components (`colors.ts`, `fonts.ts`).

Pour la Video 3 (format vertical), utiliser `width={1080}` et `height={1920}` dans la Composition.
