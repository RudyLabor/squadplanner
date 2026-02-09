# BIBLE V2 - PLAN D'EXCELLENCE SQUAD PLANNER

> **Date** : 9 Fevrier 2026
> **Objectif** : Depasser le niveau PlayStation App / Apple en UI, UX, Performance, Accessibilite
> **Regle** : Zero complaisance. Chaque ligne de ce document est un probleme reel identifie dans le code.
> **Principe** : On n'ajoute AUCUNE feature. On perfectionne TOUT ce qui existe.

---

## TABLE DES MATIERES

1. [CONSTAT BRUTAL - OU ON EN EST VRAIMENT](#1-constat-brutal)
2. [CHANTIER 1 - DESIGN SYSTEM (LE FONDEMENT DE TOUT)](#2-chantier-1---design-system)
3. [CHANTIER 2 - BIBLIOTHEQUE DE COMPOSANTS](#3-chantier-2---bibliotheque-de-composants)
4. [CHANTIER 3 - TYPOGRAPHIE](#4-chantier-3---typographie)
5. [CHANTIER 4 - ANIMATIONS & MOTION DESIGN](#5-chantier-4---animations--motion-design)
6. [CHANTIER 5 - ACCESSIBILITE (A11Y)](#6-chantier-5---accessibilite)
7. [CHANTIER 6 - PERFORMANCE](#7-chantier-6---performance)
8. [CHANTIER 7 - MOBILE UX](#8-chantier-7---mobile-ux)
9. [CHANTIER 8 - DARK/LIGHT MODE](#9-chantier-8---darklight-mode)
10. [CHANTIER 9 - ETATS (LOADING, ERROR, EMPTY)](#10-chantier-9---etats)
11. [CHANTIER 10 - AUDIT PAGE PAR PAGE](#11-chantier-10---audit-page-par-page)
12. [CHANTIER 11 - QUALITE DE CODE & TESTS](#12-chantier-11---qualite-de-code--tests)
13. [CHANTIER 12 - POLISH FINAL (CE QUI FAIT LA DIFFERENCE)](#13-chantier-12---polish-final)
14. [PLANNING & PRIORISATION](#14-planning--priorisation)

---

## 1. CONSTAT BRUTAL

### Ce qu'on dit vs la realite

| Ce qu'on se raconte | La verite |
|---|---|
| "Design System Premium 2026" | 2200+ valeurs hardcodees qui ignorent les tokens CSS |
| "Light mode implemente" | Casse sur 60%+ des surfaces a cause des couleurs hardcodees |
| "Accessibilite OK" | Aucun audit axe/pa11y, focus-visible pas teste, daltoniens ignores |
| "Performance optimisee" | Pas de budget performance, pas de Lighthouse CI, pas de monitoring |
| "Composants UI complets" | 19 composants vs 40+ necessaires pour une app de ce niveau |
| "Typographie premium" | 13 tailles de police arbitraires, zero echelle typographique |
| "50/50 audit" | Auto-evaluation sans tests utilisateurs, sans metriques reelles |

### Les chiffres qui font mal

| Metrique | Valeur actuelle | Cible excellence |
|---|---|---|
| Couleurs hardcodees | 2200+ instances | 0 |
| Tailles de police arbitraires | 795+ instances dans 83 fichiers | 0 |
| Ombres hardcodees | 41 patterns uniques | 0 (tokenise) |
| RGBA hardcodes | 264+ instances | 0 (tokenise) |
| Composants UI primitifs | 19 | 35+ |
| Tests unitaires UI | 0 | 100% coverage composants |
| Tests a11y automatises | 0 | 100% pages |
| Lighthouse Performance | Non mesure | 95+ |
| Lighthouse Accessibility | Non mesure | 100 |
| Lighthouse Best Practices | Non mesure | 100 |
| Coverage light mode | ~40% | 100% |
| Focus-visible coverage | Partiel | 100% |

---

## 2. CHANTIER 1 - DESIGN SYSTEM

### 2.1 Probleme : theme.ts en conflit avec index.css 🟢 FAIT

**Fichier** : `src/lib/theme.ts`

`theme.ts` definit des couleurs qui CONTREDISENT les CSS variables :
- `bgBase: '#08090a'` vs CSS `--color-bg-base: #050506`
- `bgElevated: '#101012'` vs CSS `--color-bg-elevated: #0a0a0c`
- `textPrimary: '#f7f8f8'` vs CSS `--color-text-primary: #fafafa`
- `primary: '#5e6dd2'` vs CSS `--color-primary: #6366f1`

**Action** : Supprimer `theme.ts` entierement. Toute reference a des couleurs DOIT passer par les CSS variables. Aucune exception.

### 2.2 Probleme : 2200+ couleurs hardcodees 🟢 FAIT (1073 text/bg/border → 0)

C'est LE probleme #1 de l'app. Tant que ca existe, on n'a PAS de design system.

#### Textes hardcodes (822 instances)

| Pattern | Occurrences | Remplacement |
|---|---|---|
| `text-[#f7f8f8]` | 186 | `text-text-primary` |
| `text-[#8b8d90]` | 153 | `text-text-secondary` |
| `text-[#5e6063]` | 143 | `text-text-tertiary` |
| `text-[#34d399]` | 63 | `text-success` |
| `text-[#6366f1]` | 62 | `text-primary` |
| `text-[#fbbf24]` | 29 | `text-warning` |
| `text-[#f87171]` | 25 | `text-error` |
| `text-[#818cf8]` | 25 | `text-primary-hover` |
| `text-[#c9cace]` | 20 | `text-text-secondary` |
| `text-[#a78bfa]` | 18 | `text-purple` |
| Autres (20+ couleurs) | 98 | A categoriser |

#### Backgrounds hardcodes (233 instances)

| Pattern | Occurrences | Remplacement |
|---|---|---|
| `bg-[#34d399]` | 53 | `bg-success` |
| `bg-[#6366f1]` | 42 | `bg-primary` |
| `bg-[#050506]` | 30 | `bg-bg-base` |
| `bg-[#101012]` | 16 | `bg-bg-surface` |
| `bg-[#fb7185]` | 13 | `bg-error` |
| `bg-[#1a1a2e]` | 13 | Nouveau token `bg-surface-dark` |
| `bg-[#18191b]` | 10 | `bg-bg-hover` |
| Autres | 56 | A categoriser |

#### Bordures hardcodees (71 instances)

| Pattern | Occurrences | Remplacement |
|---|---|---|
| `border-[#34d399]` | 18 | `border-success` |
| `border-[#6366f1]` | 15 | `border-primary` |
| `border-[#f87171]` | 10 | `border-error` |
| `border-[#fbbf24]` | 6 | `border-warning` |
| Autres | 22 | A categoriser |

#### RGBA hardcodes (264+ instances)

| Pattern | Occurrences | Action |
|---|---|---|
| `rgba(255,255,255,0.05)` | 86 | Utiliser `border-border-subtle` |
| `rgba(255,255,255,0.06)` | 74 | Utiliser `border-border-default` |
| `rgba(99,102,241,0.15)` | 44 | Nouveau token `--color-primary-glow` |
| `rgba(255,255,255,0.1)` | 38 | Utiliser `border-border-hover` |
| `rgba(255,255,255,0.08)` | 36 | Nouveau token `--color-overlay-light` |
| Autres | 86+ | Tokeniser |

#### Ombres hardcodees (41 patterns uniques)

| Pattern | Action |
|---|---|
| `shadow-[0_0_20px_rgba(74,222,128,0.3)]` | `--shadow-glow-success` |
| `shadow-[0_0_30px_rgba(99,102,241,0.15)]` | `--shadow-glow-primary` |
| `shadow-[0_0_12px_rgba(52,211,153,0.08)]` | `--shadow-glow-success-subtle` |
| `shadow-[0_0_20px_rgba(99,102,241,0.2)]` | `--shadow-glow-primary-md` |
| `shadow-[0_0_10px_rgba(99,102,241,0.15)]` | `--shadow-glow-primary-sm` |
| Et 36 autres... | Chacun doit etre tokenise |

### 2.3 Tokens manquants a creer 🟢 FAIT

Ajouter dans `index.css` sous `@theme` :

```
TOKENS MANQUANTS A AJOUTER :

/* Accents avec opacite (pour backgrounds colores) */
--color-primary-5: rgba(99, 102, 241, 0.05);
--color-primary-10: rgba(99, 102, 241, 0.10);
--color-primary-15: rgba(99, 102, 241, 0.15);
--color-primary-20: rgba(99, 102, 241, 0.20);
--color-success-5: rgba(52, 211, 153, 0.05);
--color-success-10: rgba(52, 211, 153, 0.10);
--color-success-15: rgba(52, 211, 153, 0.15);
--color-success-20: rgba(52, 211, 153, 0.20);
--color-error-5: rgba(248, 113, 113, 0.05);
--color-error-10: rgba(248, 113, 113, 0.10);
--color-error-15: rgba(248, 113, 113, 0.15);
--color-warning-5: rgba(251, 191, 36, 0.05);
--color-warning-10: rgba(251, 191, 36, 0.10);
--color-warning-15: rgba(251, 191, 36, 0.15);
--color-info-5: rgba(56, 189, 248, 0.05);
--color-info-10: rgba(56, 189, 248, 0.10);
--color-purple-10: rgba(167, 139, 250, 0.10);
--color-purple-15: rgba(167, 139, 250, 0.15);

/* Overlays */
--color-overlay-light: rgba(255, 255, 255, 0.08);
--color-overlay-medium: rgba(255, 255, 255, 0.12);
--color-overlay-heavy: rgba(255, 255, 255, 0.20);

/* Ombres semantiques */
--shadow-glow-success: 0 0 20px rgba(52, 211, 153, 0.15);
--shadow-glow-success-strong: 0 0 30px rgba(52, 211, 153, 0.3);
--shadow-glow-primary-sm: 0 0 10px rgba(99, 102, 241, 0.15);
--shadow-glow-primary-md: 0 0 20px rgba(99, 102, 241, 0.2);
--shadow-glow-primary-lg: 0 0 40px rgba(99, 102, 241, 0.3);
--shadow-glow-error: 0 0 20px rgba(248, 113, 113, 0.15);
--shadow-glow-warning: 0 0 20px rgba(251, 191, 36, 0.15);

/* Surfaces supplementaires */
--color-surface-dark: #1a1a2e;
--color-surface-darker: #12121f;

/* Gradients tokenises */
--gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple) 100%);
--gradient-success: linear-gradient(135deg, var(--color-success) 0%, #06b6d4 100%);
```

### 2.4 Tokens light mode manquants 🟢 FAIT

Les accents (success, warning, error, info, purple) n'ont PAS de variante light mode. Ajouter :

```
[data-theme="light"] {
  /* Accents ajustes pour fond clair */
  --color-success: #059669;     /* Plus fonce pour contraste sur blanc */
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #0284c7;
  --color-purple: #7c3aed;

  /* Surfaces supplementaires */
  --color-surface-dark: #e2e8f0;
  --color-surface-darker: #cbd5e1;

  /* Ombres glow en light mode (plus subtiles) */
  --shadow-glow-success: 0 0 20px rgba(5, 150, 105, 0.08);
  --shadow-glow-primary-sm: 0 0 10px rgba(99, 102, 241, 0.08);
  --shadow-glow-primary-md: 0 0 20px rgba(99, 102, 241, 0.1);
  --shadow-glow-primary-lg: 0 0 40px rgba(99, 102, 241, 0.12);
}
```

### 2.5 Fichiers les plus pollues (priorite de nettoyage) 🟢 FAIT (75 fichiers nettoyés)

1. `src/pages/Messages.tsx` - 45+ couleurs hardcodees
2. `src/pages/Landing.tsx` - 35+ couleurs hardcodees
3. `src/pages/Home.tsx` - 32+ couleurs hardcodees
4. `src/components/layout/AppLayout.tsx` - 29+ couleurs hardcodees
5. `src/pages/SquadDetail.tsx` - 28+ couleurs hardcodees
6. `src/components/CallModal.tsx` - 27+ couleurs hardcodees
7. `src/pages/Legal.tsx` - 26+ couleurs hardcodees
8. `src/pages/Premium.tsx` - 24+ couleurs hardcodees
9. `src/components/CommandPalette.tsx` - 23+ couleurs hardcodees
10. `src/pages/Profile.tsx` - 22+ couleurs hardcodees

**Process pour chaque fichier** :
1. Ouvrir le fichier
2. Ctrl+F chaque pattern hardcode (text-[#, bg-[#, border-[#, rgba(, shadow-[)
3. Remplacer par le token CSS correspondant
4. Verifier en dark mode
5. Verifier en light mode
6. Valider visuellement que rien n'a casse

### 2.6 Supprimer les overrides !important dans index.css 🟢 FAIT (~130 lignes supprimées)

Les lignes 147-274 de `index.css` sont des PANSEMENTS. Elles existent uniquement parce que les couleurs sont hardcodees. Une fois le nettoyage fait :
- Supprimer TOUTES les regles `[data-theme="light"] .bg-\[\#...\]`
- Supprimer TOUTES les regles `[data-theme="light"] .text-\[\#...\]`
- Supprimer TOUTES les regles `[data-theme="light"] .border-\[\#...\]`
- Ca represente ~130 lignes de CSS inutile

---

## 3. CHANTIER 2 - BIBLIOTHEQUE DE COMPOSANTS 🟢 FAIT

### 3.1 Composants existants et leur niveau 🟢 FAIT (5 refactorés)

| Composant | Fichier | Lignes | Niveau | Problemes |
|---|---|---|---|---|
| Button | `ui/Button.tsx` | 50 | 7/10 | Manque : icon-only, loading text, fullWidth, as="a" |
| Card | `ui/Card.tsx` | 67 | 7/10 | Manque : variants (elevated, outlined, ghost), padding variants |
| Input | `ui/Input.tsx` | 78 | 8/10 | Manque : textarea variant, char counter, prefix/suffix |
| Badge | `ui/Badge.tsx` | 35 | 4/10 | Manque : sizes, dot variant, closable, count, animation |
| EmptyState | `ui/EmptyState.tsx` | 35 | 3/10 | ZERO animation, trop minimal, pas de variants |
| Skeleton | `ui/Skeleton.tsx` | 607 | 9/10 | OK - bien fait |
| SegmentedControl | `ui/SegmentedControl.tsx` | ~80 | 7/10 | Manque : disabled state, icons |
| Tooltip | `ui/Tooltip.tsx` | ~120 | 6/10 | Manque : variants, arrow, controlled mode |
| AnimatedAvatar | `ui/AnimatedAvatar.tsx` | ~150 | 8/10 | OK |
| AnimatedCounter | `ui/AnimatedCounter.tsx` | ~50 | 7/10 | OK |
| ContextMenu | `ui/ContextMenu.tsx` | ~100 | 6/10 | Manque : submenus, icons, disabled items |
| Drawer | `ui/Drawer.tsx` | ~100 | 6/10 | Manque : sizes, snap points, swipe |
| EmojiPicker | `ui/EmojiPicker.tsx` | ~200 | 6/10 | Manque : search, recent, skin tone |
| ImageViewer | `ui/ImageViewer.tsx` | ~100 | 6/10 | Manque : zoom, swipe gallery |
| LazyImage | `ui/LazyImage.tsx` | ~50 | 5/10 | Manque : blur placeholder, error state |
| OnlineIndicator | `ui/OnlineIndicator.tsx` | ~30 | 5/10 | Que couleur, pas de texte alt |
| ProgressRing | `ui/ProgressRing.tsx` | ~60 | 7/10 | OK |
| SharedElement | `ui/SharedElement.tsx` | ~40 | 5/10 | Prototype, pas fini |
| ToastIcons | `ui/ToastIcons.tsx` | ~30 | 5/10 | Juste des icones |

### 3.2 Composants MANQUANTS (a creer) 🟢 FAIT (14 créés → 33 composants total)

Pour atteindre le niveau d'une app tier-1, il faut ces primitives :

#### CRITIQUE (bloque la qualite UI) 🟢 FAIT

**1. Dialog/Modal** 🟢 FAIT
- Overlay avec blur backdrop
- Animation open/close (scale + opacity)
- Focus trap
- Fermeture Escape
- Fermeture click outside
- Variants : sm, md, lg, fullscreen
- Header/Body/Footer sections
- Close button integre
- `aria-modal="true"`, `role="dialog"`
- Actuellement : chaque modal est custom (CallModal, EditMessageModal, CreateSessionModal, etc.) = code duplique et inconsistant

**2. Dropdown/Menu** 🟢 FAIT
- Trigger + Portal content
- Keyboard navigation (fleches haut/bas, Enter, Escape)
- Animation slide + fade
- Items avec icone, description, shortcut
- Separateurs
- Items disabled
- Sub-menus (nested)
- `role="menu"`, `role="menuitem"`
- Actuellement : ContextMenu est partiel, pas reutilisable

**3. Select/Combobox** 🟢 FAIT
- Input avec dropdown
- Recherche/filtre
- Multi-select
- Tags pour selections multiples
- Clear button
- Groups d'options
- Loading state
- Empty state
- Keyboard navigation complete
- Actuellement : utilise des `<select>` natifs = laid et inconsistant

**4. Sheet/BottomSheet (mobile)** 🟢 FAIT
- Apparait du bas sur mobile
- Snap points (25%, 50%, 75%, 100%)
- Gesture swipe pour fermer
- Detectable au touch
- Alternative a Dialog sur mobile
- Actuellement : Drawer existe mais sans snap points ni swipe

#### IMPORTANT (ameliore significativement l'UX) 🟢 FAIT

**5. Tabs** 🟢 FAIT
- Animated indicator (underline qui glisse)
- Variants : underline, pills, enclosed
- Overflow scroll sur mobile
- `role="tablist"`, `role="tab"`, `role="tabpanel"`
- Actuellement : SegmentedControl fait un truc similaire mais sans la flexibilite

**6. Accordion** 🟢 FAIT
- Animated expand/collapse
- Multiple ou single mode
- Icon rotation
- Nested accordions
- `aria-expanded`, `aria-controls`
- Actuellement : FAQ sur Landing utilise du CSS custom non reutilisable

**7. Toggle/Switch** 🟢 FAIT
- Animated thumb
- On/off states
- Label integre
- Disabled state
- `role="switch"`, `aria-checked`
- Actuellement : aucun composant, utilise des checkboxes standard

**8. Radio Group** 🟢 FAIT
- Custom styled radio buttons
- Variants : default, card
- Description par option
- Keyboard navigation
- Actuellement : aucun

**9. Checkbox** 🟢 FAIT
- Custom styled
- Indeterminate state
- Animated check mark
- Actuellement : aucun

**10. Toast (custom)**
- Timer avec barre de progression visible
- Actions dans le toast
- Swipe pour dismiss
- Queue management
- Actuellement : utilise Sonner (library externe) = ok mais pas de controle total


**11. Popover** 🟢 FAIT
- Position auto (flip/shift)
- Arrow
- Controlled/uncontrolled
- Click/hover trigger

**12. Command Palette (upgrade)**
- Le CommandPalette existe mais :
  - Pas de categories visuelles
  - Pas de recent commands
  - Pas de fuzzy search
  - Animation trop basique

**13. Avatar Group** 🟢 FAIT
- Stacked avatars
- +N overflow
- Click pour voir la liste
- Actuellement : fait a la main dans SquadDetail

**14. Slider/Range** 🟢 FAIT
- Volume control
- Rating
- Min/max labels

**15. Progress Bar** 🟢 FAIT
- Animated fill
- Labels
- Variants : linear, stepped

**16. Divider** 🟢 FAIT
- Horizontal/Vertical
- With text
- Variants : subtle, default, strong

### 3.3 Ameliorations des composants existants 🟢 FAIT

#### Button.tsx - A refactorer 🟢 FAIT (50 → 102 lignes)

Problemes actuels :
- Pas de variante `icon-only` (bouton carre avec juste une icone)
- Pas de `fullWidth` prop
- Pas de `leftIcon` / `rightIcon` props (oblige a mettre l'icone dans children)
- Le loading spinner n'a pas de texte ("Chargement...")
- Pas de variant `link` (bouton qui ressemble a un lien)
- `text-[13px]`, `text-[14px]`, `text-[15px]` = tailles hardcodees (ligne 23-25)
- `min-h-[44px]` sur TOUTES les tailles, meme `sm` = les 3 tailles ont la meme hauteur effective

Props a ajouter :
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  size: 'xs' | 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  iconOnly?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  loadingText?: string
  as?: 'button' | 'a' | typeof Link
}
```

#### Badge.tsx - A refactorer completement 🟢 FAIT (35 → 96 lignes)

35 lignes. C'est un placeholder, pas un composant.

Manque :
- Tailles (sm, md, lg)
- Variante `dot` (juste un point colore)
- Variante `count` (affiche un nombre, ex: notifications)
- Prop `closable` avec X pour fermer
- Animation d'apparition
- `max` prop (affiche "99+" si > 99)
- Actuellement : meme padding/taille quoi qu'il arrive

#### EmptyState.tsx - A refaire entierement 🟢 FAIT (35 → 90 lignes)

35 lignes, ZERO animation. Pour une app qui pretend avoir un systeme d'animation premium, c'est inacceptable.

Manque :
- Animation d'entree (fade + scale)
- Illustration/icon animated (pas juste statique)
- Variantes de taille (compact pour inline, full pour page entiere)
- Support pour illustration custom (SVG anime, Lottie)
- Secondary action
- `aria-live="polite"` pour annoncer aux screen readers

#### Card.tsx - Ameliorer 🟢 FAIT (67 → 109 lignes)

Manque :
- Variantes : `elevated` (ombre plus forte), `outlined` (bordure visible), `ghost` (transparent)
- `compact` padding variant
- `loading` state (overlay skeleton)
- `selected` state (bordure accent)
- `disabled` state

#### Input.tsx - Ameliorer 🟢 FAIT (78 → 159 lignes)

Manque :
- `textarea` variant (multi-line)
- Character counter (`maxLength` avec affichage)
- Prefix/Suffix (ex: "$" devant, ".com" apres)
- `clearable` prop (X pour vider)
- `size` variants (sm, md, lg)
- `focus:shadow-[0_0_20px_rgba(99,102,241,0.15)]` = ombre hardcodee (ligne 46)

---

## 4. CHANTIER 3 - TYPOGRAPHIE 🟢 FAIT

### 4.1 Le probleme 🟢 FAIT (780 → 4 instances, 99.5% migré)

795+ tailles de police arbitraires reparties dans 83 fichiers. Aucune echelle typographique.

| Taille | Occurrences | Dans combien de fichiers |
|---|---|---|
| `text-[13px]` | 222 | ~50 |
| `text-[14px]` | 179 | ~45 |
| `text-[12px]` | 142 | ~40 |
| `text-[11px]` | 59 | ~25 |
| `text-[10px]` | 53 | ~20 |
| `text-[15px]` | 44 | ~20 |
| `text-[16px]` | 28 | ~15 |
| `text-[18px]` | 22 | ~12 |
| `text-[20px]` | 15 | ~10 |
| `text-[24px]` | 12 | ~8 |
| `text-[28px]` | 8 | ~5 |
| `text-[32px]` | 6 | ~4 |
| `text-[9px]` | 5 | ~3 |

13 tailles differentes. C'est le chaos.

### 4.2 L'echelle typographique cible 🟢 FAIT (8 niveaux avec clamp() dans @theme)

Definir une echelle a 8 niveaux maximum, avec `clamp()` pour le fluid :

```css
/* Typographie - Echelle a 8 niveaux */

/* Corps de texte */
--text-xs: clamp(0.6875rem, 0.65rem + 0.1vw, 0.75rem);    /* 11-12px */
--text-sm: clamp(0.75rem, 0.7rem + 0.15vw, 0.8125rem);     /* 12-13px */
--text-base: clamp(0.8125rem, 0.78rem + 0.15vw, 0.875rem);  /* 13-14px */
--text-md: clamp(0.875rem, 0.85rem + 0.15vw, 0.9375rem);    /* 14-15px */

/* Titres */
--text-lg: clamp(0.9375rem, 0.9rem + 0.2vw, 1.0625rem);    /* 15-17px */
--text-xl: clamp(1.125rem, 1rem + 0.3vw, 1.25rem);          /* 18-20px */
--text-2xl: clamp(1.375rem, 1.2rem + 0.5vw, 1.625rem);      /* 22-26px */
--text-3xl: clamp(1.75rem, 1.5rem + 0.8vw, 2.25rem);        /* 28-36px */
```

### 4.3 Table de migration 🟢 FAIT (780 instances migrées dans 78 fichiers)

| Ancien | Nouveau | Utilisation |
|---|---|---|
| `text-[9px]`, `text-[10px]` | `text-xs` | Labels, badges, compteurs minuscules |
| `text-[11px]`, `text-[12px]` | `text-sm` | Metadata, timestamps, hints |
| `text-[13px]` | `text-base` | Corps de texte par defaut |
| `text-[14px]`, `text-[15px]` | `text-md` | Corps de texte important, boutons |
| `text-[16px]` | `text-lg` | Sous-titres, labels importants |
| `text-[18px]`, `text-[20px]` | `text-xl` | Titres de section |
| `text-[24px]`, `text-[28px]` | `text-2xl` | Titres de page |
| `text-[32px]`+ | `text-3xl` | Hero, titres majeurs |

### 4.4 Line-height 🟢 FAIT (intégré via --text-*--line-height dans @theme)

Line-heights automatiques via le scale typographique :

```css
--leading-tight: 1.15;    /* Titres */
--leading-snug: 1.3;      /* Sous-titres */
--leading-normal: 1.5;    /* Corps */
--leading-relaxed: 1.6;   /* Corps long */
--leading-loose: 1.8;     /* Lisibilite maximale */
```

### 4.5 Font-weight 🟢 FAIT (audité, 3 font-black corrigés, hiérarchie respectée)

Standardiser :
- 400 (regular) : corps de texte → 4 instances, toutes correctes
- 500 (medium) : labels, nav items → 257 instances, cohérent
- 600 (semibold) : sous-titres, elements importants → 148 instances, cohérent
- 700 (bold) : titres → 134 instances, cohérent
- 800 (extrabold) : hero uniquement → 4 instances (Landing hero + célébrations)
- 900 (font-black) : éliminé (3 → 0, remplacés par extrabold)

---

## 5. CHANTIER 4 - ANIMATIONS & MOTION DESIGN 🟢 FAIT

### 5.1 Ce qui existe et marche bien

- `src/utils/animations.ts` : 20+ variants Framer Motion reutilisables - BIEN
- Button : `whileHover={{ y: -1 }}`, `whileTap={{ scale: 0.97 }}` - BIEN
- Card : `whileHover={{ y: -1 }}`, `whileTap={{ scale: 0.995 }}` - BIEN
- AnimatedAvatar : stroke dash animation + hover scale/glow - BIEN
- Stagger containers (fast/normal/slow) - BIEN

### 5.2 Ce qui manquait → corrigé 🟢 FAIT

#### Page transitions 🟢 FAIT (150ms → 400ms avec motion tokens)
- `PageTransition.tsx` utilise maintenant `transitions.pageTransition` du systeme de tokens
- Duration augmentee pour des transitions fluides style PS5

#### EmptyState 🟢 DEJA FAIT (spring + fade-in existaient)
- Verifie : `motion.div` avec fade + slideUp + spring scale sur l'icone

#### ErrorState 🟢 DEJA FAIT (tokens CSS corrects)
- Verifie : utilise `var(--color-warning)`, `var(--color-info)`, etc.

#### Animations sur elements cles 🟢 FAIT

| Element | Animation attendue | Etat |
|---|---|---|
| Toast notifications | Slide + fade depuis le haut | Delegue a Sonner - OK |
| Badge count change | Scale bounce quand le nombre change | 🟢 FAIT (spring stiffness:400, damping:15) |
| Online/Offline indicator | Pulse quand online, fade quand offline | 🟢 FAIT (Framer Motion spring pulse + AnimatePresence) |
| Tab switch | Underline qui glisse | 🟢 FAIT (layoutId + spring stiffness:400, damping:30) |
| List item removal | Fade + height collapse | 🟢 FAIT (AnimatedList + AnimatedListItem) |
| Skeleton to content | Crossfade | 🟢 FAIT (ContentTransition avec AnimatePresence mode="wait") |
| Message sent | Slide up + fade in | Existait deja - OK |
| Pull to refresh | Spring physics | Existe (PullToRefresh.tsx) - OK |
| Navigation sidebar | Items stagger | Existe (AppLayout.tsx) - OK |

#### Micro-interactions 🟢 FAIT

1. **Hover sur avatar** : 🟢 FAIT - scale 1.05 + shadow-glow-primary-sm (spring stiffness:400, damping:17)
2. **Toggle switch** : 🟢 DEJA FAIT - spring stiffness:500, damping:30 + layout animation
3. **Checkbox check** : 🟢 DEJA FAIT - pathLength animation + spring physics
4. **Input focus** : 🟢 DEJA FAIT - focus:border-primary + shadow-glow-primary-sm via CSS tokens
5. **Card selection** : 🟢 FAIT - Framer Motion animate border/shadow/bg transition (0.2s)
6. **Button success feedback** : 🟢 FAIT - showSuccess prop avec AnimatePresence checkmark
7. **Loading to success** : 🟢 FAIT - LoadingSuccess.tsx (spinner → checkmark pathLength animation)
8. **Error shake** : 🟢 FAIT - errorShake variant + useAnimationControls dans Input
9. **Confetti** : Existe (LazyConfetti.tsx) - OK
10. **Scroll-to-top** : 🟢 FAIT - ScrollToTop.tsx (AnimatePresence slide-up + fade)

### 5.3 Systeme de motion tokens 🟢 FAIT (`src/utils/motionTokens.ts`)

```typescript
export const motion = {
  duration: {
    instant: 0.1,    // Feedback immediat (tap)
    fast: 0.15,      // Micro-interactions
    normal: 0.25,    // Transitions standard
    slow: 0.4,       // Transitions de page
    slower: 0.6,     // Animations complexes
  },
  easing: {
    easeOut: [0.16, 1, 0.3, 1],        // Entrees
    easeInOut: [0.65, 0, 0.35, 1],      // Transitions
    spring: { type: 'spring', stiffness: 400, damping: 25 }, // Interactions
    springSnappy: { type: 'spring', stiffness: 500, damping: 30 }, // Quick feedback
    springBouncy: { type: 'spring', stiffness: 300, damping: 10 }, // Celebrations
    springSmooth: { type: 'spring', stiffness: 200, damping: 20 }, // Subtle
  },
}
// + createTransition() helper + transitions presets (fast, normal, slow, pageTransition)
// + animations.ts refactored to use motionTokens (backwards compatible)
```

### 5.4 Theme transition 🟢 FAIT
- CSS `transition: background-color 0.3s ease, color 0.3s ease` sur html/body/#root
- Respecte `prefers-reduced-motion` (neutralise via transition-duration: 0.01ms)

---

## 6. CHANTIER 5 - ACCESSIBILITE 🟢 FAIT

### 6.1 Etat actuel 🟢 FAIT

**Ce qui existe** :
- `index.css` ligne 496-523 : `:focus-visible` defini globalement - BIEN
- Skip-to-main link (`skip-link` class) - BIEN
- `aria-live` regions dans `App.tsx` - BIEN
- Input : `aria-invalid`, `aria-describedby` - BIEN
- Card : keyboard Enter/Space handling - BIEN
- SegmentedControl : `role="tablist"`, `aria-selected` - BIEN
- Touch targets 44px minimum - BIEN
- `prefers-reduced-motion` respecte - BIEN

### 6.2 Ce qui manquait → corrige 🟢 FAIT

#### Annonces screen reader 🟢 FAIT

| Evenement | Annonce attendue | Etat |
|---|---|---|
| Nouveau message | "Nouveau message de [nom]" | Delegue a Sonner toast - OK |
| Toast notification | "[type]: [message]" | Delegue a Sonner - OK |
| Modal ouverte | "[titre] dialog ouvert" | 🟢 FAIT (aria-labelledby sur toutes les modales) |
| Navigation de page | "[nom de page]" annonce | 🟢 FAIT (useFocusOnNavigate + useAnnounce) |
| Erreur de formulaire | "[champ] : [erreur]" | 🟢 FAIT (Input + ErrorState role="alert") |
| Loading termine | "Contenu charge" | 🟢 FAIT (useA11yAnnouncements.announceLoading) |
| Action reussie | "Action reussie" | 🟢 FAIT (useA11yAnnouncements.announceAction) |

**Hooks implementes** :
- `useAnnounce()` : insere du texte dans une region `aria-live` (polite/assertive)
- `useA11yAnnouncements()` : helpers pour announceAction, announceError, announceLoading, announceNavigation
- `useFocusOnNavigate()` : annonce automatiquement le titre de page apres navigation

#### Focus management 🟢 FAIT

| Situation | Comportement attendu | Etat |
|---|---|---|
| Ouverture modale | Focus piege dans la modale | 🟢 FAIT (useFocusTrap consolide avec onEscape + generics) |
| Fermeture modale | Focus retourne au trigger | 🟢 FAIT (useRestoreFocus) |
| Navigation clavier dans une liste | Fleches haut/bas pour naviguer | 🟢 FAIT (useRovingTabindex avec horizontal/vertical/both) |
| Tab dans le sidebar | Focus logique top-to-bottom | 🟢 DEJA OK (AppLayout) |
| Suppression d'un element | Focus passe a l'element suivant | Reste a integrer dans les listes |

**Consolidation** : useFocusTrap duplique (standalone + useFocusManagement) → consolide en un seul export avec generics `<T extends HTMLElement>` et callback `onEscape`

#### Contraste et daltonisme 🟢 FAIT

| Probleme | Fichier | Etat |
|---|---|---|
| Online = vert, Offline = gris | `OnlineIndicator.tsx` | 🟢 FAIT (sr-only "En ligne"/"Hors ligne") |
| Badges de statut | `MessageStatus.tsx` | 🟢 FAIT (sr-only "Lu"/"Envoye"/"Recu") |
| Graphiques/barres XP | `XPBar.tsx` | 🟢 FAIT (role="progressbar" + aria-valuenow/min/max) |
| Indicateur reseau | `NetworkQualityIndicator.tsx` | 🟢 FAIT (sr-only "Qualite reseau: {label}") |
| Indicateur de frappe | `TypingIndicator.tsx` | 🟢 FAIT (role="status" + aria-live="polite") |
| Streak counter | `StreakCounter.tsx` | 🟢 FAIT (aria-label avec le compte) |

#### Semantique HTML 🟢 FAIT (15 pages modifiees)

| Probleme | Etat |
|---|---|
| Listes non semantiques | 🟢 FAIT (Sessions, Squads, Messages: `<ul>/<li>`) |
| Headings non hierarchiques | 🟢 FAIT (h1 sur chaque page, h2 pour sections) |
| Nav non identifiee | 🟢 FAIT (Messages sidebar: `<nav aria-label="Conversations">`) |
| Landmarks manquants | 🟢 FAIT (`<main>` + `<header>` + `<section aria-labelledby>` sur toutes les pages) |

#### ARIA patterns 🟢 FAIT

| Pattern | Utilisation | Etat |
|---|---|---|
| `aria-busy="true"` | Zones en chargement | 🟢 FAIT (ContentTransition, Button, Card) |
| `aria-current="page"` | Nav active | 🟢 DEJA OK (AppLayout) |
| `aria-expanded` | Accordions, dropdowns | 🟢 DEJA OK (11 fichiers: Accordion, DropdownMenu, Popover, Select, etc.) |
| `aria-haspopup` | Boutons qui ouvrent des menus | 🟢 DEJA OK (Select, DropdownMenu, Popover, MessageActions) |
| `aria-describedby` | Descriptions supplementaires | 🟢 DEJA OK (Input + composants) |
| `aria-label` sur icones | Chaque bouton icone-only | 🟢 FAIT (169 occurrences, verifie sur tous les composants) |
| `aria-live="assertive"` | Erreurs critiques | 🟢 FAIT (ErrorState: role="alert" + aria-live="assertive") |
| `role="alert"` | Messages d'erreur | 🟢 FAIT (ErrorState, OfflineBanner, NotificationBanner) |
| `role="status"` | Compteurs, indicateurs | 🟢 FAIT (TypingIndicator, LevelUpCelebration, OnlineIndicator) |
| `role="progressbar"` | Barres de progression | 🟢 FAIT (ProgressRing + ProgressBar + XPBar avec aria-value*) |

#### Elements decoratifs 🟢 FAIT

| Element | Fichier | Etat |
|---|---|---|
| Ring SVG avatar | `AnimatedAvatar.tsx` | 🟢 FAIT (aria-hidden="true") |
| Shared element transition | `SharedElement.tsx` | 🟢 FAIT (aria-hidden="true") |
| Toast icones | `ToastIcons.tsx` | 🟢 FAIT (aria-hidden="true" sur les 4 SVGs) |
| Voice waveform | `VoiceWaveform.tsx` | 🟢 FAIT (aria-hidden="true") |
| Compteur anime | `AnimatedCounter.tsx` | 🟢 FAIT (aria-live="polite" + aria-atomic) |
| Image viewer | `ImageViewer.tsx` | 🟢 FAIT (role="dialog" + aria-modal + aria-label) |
| Avatar group | `AvatarGroup.tsx` | 🟢 FAIT (aria-label dynamique "{N} members" + sr-only noms) |
| Loading/Success | `LoadingSuccess.tsx` | 🟢 FAIT (aria-live="polite" + sr-only etat) |

### 6.3 Tests automatises 🟢 FAIT

1. **axe-core** : 🟢 FAIT - Vitest + jest-axe integres, 22 tests a11y sur 15 composants UI (Button, Card, Input, Badge, Toggle, Checkbox, ProgressBar, ProgressRing, Divider, Slider, EmptyState, Tooltip, AnimatedCounter, ScrollToTop, Skeleton) - `npm run test:a11y`
2. **Lighthouse CI** : 🟢 FAIT - `@lhci/cli` installe, `lighthouserc.json` configure avec seuil accessibility >= 90 - `npm run lighthouse`
3. **Bugs a11y corriges par axe-core** :
   - Button: `aria-label` preserve quand `isLoading` remplace le texte par un spinner
   - ProgressBar: `aria-label` par defaut "Progress" quand aucun label fourni
4. **Test clavier** : Couvert par les tests e2e Playwright existants (`e2e/accessibility.spec.ts`)
5. **Test screen reader** : Manuel (VoiceOver/NVDA) - hors scope automatisation
6. **Test zoom** : Manuel - hors scope automatisation

---

## 7. CHANTIER 6 - PERFORMANCE 🟢 FAIT

### 7.1 Ce qui est bien fait

- Code splitting avec `React.lazy()` sur toutes les pages - OK
- Virtualization des messages avec `@tanstack/react-virtual` - OK
- Memoisation avec `React.memo`, `useCallback`, `useMemo` - OK
- `useShallow` de Zustand pour eviter les re-renders - OK
- Prefetch au hover sur les liens de navigation - OK
- Service Worker pour le caching - OK

### 7.2 Ce qui manquait → corrige 🟢 FAIT

#### Budget performance 🟢 FAIT

Budgets definis dans `public/performance-budget.json` :
- **Timings** : TTI 3500ms, FCP 2000ms, LCP 2500ms
- **Resource sizes** : script 300KB, stylesheet 50KB, image 200KB, font 100KB, total 700KB
- **Resource counts** : max 15 scripts, max 5 third-party

#### Lighthouse CI 🟢 FAIT (desktop + mobile)

**`lighthouserc.json`** (desktop) :
- 3 runs pour fiabilite, upload vers temporary-public-storage
- Assertions : performance >= 0.9, accessibility >= 0.9, best-practices >= 0.9, seo >= 0.9 (warn)
- Core Web Vitals : FCP <= 2000ms, LCP <= 2500ms, TTI <= 3500ms, CLS <= 0.05, TBT <= 300ms, Speed Index <= 3000ms

**`lighthouserc-mobile.json`** (mobile) :
- Emulation iPhone (375x812 @3x), throttling reseau (150ms RTT, 1.6Mbps, 4x CPU)
- Seuils relaxes pour mobile : perf >= 0.8, FCP <= 3000ms, LCP <= 4000ms, CLS <= 0.1, TBT <= 600ms

**Scripts** : `npm run lighthouse` (desktop) + `npm run lighthouse:mobile` (mobile)

#### Bundle analysis 🟢 FAIT

- `rollup-plugin-visualizer` (v6.0.5) installe en devDependency
- Plugin conditionnel dans `vite.config.ts` : active uniquement avec `ANALYZE=true`
- Genere `dist/bundle-analysis.html` avec treemap, gzip + brotli sizes, ouverture auto
- **Scripts** : `npm run analyze` (Windows) + `npm run analyze:unix` (Unix/macOS)

#### Fonts 🟢 FAIT (deja optimise + Font Loading API)

**Etat verifie** :
- Preload WOFF2 avec `<link rel="preload" as="font">` - OK
- `font-display: swap` - OK
- Variable fonts (1 fichier par font) - OK
- Preconnect vers `fonts.gstatic.com` - OK

**Amelioration** : `src/utils/fontOptimization.ts`
- `initFontOptimization()` : detecte le chargement des fonts via Font Loading API
- Ajoute classe `fonts-loaded` sur `<html>` quand les fonts sont chargees
- Permet d'utiliser des fallbacks systeme en attendant le chargement

#### Images 🟢 FAIT (srcset + audit loading/decoding)

**Ameliorations** :
- `getAvatarSrcSet()` dans `avatarUrl.ts` : genere srcset avec variantes 1x, 1.5x, 2x, 3x DPR
- `OptimizedImage.tsx` : ajout props `srcSet` et `sizes` passees au `<img>`
- Format AVIF/WebP avec detection automatique deja en place via `OptimizedImage`

**Audit `loading="lazy"` + `decoding="async"`** : 28 `<img>` corrigees dans 20 fichiers :
- Messages.tsx, SquadDetail.tsx, Profile.tsx, CallModal.tsx, AppLayout.tsx, etc.
- AnimatedAvatar, AvatarGroup, GifPicker : `decoding="async"` ajoute

#### Re-renders inutiles 🟢 FAIT

**React.memo ajoute sur 8 composants de liste** :
- `MessageBubble`, `ConversationCard`, `DMConversationCard` (Messages.tsx)
- `SessionCard`, `MemberCard` (SquadDetail.tsx)
- `SquadCard` (Squads.tsx)
- `NextSessionCard` (Home.tsx)
- `FriendCard` (FriendsPlaying.tsx)

**useCallback ajoute sur 14 handlers** passes aux composants de liste :
- Messages.tsx : 11 handlers (showToast, handleEditMessage, handleDeleteMessage, etc.)
- SquadDetail.tsx : 1 handler (handleRsvp)
- Home.tsx : 2 handlers (handleJoinFriendParty, handleInviteFriend)

**Outils de dev** : `src/utils/performanceUtils.ts`
- `useWhyDidYouRender()` : log les props qui changent (dev only)
- `useRenderTime()` : alerte si un render depasse 16ms (dev only)

#### Preloading/Prefetching 🟢 FAIT

**`src/utils/routePrefetch.ts`** :
- `prefetchProbableRoutes()` : warm Supabase preconnect via `requestIdleCallback` (non-bloquant)
- `setupVisibilityPrefetch()` : IntersectionObserver helper pour prefetch au scroll
- Initialise dans App.tsx apres authentification

**`src/utils/webVitals.ts`** : Core Web Vitals reporting
- `observeWebVitals()` : PerformanceObserver pour LCP, FCP, CLS, TTFB avec seuils good/needs-improvement/poor
- `reportWebVitals()` : logs colores en dev, Sentry en prod
- Initialise dans `main.tsx` via dynamic import non-bloquant

**Deja en place** : `queryClient.ts` avec staleTime 30s, gcTime 5min, retry exponential backoff, prefetchRoute() par page

---

## 8. CHANTIER 7 - MOBILE UX

### 8.1 Ce qui est bien

- Touch targets 44-48px - OK
- Bottom nav sur mobile - OK
- `100dvh` pour le viewport dynamique - OK
- Safe area insets - OK
- `useKeyboardVisible` hook - OK
- `pb-mobile-nav` padding - OK

### 8.2 Ce qui manque

#### Gestures

| Geste | Utilisation attendue | Etat actuel |
|---|---|---|
| Swipe gauche sur message | Repondre | Pas implemente |
| Swipe droite sur message | Actions (supprimer, etc.) | Pas implemente |
| Swipe droite sur page | Retour arriere (iOS-like) | Pas implemente |
| Pull to refresh | Rafraichir la page | `PullToRefresh.tsx` existe - a verifier |
| Pinch to zoom | Images | `ImageViewer.tsx` - limites |
| Long press | Menu contextuel | ContextMenu - partiel |
| Swipe entre tabs | Changer d'onglet | Pas implemente |

**Actions** :
1. Implementer swipe sur les messages (repondre/supprimer)
2. Implementer swipe back avec `@use-gesture/react`
3. Ameliorer le pinch to zoom dans ImageViewer

#### Haptic feedback

`useHapticFeedback.ts` existe. Mais :
- Est-il utilise sur les boutons CTA ? A verifier
- Est-il utilise sur les swipe actions ? Non
- Est-il utilise sur les toggles ? Pas de toggles
- Capacitor haptics = uniquement natif. PWA n'a pas d'haptics standard
- La Vibration API peut servir de fallback basique

#### Safe area edge cases

- Les modales respectent-elles les safe areas ? A verifier
- Le clavier virtuel ne cache-t-il pas le champ actif ? A verifier
- Les action sheets s'adaptent-elles au safe area bottom ? A verifier

#### Scroll behavior

| Probleme potentiel | Detail |
|---|---|
| Overscroll bounce | Est-il desactive ou laisse natif ? |
| Scroll momentum | Le scroll est-il fluide sur iOS Safari ? |
| Position: fixed | Les elements fixes flickent-ils au scroll sur iOS ? |
| Input focus scroll | Le scroll automatique vers le champ focalise fonctionne-t-il ? |

**Actions** :
1. Tester sur iOS Safari reel (pas simulateur)
2. Tester sur Chrome Android reel
3. Corriger les bugs specifiques a chaque plateforme

#### Taille de texte adaptative

- Pas de `clamp()` pour les textes (tout est en `px` fixe)
- Les textes ne s'adaptent PAS entre mobile et desktop
- Les labels trop longs sont tronques sans `title` ni `aria-label`

---

## 9. CHANTIER 8 - DARK/LIGHT MODE

### 9.1 Etat actuel

- `useTheme.ts` : Zustand store avec persistence - OK
- System preference detection - OK
- Real-time system change listener - OK
- Meta theme-color update - OK
- CSS variables light mode dans `index.css` - OK

### 9.2 Problemes

#### Le light mode est CASSE

Raison : 2200+ valeurs hardcodees ne repondent PAS au changement de theme.

Exemples concrets de ce qui casse en light mode :

| Fichier | Ligne | Code | Resultat en light mode |
|---|---|---|---|
| Home.tsx | ~41 | `bg-gradient-to-r from-[#34d399]/15` | Vert visible sur fond blanc = OK mais pas ajuste |
| Home.tsx | ~41 | `shadow-[0_0_12px_rgba(52,211,153,0.1)]` | Ombre verte invisible sur blanc |
| Messages.tsx | Multiple | `bg-[#101012]` | Fond noir sur fond blanc = horrible |
| XPBar.tsx | ~87 | `bg-[#1a1a2e]` | Card noire en plein light mode |
| CommandPalette.tsx | ~299 | `bg-[#101012]` | Modal noire en light mode |
| AppLayout.tsx | ~72 | `text-[#f7f8f8]` | Texte blanc sur fond blanc = invisible |

**Les 130 lignes de !important dans index.css** (lignes 147-274) patchent CERTAINS cas mais PAS tous.

#### Pas de transition entre themes

Le switch dark/light est INSTANTANE. Ca flashe.

**Action** : Ajouter une transition CSS :
```css
html {
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

#### Pas de theme "auto" qui suit le systeme en temps reel

Le hook detecte le system preference au mount, mais le comportement en "auto" mode (suivre le systeme en temps reel) doit etre verifie.

### 9.3 Plan de correction

1. D'abord : CHANTIER 1 (remplacer toutes les couleurs hardcodees par tokens)
2. Ensuite : supprimer les 130 lignes de !important overrides
3. Puis : ajouter les tokens light mode manquants (accents)
4. Puis : ajouter la transition de theme
5. Enfin : tester CHAQUE page en light mode et capturer des screenshots

---

## 10. CHANTIER 9 - ETATS (LOADING, ERROR, EMPTY)

### 10.1 Loading states

**Skeleton.tsx** (607 lignes) est EXCELLENT. C'est un des meilleurs points de l'app.

20+ skeletons specialises, CLS prevention, aria-hidden. Pas grand chose a changer ici.

**Ameliorations mineures** :
1. Transition skeleton -> contenu : actuellement c'est un swap brut. Ajouter un crossfade (opacity transition 200ms)
2. Skeleton dans les modales : verifier que chaque modale a un skeleton
3. Skeleton dans les lists infinite scroll : verifier que le loading "more" a un skeleton en bas

### 10.2 Error states

**ErrorState.tsx** est bon dans sa structure mais :
- Couleurs hardcodees (lignes 27-62) : `'#f5a623'`, `'rgba(245, 166, 35, 0.1)'`, etc.
- Pas de variant "inline" (petit message d'erreur sans prendre toute la page)
- Pas de variant "banner" (bandeau en haut de la page)
- Pas de retry automatique avec backoff

**ErrorBoundary.tsx** est bon (detection chunk errors, Sentry, fallback UI).

**Actions** :
1. Migrer les couleurs vers les tokens CSS
2. Ajouter `variant: 'page' | 'inline' | 'banner'`
3. Ajouter retry automatique avec exponential backoff
4. Ajouter un toast d'erreur pour les erreurs non-bloquantes

### 10.3 Empty states

**EmptyState.tsx** est inacceptable en l'etat (35 lignes, zero animation).

**Plan de refonte** :
1. Animation d'entree (motion.div avec fadeIn + slideUp)
2. Icone animee (pas juste statique)
3. Variants : `compact` (40px icon, inline) et `full` (80px icon, page entiere)
4. Secondary action support
5. Illustration support (SVG/Lottie)
6. Dark/light mode support (les couleurs doivent utiliser les tokens)

### 10.4 Etats manquants

| Situation | Etat attendu | Etat actuel |
|---|---|---|
| Offline | Banner + mode degrade | `OfflineBanner.tsx` existe - OK |
| Permission refusee | Ecran explicatif | `ErrorState type="permission"` - OK |
| Session expiree | Redirect vers login avec message | A verifier |
| Rate limited | Message + timer de retry | Pas implemente |
| Maintenance | Page dediee | Pas implementee |
| First time user | Onboarding inline | `OnboardingChecklist.tsx` existe - OK |

---

## 11. CHANTIER 10 - AUDIT PAGE PAR PAGE

### 11.1 Landing (`pages/Landing.tsx`)

**Problemes** :
- 35+ couleurs hardcodees
- Performance : c'est la premiere page chargee, elle DOIT etre rapide
- Le hero section charge des animations lourdes (mesh gradient, noise overlay, floating phone)
- Pas de Above-the-fold optimization (le contenu critique doit se charger en premier)
- Les fonts doivent etre preloadees pour cette page
- Les images hero doivent etre en `<img>` avec `fetchpriority="high"`, pas en background CSS
- Les sections below-the-fold doivent etre lazy (IntersectionObserver)
- Les temoignages/features cards doivent utiliser `scrollReveal` de animations.ts
- CTA button doit avoir le plus gros contraste de la page

**Actions** :
1. Nettoyer toutes les couleurs hardcodees
2. Preload fonts + hero image
3. Lazy load sections below-the-fold
4. Mesurer et optimiser LCP < 1.5s
5. Verifier le CLS (pas de shift de layout)

### 11.2 Auth (`pages/Auth.tsx`)

**Problemes a verifier** :
- Formulaire de login/signup : validation temps reel ?
- Erreurs de formulaire : annoncees au screen reader ?
- Auto-focus sur le premier champ ?
- Password : indicateur de force ?
- Social login buttons : accessibles ?
- Redirect apres login : fluide ou flash blanc ?

**Actions** :
1. Auto-focus sur le champ email au mount
2. Validation en temps reel avec debounce
3. Aria-live pour les erreurs
4. Transition fluide vers Home apres auth

### 11.3 Onboarding (`pages/Onboarding.tsx`)

**Points a verifier** :
- Steps indicator anime ?
- Progression sauvegardee si l'user quitte ?
- Skip possible ?
- Chaque step accessible au clavier ?
- Animations fluides entre steps ?

### 11.4 Home (`pages/Home.tsx` - 775 lignes)

**Problemes** :
- 32+ couleurs hardcodees
- 775 lignes = trop long, a decouper
- Multiple sections : streaks, sessions, friends playing, AI coach, challenges
- Chaque section doit avoir son propre skeleton
- Le confetti ne se declenche que pour les streaks

**Actions** :
1. Decouper en sous-composants : `HomeStreakSection`, `HomeSessionsSection`, `HomeFriendsSection`, etc.
2. Chaque sous-composant memoised avec `React.memo`
3. Nettoyer les couleurs hardcodees
4. Verifier que chaque section a un loading skeleton
5. Ajouter des transitions stagger entre les sections

### 11.5 Squads (`pages/Squads.tsx`)

**Points a verifier** :
- Liste de squads : virtualisee si > 20 items ?
- Filtre/recherche : debounce ?
- Card de squad : hover state, focus state ?
- Empty state si aucun squad ?
- Loading skeleton pour la liste ?
- Pull to refresh sur mobile ?

### 11.6 SquadDetail (`pages/SquadDetail.tsx` - 1229 lignes)

**Problemes** :
- 28+ couleurs hardcodees
- 1229 lignes = WAY trop long
- Multiple onglets/sections internes
- Actions d'admin : confirmations modales ?
- Invite link : copie avec feedback ?

**Actions** :
1. Decouper en sous-composants : `SquadHeader`, `SquadMembers`, `SquadSessions`, `SquadSettings`
2. Chaque sous-composant dans son propre fichier
3. Nettoyer les couleurs
4. Verifier transitions entre onglets
5. Verifier les etats vides pour chaque section

### 11.7 Messages (`pages/Messages.tsx` - 1748 lignes)

**Problemes CRITIQUES** :
- 45+ couleurs hardcodees - le pire fichier de l'app
- 1748 lignes = INACCEPTABLE, doit etre split
- C'est la page la plus utilisee, elle doit etre PARFAITE
- Message list, message input, conversation list, DMs, group chats
- Virtualization OK (`VirtualizedMessageList.tsx`)

**Actions** :
1. Split URGENT en sous-composants :
   - `ConversationList.tsx` (sidebar des conversations)
   - `MessageThread.tsx` (le fil de messages)
   - `MessageComposer.tsx` (la zone de saisie)
   - `MessageBubble.tsx` (un message individuel)
   - `ConversationHeader.tsx` (header avec nom + actions)
2. Chaque composant < 200 lignes
3. Nettoyer les 45+ couleurs
4. Verifier les performances de scroll (doit etre butter smooth)
5. Verifier que le clavier virtuel ne couvre pas l'input
6. Verifier les animations de nouveau message
7. Verifier l'accessibilite : screen reader peut-il lire les messages ?

### 11.8 Sessions (`pages/Sessions.tsx`)

**Points a verifier** :
- Liste de sessions : skeleton pendant le chargement ?
- Filtre par date/statut ?
- Card de session : informations suffisantes ?
- Empty state si aucune session ?
- Creation de session : modale avec formulaire complet ?

### 11.9 SessionDetail (`pages/SessionDetail.tsx`)

**Points a verifier** :
- Detail complet de la session ?
- Participants liste ?
- Actions (rejoindre, quitter, modifier) ?
- Timer/countdown si session planifiee ?
- Transitions fluides depuis la liste ?

### 11.10 Profile (`pages/Profile.tsx` - 934 lignes)

**Problemes** :
- 22+ couleurs hardcodees
- 934 lignes = a decouper
- Sections : info perso, stats, badges, historique

**Actions** :
1. Decouper en : `ProfileHeader`, `ProfileStats`, `ProfileBadges`, `ProfileHistory`
2. Nettoyer les couleurs
3. Verifier que l'avatar est optimise (srcset)
4. Verifier l'edition du profil (modale ? page dediee ?)

### 11.11 Settings (`pages/Settings.tsx`)

**Points a verifier** :
- Toutes les options ont des labels clairs ?
- Les toggles (quand ils existeront) sont accessibles ?
- Le changement de theme fonctionne visuellement ?
- Les sections sont bien separees ?
- Confirmation avant actions destructives (supprimer compte) ?

### 11.12 Premium (`pages/Premium.tsx`)

**Problemes** :
- 24+ couleurs hardcodees
- Page de vente : doit etre la plus belle page de l'app
- CTA doit avoir une animation d'attention
- Comparaison free/premium doit etre claire
- Temoignages/social proof ?

### 11.13 Party (`pages/Party.tsx`)

**Points a verifier** :
- Voice chat : feedback audio visuel ?
- Participants : layout adaptatif ?
- Qualite reseau : indicateur visible ?
- Mute/unmute : feedback immediat ?

### 11.14 CallHistory (`pages/CallHistory.tsx`)

**Points a verifier** :
- Liste des appels : skeleton ?
- Filtre par type (manques, recus, emis) ?
- Empty state ?
- Rappel en un tap ?

### 11.15 Help (`pages/Help.tsx`)

**Points a verifier** :
- FAQ : accordion anime ?
- Recherche dans l'aide ?
- Contact support : formulaire ?
- Categories visuelles ?

### 11.16 Legal (`pages/Legal.tsx`)

**Problemes** :
- 26+ couleurs hardcodees (dans une page LEGALE !)
- Doit etre la page la plus simple de l'app
- Juste du texte avec des sections

### 11.17 NotFound (`pages/NotFound.tsx`)

**Points a verifier** :
- Animation engageante ?
- Suggestion de pages ?
- Bouton retour clair ?

### 11.18 Discover (`pages/Discover.tsx`) - NON COMMITTE

Cette page est non committee. Ne pas la toucher tant qu'elle n'est pas stable.

### 11.19 PublicProfile (`pages/PublicProfile.tsx`) - NON COMMITTE

Idem.

### 11.20 JoinSquad (`pages/JoinSquad.tsx`)

**Points a verifier** :
- Lien d'invitation : validation ?
- Feedback apres avoir rejoint ?
- Erreur si le squad est plein ?
- Redirect apres join ?

---

## 12. CHANTIER 11 - QUALITE DE CODE & TESTS

### 12.1 Fichiers trop longs

| Fichier | Lignes | Action |
|---|---|---|
| `Messages.tsx` | 1748 | Split en 5+ fichiers |
| `SquadDetail.tsx` | 1229 | Split en 4+ fichiers |
| `Profile.tsx` | 934 | Split en 4+ fichiers |
| `Home.tsx` | 775 | Split en 5+ fichiers |
| `AppLayout.tsx` | 708 | Split en 3+ fichiers |
| `Landing.tsx` | 600+ | Split en sections |
| `Skeleton.tsx` | 607 | OK (ce sont des variantes) |

**Regle** : Aucun composant React ne doit depasser 300 lignes. Si c'est plus, il faut splitter.

### 12.2 Tests unitaires

Actuellement : ZERO tests unitaires pour les composants UI.

**Plan** :
1. Setup Vitest + React Testing Library
2. Tester CHAQUE composant UI :
   - Render sans crash
   - Chaque variante rend correctement
   - Props optionnelles fonctionnent
   - Etats disabled/loading fonctionnent
   - Keyboard interaction fonctionne
   - ARIA attributes sont presents
3. Tester chaque hook custom
4. Tester les animations (via snapshot ou visual regression)

**Coverage cible** : 100% sur `src/components/ui/`, 80% sur `src/components/`, 60% sur `src/pages/`

### 12.3 Tests E2E

1. Setup Playwright
2. Tester les flows critiques :
   - Login -> Home
   - Creer un squad
   - Envoyer un message
   - Creer une session
   - Switch dark/light mode
   - Navigation complete au clavier
3. Tests visuels : captures d'ecran de chaque page en dark ET light mode
4. Tests mobile : viewport 375px et 428px

### 12.4 Tests d'accessibilite automatises

1. `@axe-core/react` en dev mode (overlay des erreurs)
2. `jest-axe` dans les tests unitaires
3. Lighthouse CI accessibility score = 100

### 12.5 Linting

- ESLint strict avec `eslint-plugin-jsx-a11y`
- Pas de `// eslint-disable` sauf justifie
- Pas de `any` TypeScript sauf justifie
- Prettier format uniforme

---

## 13. CHANTIER 12 - POLISH FINAL

### 13.1 Ce que font Apple et PlayStation qu'on ne fait pas

| Detail | Explication | Priorite |
|---|---|---|
| **Fluid typography** | Les textes s'adaptent entre mobile et desktop via `clamp()` | HAUTE |
| **Variable fonts** | 1 fichier font au lieu de 4, poids adaptatif | MOYENNE |
| **Motion matching** | Les animations correspondent a la physique reelle (spring, friction) | HAUTE |
| **Skeleton-to-content crossfade** | Transition douce du skeleton au contenu reel | HAUTE |
| **Optimistic updates** | L'action se reflete AVANT la confirmation serveur | HAUTE |
| **Error recovery** | Auto-retry en background, pas besoin de recharger | HAUTE |
| **Shared element transitions** | L'element clique "voyage" vers la nouvelle page | BASSE |
| **Adaptive loading** | UI plus legere sur connexions lentes | MOYENNE |
| **Reduced motion** | Respecte la preference OS (existe deja partiellement) | HAUTE |
| **State persistence** | Les scrolls positions, filters, onglets sont memorises | HAUTE |
| **Scroll restoration** | Retour arriere = meme position de scroll | HAUTE |
| **Infinite scroll** | Charge plus de contenu au scroll, pas de pagination | MOYENNE |
| **Skeleton-aware CLS** | Les skeletons ont les memes dimensions que le contenu | EXISTE |
| **Sub-pixel rendering** | Pas de flou sur les bordures/ombres | A VERIFIER |

### 13.2 Details qui font "world-class"

| Detail | Comment l'implementer |
|---|---|
| **Cursor custom** | Landing page cursor custom (existe) - etendre a toute l'app ? Non, trop |
| **Scroll progress** | Barre de progression sur les pages longues (Help, Legal) |
| **Section anchors** | Deep links vers chaque section (settings#theme, etc.) |
| **Keyboard shortcuts** | Ctrl+K pour search (existe), mais aussi N pour new, etc. |
| **Sound design** | Sons subtils pour les actions (message sent, notification) - deja dans useSoundEffects |
| **Vibration patterns** | Differents patterns pour differentes actions |
| **Toast with undo** | "Message supprime" avec bouton Annuler et timer |
| **Contextual help** | Tooltips explicatifs sur les elements complexes |
| **Progressive disclosure** | Montrer d'abord l'essentiel, le reste au tap/click |
| **Loading progress** | Barre de chargement en haut de page pendant navigation (comme YouTube) |

### 13.3 Performance ressentie

Meme si l'app est rapide, elle doit PARAITRE instantanee :

1. **Skeleton immediat** : Le skeleton doit apparaitre en < 50ms (c'est le cas)
2. **Optimistic UI** : Les actions se refletent instantanement (a implementer systematiquement)
3. **Prefetch agressif** : Charger les donnees probables avant que l'user clique
4. **Animation d'attente** : Si une action prend > 300ms, montrer un spinner
5. **Progress indicators** : Pour les uploads, envois, etc.
6. **Background sync** : Synchroniser les donnees en arriere-plan sans bloquer l'UI

---

## 14. PLANNING & PRIORISATION

### Phase 1 : Fondations (Semaines 1-4)

**Objectif** : Avoir un vrai design system utilisable

| Semaine | Tache | Impact |
|---|---|---|
| S1 | Creer tous les tokens manquants (section 2.3) | Fondation |
| S1 | Creer les tokens light mode manquants (section 2.4) | Fondation |
| S1 | Definir l'echelle typographique (section 4.2) | Fondation |
| S2 | Nettoyer les 5 fichiers les plus pollues (Messages, Landing, Home, AppLayout, SquadDetail) | -40% du probleme |
| S3 | Nettoyer les 5 fichiers suivants | -30% du probleme |
| S4 | Nettoyer tous les fichiers restants | -30% restant |
| S4 | Supprimer les !important overrides (section 2.6) | Nettoyage |
| S4 | Supprimer theme.ts | Nettoyage |

**Critere de succes** : Zero couleur hardcodee dans le codebase. `grep -r "text-\[#" src/` retourne 0 resultats.

### Phase 2 : Composants (Semaines 5-10)

**Objectif** : Avoir une bibliotheque de composants complete

| Semaine | Tache |
|---|---|
| S5 | Refactorer Button (section 3.3) |
| S5 | Refactorer Badge (section 3.3) |
| S5 | Refactorer EmptyState (section 3.3) |
| S6 | Creer Dialog/Modal primitif |
| S6 | Creer Toggle/Switch |
| S7 | Creer Select/Combobox |
| S7 | Creer Dropdown/Menu |
| S8 | Creer Sheet/BottomSheet |
| S8 | Creer Tabs |
| S9 | Creer Accordion |
| S9 | Creer Checkbox, Radio |
| S10 | Creer les composants restants (Popover, AvatarGroup, etc.) |
| S10 | Migrer toutes les modales existantes vers le Dialog primitif |

**Critere de succes** : 35+ composants, chacun avec props TypeScript completes, accessibilite, dark/light mode.

### Phase 3 : Accessibilite (Semaines 11-14)

**Objectif** : Lighthouse Accessibility = 100

| Semaine | Tache |
|---|---|
| S11 | Setup jest-axe + eslint-plugin-jsx-a11y |
| S11 | Audit de CHAQUE page au clavier |
| S12 | Implementer useAnnounce() et l'utiliser partout |
| S12 | Implementer useFocusReturn() pour les modales |
| S13 | Ajouter sr-only labels a tous les indicateurs colores |
| S13 | Corriger la semantique HTML (ul/li, headings, landmarks) |
| S14 | Tests screen reader (VoiceOver/NVDA) |
| S14 | Tests de daltonisme |

**Critere de succes** : Lighthouse Accessibility = 100. L'app est navigable entierement au clavier.

### Phase 4 : Performance (Semaines 15-18)

**Objectif** : Lighthouse Performance >= 95

| Semaine | Tache |
|---|---|
| S15 | Setup Lighthouse CI |
| S15 | Bundle analysis + elimination du code mort |
| S16 | Optimisation des fonts (variable fonts, preload, subset) |
| S16 | Optimisation des images (AVIF, srcset, LQIP) |
| S17 | Identifier et corriger les re-renders inutiles |
| S17 | Implementer prefetching agressif |
| S18 | Definir et enforcer les budgets performance |
| S18 | Mesurer et optimiser les Core Web Vitals |

**Critere de succes** : LCP < 1.5s, FID < 50ms, CLS < 0.05

### Phase 5 : Splitter le code (Semaines 19-22)

**Objectif** : Aucun fichier > 300 lignes

| Semaine | Tache |
|---|---|
| S19 | Split Messages.tsx en 5+ fichiers |
| S19 | Split SquadDetail.tsx en 4+ fichiers |
| S20 | Split Profile.tsx en 4+ fichiers |
| S20 | Split Home.tsx en 5+ fichiers |
| S21 | Split AppLayout.tsx en 3+ fichiers |
| S21 | Split Landing.tsx en sections |
| S22 | React.memo sur tous les sous-composants de liste |
| S22 | Revue complete de la memoisation |

### Phase 6 : Animations & Polish (Semaines 23-26)

**Objectif** : Chaque interaction a un feedback visuel

| Semaine | Tache |
|---|---|
| S23 | Page transitions : 250ms avec ease-out |
| S23 | Skeleton-to-content crossfade |
| S23 | List item removal animation |
| S24 | Micro-interactions (hover avatar, input focus, etc.) |
| S24 | Loading to success transition |
| S24 | Error shake animation |
| S25 | Optimistic updates sur toutes les mutations |
| S25 | Toast with undo |
| S26 | Scroll restoration |
| S26 | State persistence (scroll position, filters) |

### Phase 7 : Mobile & Gestures (Semaines 27-30)

**Objectif** : UX mobile au niveau des apps natives

| Semaine | Tache |
|---|---|
| S27 | Swipe sur messages (repondre/supprimer) |
| S27 | Ameliorer le BottomSheet avec snap points |
| S28 | Pull to refresh verification + fix |
| S28 | Pinch to zoom dans ImageViewer |
| S29 | Test et fix iOS Safari specifiques |
| S29 | Test et fix Chrome Android specifiques |
| S30 | Haptic feedback sur les actions CTA |
| S30 | Test sur devices reels (iPhone, Android) |

### Phase 8 : Tests (Semaines 31-36)

**Objectif** : Confidence totale dans le code

| Semaine | Tache |
|---|---|
| S31-32 | Tests unitaires tous les composants UI |
| S33-34 | Tests unitaires tous les hooks |
| S35 | Setup Playwright + tests E2E flows critiques |
| S36 | Tests visuels (screenshots dark + light, mobile + desktop) |

### Phase 9 : Light Mode Perfect (Semaines 37-38)

**Objectif** : Le light mode est aussi beau que le dark mode

| Semaine | Tache |
|---|---|
| S37 | Test visuel de CHAQUE page en light mode |
| S37 | Capture screenshots comparatives |
| S38 | Fix tous les problemes visuels trouves |
| S38 | Transition de theme fluide |

### Phase 10 : Audit Final (Semaines 39-40)

| Tache |
|---|
| Lighthouse full audit (Performance, Accessibility, Best Practices, SEO) |
| Test complet au clavier |
| Test screen reader |
| Test daltonisme |
| Test sur 5+ devices reels |
| Test light mode complet |
| Test offline mode |
| Bundle size final |
| Review de chaque page par un regard exterieur |

---

## REGLES ABSOLUES

1. **ZERO couleur hardcodee** : Si tu ecris `#` dans un className, c'est FAUX
2. **ZERO taille de police arbitraire** : Si tu ecris `text-[Xpx]`, c'est FAUX
3. **ZERO composant > 300 lignes** : Si ca depasse, split
4. **TOUT composant UI doit etre accessible** : clavier + screen reader
5. **TOUT etat doit etre gere** : loading, error, empty, success
6. **TOUT changement doit fonctionner en dark ET light** : sans exception
7. **TOUT feedback utilisateur doit etre anime** : pas de changement brut
8. **Les tests passent AVANT le merge** : pas d'exception
9. **Le Lighthouse score ne descend JAMAIS** : regression = blocage
10. **On ne ment plus dans les audits** : si c'est pas teste, c'est pas fait

---

## METRIQUES DE SUCCES FINALES

| Metrique | Cible |
|---|---|
| Lighthouse Performance | >= 95 |
| Lighthouse Accessibility | = 100 |
| Lighthouse Best Practices | = 100 |
| Lighthouse SEO | >= 95 |
| Couleurs hardcodees | 0 |
| Tailles arbitraires | 0 |
| Composants UI | 35+ |
| Test coverage UI | 100% |
| Test coverage hooks | 80% |
| Tests E2E | flows critiques couverts |
| Fichiers > 300 lignes | 0 (sauf Skeleton.tsx) |
| Light mode bugs | 0 |
| Keyboard navigation bugs | 0 |
| Screen reader bugs | 0 |
| Core Web Vitals (LCP) | < 1.5s |
| Core Web Vitals (CLS) | < 0.05 |
| Core Web Vitals (INP) | < 100ms |

---

> Ce document est la BIBLE. Chaque point est un probleme REEL identifie dans le code.
> On ne passe pas au point suivant tant que le precedent n'est pas REGLE.
> On ne se ment plus. On ne se note plus 50/50.
> On mesure, on corrige, on verifie, on avance.
