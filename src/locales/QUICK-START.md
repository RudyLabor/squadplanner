# Quick Start - Système i18n

Guide rapide pour commencer à utiliser le système d'internationalisation.

## 🚀 Utilisation basique en 3 étapes

### 1. Importer le hook

```tsx
import { useT } from '../lib/i18n'
```

### 2. L'utiliser dans le composant

```tsx
export function MyComponent() {
  const t = useT()

  return <h1>{t('nav.home')}</h1>
}
```

### 3. C'est tout! 🎉

Le texte sera automatiquement traduit en fonction de la langue choisie par l'utilisateur.

## 📖 Cas d'usage courants

### Navigation

```tsx
const t = useT()

<a href="/">{t('nav.home')}</a>
<a href="/sessions">{t('nav.sessions')}</a>
<a href="/squads">{t('nav.squads')}</a>
```

### Boutons d'action

```tsx
const t = useT()

<button>{t('actions.create')}</button>
<button>{t('actions.edit')}</button>
<button>{t('actions.delete')}</button>
<button>{t('actions.cancel')}</button>
```

### États vides

```tsx
const t = useT()

<p>{t('empty.sessions')}</p>
<p>{t('empty.squads')}</p>
<p>{t('empty.messages')}</p>
```

### Messages d'erreur

```tsx
const t = useT()

try {
  await saveData()
  showToast(t('success.saved'))
} catch {
  showToast(t('errors.generic'))
}
```

### Pluriels et nombres

```tsx
const t = useT()

// Avec pluriel automatique
<p>{t('squads.members', 5)}</p> // "5 membres"
<p>{t('time.hours', 2)}</p>     // "2 heures"

// Temps relatif
<p>{t('time.hoursAgo', 3)}</p>  // "Il y a 3h"
```

## 🎛️ Changer la langue

### Dans un composant

```tsx
import { useLocale, useSetLocale } from '../lib/i18n'

export function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()

  return (
    <button onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}>
      {locale === 'fr' ? 'Switch to English' : 'Passer en français'}
    </button>
  )
}
```

**Note:** Le sélecteur dans Settings est déjà connecté! ✅

## 📝 Clés disponibles

### Toutes les clés sont dans:
- `src/locales/fr.ts` (français)
- `src/locales/en.ts` (anglais)

### Structure:

```
nav.*           → Navigation (home, sessions, squads, etc.)
actions.*       → Actions (create, edit, delete, etc.)
empty.*         → États vides (sessions, squads, messages, etc.)
status.*        → Statuts (online, offline, away, etc.)
time.*          → Temps (today, yesterday, minutes(), etc.)
errors.*        → Erreurs (generic, network, unauthorized, etc.)
success.*       → Succès (saved, deleted, created, etc.)
notifications.* → Notifications (title, newSession, etc.)
sessions.*      → Sessions (create, edit, rsvp.yes, etc.)
squads.*        → Squads (create, members(), etc.)
messages.*      → Messages (send, type, reply, etc.)
settings.*      → Paramètres (COMPLET - 50+ clés)
premium.*       → Premium (title, features, etc.)
auth.*          → Auth (signIn, signUp, welcome, etc.)
```

## 🔍 Trouver une clé

### Méthode 1: Chercher dans fr.ts

```bash
# Ouvrir src/locales/fr.ts et chercher le texte français
```

### Méthode 2: Pattern matching

```
"Accueil"              → nav.home
"Créer"                → actions.create
"Aucune session"       → empty.sessions
"En ligne"             → status.online
"Erreur de connexion"  → errors.network
"Enregistré"           → success.saved
```

## ⚠️ Clé manquante?

Si une clé n'existe pas encore:

### 1. Ajouter dans fr.ts

```typescript
export const fr = {
  // ... autres clés
  myKey: 'Ma valeur',
}
```

### 2. Ajouter dans en.ts

```typescript
export const en: TranslationKeys = {
  // ... autres clés
  myKey: 'My value',
}
```

### 3. Utiliser

```tsx
t('myKey')
```

## 💡 Tips

### ✅ À faire

```tsx
// ✅ Bon - clé claire et réutilisable
t('actions.create')
t('empty.sessions')
t('squads.members', count)
```

### ❌ À éviter

```tsx
// ❌ Ne pas hardcoder de textes
'Créer une session'

// ❌ Ne pas concaténer des traductions
t('actions.create') + ' une session'

// ✅ Mieux - créer une clé spécifique
t('sessions.create')
```

## 📚 Plus d'infos

- **Documentation complète:** `src/locales/README.md`
- **Exemples détaillés:** `src/lib/i18n.example.tsx`
- **Guide de migration:** `MIGRATION-EXAMPLE.md` (racine du projet)
- **Rapport d'implémentation:** `I18N-IMPLEMENTATION.md` (racine du projet)

## 🎯 Résumé

```tsx
// 1. Importer
import { useT } from '../lib/i18n'

// 2. Utiliser
const t = useT()

// 3. Traduire
return <button>{t('actions.create')}</button>
```

C'est aussi simple que ça! 🚀
