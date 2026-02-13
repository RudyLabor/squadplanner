# Système d'internationalisation (i18n)

Ce dossier contient l'infrastructure d'internationalisation pour Squad Planner.

## Architecture

### Fichiers

- **`fr.ts`** - Traductions françaises (langue par défaut)
- **`en.ts`** - Traductions anglaises
- **`../lib/i18n.ts`** - Store Zustand et hooks d'utilisation
- **`../lib/i18n.example.tsx`** - Exemples d'utilisation

## Caractéristiques

✅ **Ultra-léger** - Pas de bibliothèque externe (uniquement Zustand déjà présent)
✅ **Type-safe** - TypeScript garantit que toutes les clés existent
✅ **Persistant** - Le choix de langue est sauvegardé dans localStorage
✅ **SSR-compatible** - Fonctionne côté serveur avec `getT(locale)`
✅ **Fonctions de traduction** - Support des pluriels et valeurs dynamiques

## Utilisation

### Dans un composant React

```tsx
import { useT } from '../lib/i18n'

function MyComponent() {
  const t = useT()

  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <button>{t('actions.create')}</button>
      <p>{t('squads.members', 5)}</p> {/* "5 membres" ou "5 members" */}
    </div>
  )
}
```

### Changer la langue

```tsx
import { useLocale, useSetLocale } from '../lib/i18n'

function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()

  return (
    <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}>
      {locale === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
    </button>
  )
}
```

### Hors composants React

```ts
import { getT } from '../lib/i18n'

const t = getT('fr')
const message = t('errors.network')
```

## Structure des traductions

Les traductions sont organisées par domaine :

```ts
{
  nav: { ... },          // Navigation
  actions: { ... },      // Actions communes (créer, modifier, etc.)
  empty: { ... },        // États vides
  status: { ... },       // Statuts utilisateur
  time: { ... },         // Dates et durées
  errors: { ... },       // Messages d'erreur
  success: { ... },      // Messages de succès
  notifications: { ... },// Notifications
  sessions: { ... },     // Sessions
  squads: { ... },       // Squads
  messages: { ... },     // Messagerie
  settings: { ... },     // Paramètres
  premium: { ... },      // Premium
  auth: { ... },         // Authentification
}
```

## Traductions dynamiques

Pour les pluriels ou valeurs dynamiques, utilisez des fonctions :

```ts
// Dans fr.ts
export const fr = {
  time: {
    minutes: (count: number) => `${count} minute${count > 1 ? 's' : ''}`,
    hoursAgo: (count: number) => `Il y a ${count}h`,
  },
  squads: {
    members: (count: number) => `${count} membre${count > 1 ? 's' : ''}`,
  },
}

// Utilisation
t('time.minutes', 5)    // "5 minutes"
t('time.hoursAgo', 2)   // "Il y a 2h"
t('squads.members', 10) // "10 membres"
```

## Ajouter une nouvelle clé de traduction

1. Ajouter la clé dans **`fr.ts`** (langue source)
2. Ajouter la même clé dans **`en.ts`** avec la traduction anglaise
3. TypeScript garantit que les deux fichiers ont les mêmes clés

```ts
// fr.ts
export const fr = {
  nav: {
    home: 'Accueil',
    newKey: 'Nouvelle clé', // ✅ Ajouter ici
  },
}

// en.ts
export const en: TranslationKeys = {
  nav: {
    home: 'Home',
    newKey: 'New key', // ✅ Puis ici
  },
}
```

## Migration progressive

**Pas besoin de tout traduire d'un coup !**

Le système est conçu pour une adoption progressive :

1. Les fichiers de traduction contiennent les chaînes les plus communes
2. Chaque composant peut être migré individuellement
3. Les composants non migrés continuent de fonctionner en français
4. Si une clé manque, le système affiche la clé en fallback (+ warning console)

### Ordre de migration recommandé

1. ✅ Navigation (nav)
2. ✅ Boutons d'action (actions)
3. ✅ États vides (empty)
4. ✅ Erreurs/succès (errors, success)
5. Paramètres (settings) - **FAIT dans Settings.tsx**
6. Sessions (sessions)
7. Squads (squads)
8. Messages (messages)
9. Premium (premium)
10. Auth (auth)

## SSR et performance

- Le store Zustand est initialisé avec la locale sauvegardée (pas de flash)
- `getT(locale)` peut être utilisé côté serveur
- Pas de téléchargement de fichiers JSON - les traductions sont dans le bundle
- Tree-shaking : seules les traductions utilisées sont dans le bundle final

## Exemples complets

Voir **`../lib/i18n.example.tsx`** pour 10 exemples d'utilisation détaillés.
