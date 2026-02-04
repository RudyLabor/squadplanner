---
name: front-end-design
description: Expert en design UI/UX avec le design system Linear Dark - interfaces premium, minimalistes et performantes.
triggers:
  - design
  - ui
  - ux
  - linear
  - dark mode
  - theme
  - colors
  - palette
  - tailwind
  - css
  - styling
  - animation
  - framer motion
role: specialist
scope: frontend
---

# Front-End Design Expert

Expert en design d'interfaces utilisateur premium style Linear/Spotify avec thème dark.

## Design System Linear Dark

### Palette de Couleurs

#### Backgrounds
```css
--bg-base: #08090a;        /* Page background */
--bg-elevated: #101012;    /* Cards, surfaces */
--bg-surface: #18191b;     /* Raised elements */
--bg-hover: #1f2023;       /* Hover states */
--bg-active: #27282b;      /* Active/pressed */
```

#### Textes
```css
--text-primary: #f7f8f8;    /* Main text */
--text-secondary: #c9cace;  /* Secondary text */
--text-tertiary: #8b8d90;   /* Muted text */
--text-quaternary: #5e6063; /* Very muted */
```

#### Accents par Catégorie
```css
--color-primary: #5e6dd2;   /* Violet - Squads/Gaming */
--color-success: #4ade80;   /* Vert - Stats/Success */
--color-warning: #f5a623;   /* Orange - Sessions/Time */
--color-info: #60a5fa;      /* Bleu - Time/Clock */
--color-purple: #8b93ff;    /* Violet clair - Users/Friends */
--color-error: #f87171;     /* Rouge - Errors/Danger */
```

## Composants UI

### Card Transparente
```html
<div class="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]
            rounded-xl hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.1)]
            transition-all"></div>
```

### Button Primary
```html
<button class="bg-[#5e6dd2] hover:bg-[#6a79db] text-white rounded-xl
               shadow-lg shadow-[#5e6dd2]/20 transition-colors"></button>
```

### Button Secondary
```html
<button class="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)]
               hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]
               text-[#f7f8f8] rounded-xl transition-all"></button>
```

### Input Field
```html
<input class="bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]
              hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]
              focus:border-[rgba(94,109,210,0.5)] focus:ring-2 focus:ring-[rgba(94,109,210,0.15)]
              text-[#f7f8f8] placeholder-[#5e6063] rounded-xl transition-all" />
```

### Stat Card avec Icone Coloree
```html
<div class="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] rounded-xl p-4">
  <div class="w-10 h-10 rounded-lg flex items-center justify-center"
       style="background-color: ${accentColor}15">
    <Icon class="w-5 h-5" style="color: ${accentColor}" />
  </div>
  <div class="text-[20px] font-semibold text-[#f7f8f8]">{value}</div>
  <div class="text-[12px] text-[#5e6063]">{label}</div>
</div>
```

## Animations Framer Motion

### Container avec Stagger
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};
```

### Item Individuel
```typescript
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.14,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};
```

### Hover Effects
```typescript
whileHover={{ y: -2, scale: 1.01 }}
whileTap={{ scale: 0.98 }}
```

## Icones par Categorie (Lucide React)

| Categorie     | Couleur   | Icones typiques                |
|---------------|-----------|--------------------------------|
| Squads/Gaming | #5e6dd2   | Users, Gamepad2, Trophy        |
| Sessions/Time | #f5a623   | Calendar, Clock, Timer         |
| Stats/Success | #4ade80   | TrendingUp, CheckCircle, Award |
| Time/Clock    | #60a5fa   | Clock, History, CalendarDays   |
| Users/Friends | #8b93ff   | User, UserPlus, Users          |
| Errors/Danger | #f87171   | AlertTriangle, XCircle, Trash  |

## Structure Page Type

```tsx
export function XXXScreen() {
  return (
    <div className="min-h-screen pb-24 md:pb-8 bg-[#08090a]">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {/* Header */}
          <motion.div variants={itemVariants}>...</motion.div>
          {/* Content */}
          <motion.div variants={itemVariants}>...</motion.div>
        </motion.div>
      </div>
    </div>
  );
}
```

## Regles Critiques

### A FAIRE
- Fond page: `bg-[#08090a]`
- Padding bottom mobile: `pb-24 md:pb-8` (pour BottomNav)
- Cartes transparentes avec `rgba(255,255,255,0.02)`
- Bordures subtiles avec `rgba(255,255,255,0.06)`
- Animations courtes (0.14s) avec easing custom
- Icones colorees selon categorie

### A NE JAMAIS FAIRE
- `repeat: Infinity` sur animations Framer Motion
- `opacity: 0` sur container principal sans animation
- Couleurs hex solides pour backgrounds (utiliser rgba)
- `text-white` (utiliser `text-[#f7f8f8]`)
- Oublier le padding bottom pour BottomNav mobile

## Empty State Pattern

```tsx
<motion.div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#18191b] to-[#101012]
                       border border-[rgba(255,255,255,0.06)] text-center">
  <div className="w-16 h-16 rounded-3xl bg-[#1f2023] flex items-center justify-center mx-auto mb-6">
    <Users className="w-8 h-8 text-[#5e6063]" strokeWidth={1.2} />
  </div>
  <h3 className="text-[18px] font-bold text-[#f7f8f8] mb-2">Titre</h3>
  <p className="text-[14px] text-[#8b8d90] mb-8">Description</p>
  <motion.button
    className="inline-flex items-center gap-2.5 h-12 px-7 rounded-xl bg-[#5e6dd2]
               text-white text-[15px] font-semibold shadow-lg shadow-[#5e6dd2]/20"
    whileHover={{ y: -2, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Plus className="w-5 h-5" strokeWidth={2} />
    Action
  </motion.button>
</motion.div>
```

## Section Header Pattern

```tsx
<div className="flex items-center justify-between mb-4">
  <h2 className="text-[11px] font-medium text-[rgba(255,255,255,0.35)] uppercase tracking-[0.05em]">
    {title}
  </h2>
  <motion.button
    className="text-[13px] text-[#5e6dd2] hover:text-[#8b93ff] font-medium flex items-center gap-1"
    whileHover={{ x: 2 }}
  >
    {action}
    <ChevronRight className="w-3.5 h-3.5" />
  </motion.button>
</div>
```
