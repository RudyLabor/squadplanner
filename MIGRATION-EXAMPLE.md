# Exemple de migration i18n

Ce document montre comment migrer un composant existant pour utiliser le système i18n.

## Exemple 1: Composant simple

### AVANT (hardcodé en français)

```tsx
// src/components/EmptyState.tsx
export function SessionsEmptyState() {
  return (
    <div className="empty-state">
      <p>Aucune session pour le moment</p>
      <button>Créer une session</button>
    </div>
  )
}
```

### APRÈS (avec i18n)

```tsx
// src/components/EmptyState.tsx
import { useT } from '../lib/i18n'

export function SessionsEmptyState() {
  const t = useT()

  return (
    <div className="empty-state">
      <p>{t('empty.sessions')}</p>
      <button>{t('sessions.create')}</button>
    </div>
  )
}
```

## Exemple 2: Navigation

### AVANT

```tsx
// src/components/Navbar.tsx
export function Navbar() {
  return (
    <nav>
      <a href="/">Accueil</a>
      <a href="/sessions">Sessions</a>
      <a href="/squads">Squads</a>
      <a href="/messages">Messages</a>
    </nav>
  )
}
```

### APRÈS

```tsx
// src/components/Navbar.tsx
import { useT } from '../lib/i18n'

export function Navbar() {
  const t = useT()

  return (
    <nav>
      <a href="/">{t('nav.home')}</a>
      <a href="/sessions">{t('nav.sessions')}</a>
      <a href="/squads">{t('nav.squads')}</a>
      <a href="/messages">{t('nav.messages')}</a>
    </nav>
  )
}
```

## Exemple 3: Traductions avec arguments

### AVANT

```tsx
// src/components/SquadCard.tsx
export function SquadCard({ memberCount }: { memberCount: number }) {
  return (
    <div className="squad-card">
      <h3>Ma Squad</h3>
      <p>{memberCount} membre{memberCount > 1 ? 's' : ''}</p>
    </div>
  )
}
```

### APRÈS

```tsx
// src/components/SquadCard.tsx
import { useT } from '../lib/i18n'

export function SquadCard({ memberCount }: { memberCount: number }) {
  const t = useT()

  return (
    <div className="squad-card">
      <h3>Ma Squad</h3>
      <p>{t('squads.members', memberCount)}</p>
    </div>
  )
}
```

## Exemple 4: Messages d'erreur

### AVANT

```tsx
// src/utils/errorHandler.ts
export function handleError(error: Error) {
  if (error.message.includes('network')) {
    showToast('Erreur de connexion')
  } else {
    showToast('Une erreur est survenue')
  }
}
```

### APRÈS

```tsx
// src/utils/errorHandler.ts
import { getT } from '../lib/i18n'
import { useI18nStore } from '../lib/i18n'

export function handleError(error: Error) {
  const locale = useI18nStore.getState().locale
  const t = getT(locale)

  if (error.message.includes('network')) {
    showToast(t('errors.network'))
  } else {
    showToast(t('errors.generic'))
  }
}
```

## Exemple 5: Formulaire de création

### AVANT

```tsx
// src/components/CreateSessionForm.tsx
export function CreateSessionForm() {
  return (
    <form>
      <h2>Créer une session</h2>
      <label>
        Jeu
        <input type="text" placeholder="Choisis un jeu" />
      </label>
      <label>
        Date et heure
        <input type="datetime-local" />
      </label>
      <button type="submit">Créer</button>
      <button type="button">Annuler</button>
    </form>
  )
}
```

### APRÈS

```tsx
// src/components/CreateSessionForm.tsx
import { useT } from '../lib/i18n'

export function CreateSessionForm() {
  const t = useT()

  return (
    <form>
      <h2>{t('sessions.create')}</h2>
      <label>
        {t('sessions.game')}
        <input type="text" placeholder={t('sessions.game')} />
      </label>
      <label>
        {t('sessions.datetime')}
        <input type="datetime-local" />
      </label>
      <button type="submit">{t('actions.create')}</button>
      <button type="button">{t('actions.cancel')}</button>
    </form>
  )
}
```

## Exemple 6: Composant avec état et toast

### AVANT

```tsx
// src/components/DeleteButton.tsx
import { showSuccess, showError } from '../lib/toast'

export function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const handleDelete = async () => {
    try {
      await onDelete()
      showSuccess('Supprimé avec succès')
    } catch {
      showError('Erreur lors de la suppression')
    }
  }

  return <button onClick={handleDelete}>Supprimer</button>
}
```

### APRÈS

```tsx
// src/components/DeleteButton.tsx
import { useT } from '../lib/i18n'
import { showSuccess, showError } from '../lib/toast'

export function DeleteButton({ onDelete }: { onDelete: () => Promise<void> }) {
  const t = useT()

  const handleDelete = async () => {
    try {
      await onDelete()
      showSuccess(t('success.deleted'))
    } catch {
      showError(t('errors.generic'))
    }
  }

  return <button onClick={handleDelete}>{t('actions.delete')}</button>
}
```

## Exemple 7: Temps relatif

### AVANT

```tsx
// src/components/ActivityItem.tsx
export function ActivityItem({ timestamp }: { timestamp: Date }) {
  const now = Date.now()
  const diff = now - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  return (
    <div className="activity-item">
      <p>Il y a {hours}h</p>
    </div>
  )
}
```

### APRÈS

```tsx
// src/components/ActivityItem.tsx
import { useT } from '../lib/i18n'

export function ActivityItem({ timestamp }: { timestamp: Date }) {
  const t = useT()
  const now = Date.now()
  const diff = now - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))

  return (
    <div className="activity-item">
      <p>{t('time.hoursAgo', hours)}</p>
    </div>
  )
}
```

## Checklist de migration

Pour chaque composant à migrer:

1. ✅ Importer `useT` depuis `../lib/i18n`
2. ✅ Appeler `const t = useT()` au début du composant
3. ✅ Remplacer les chaînes hardcodées par `t('key')`
4. ✅ Pour les pluriels/nombres, utiliser `t('key', count)`
5. ✅ Vérifier que les clés existent dans `fr.ts` et `en.ts`
6. ✅ Si une clé manque, l'ajouter dans les deux fichiers

## Priorités de migration

### Phase 1: Navigation & actions (impact maximal)
- TopBar / Sidebar
- Boutons d'action globaux
- États vides

### Phase 2: Messages système
- Toasts (succès/erreur)
- Dialogs de confirmation
- Messages de chargement

### Phase 3: Pages principales
- Home
- Sessions
- Squads
- Messages

### Phase 4: Pages secondaires
- Settings (déjà fait ✅)
- Profile
- Discover
- Premium

## Ajouter une nouvelle clé de traduction

Si une clé n'existe pas encore:

### 1. Ajouter dans fr.ts

```typescript
// src/locales/fr.ts
export const fr = {
  // ... autres clés ...
  myNewSection: {
    title: 'Mon nouveau titre',
    description: 'Ma description',
  },
}
```

### 2. Ajouter dans en.ts

```typescript
// src/locales/en.ts
export const en: TranslationKeys = {
  // ... autres clés ...
  myNewSection: {
    title: 'My new title',
    description: 'My description',
  },
}
```

### 3. Utiliser dans le composant

```tsx
const t = useT()
return <h1>{t('myNewSection.title')}</h1>
```

## Performance

Le système i18n est ultra-léger et n'a **aucun impact sur les performances**:

- ✅ Pas de fetch/download de fichiers JSON
- ✅ Traductions incluses dans le bundle (tree-shaken si non utilisées)
- ✅ Zustand store avec sélecteurs optimisés
- ✅ Pas de re-render inutile (uniquement si la locale change)

## Questions fréquentes

### Q: Dois-je tout migrer d'un coup?
**R:** Non! Le système est conçu pour une migration progressive. L'app fonctionne parfaitement avec un mix de textes traduits et hardcodés.

### Q: Que se passe-t-il si une traduction manque?
**R:** La clé est affichée (ex: "nav.home") + un warning en console en développement. Cela permet de détecter facilement les traductions manquantes.

### Q: Comment gérer les textes longs (descriptions, etc.)?
**R:** Ajoutez-les normalement dans les fichiers de traduction. Vous pouvez utiliser des strings multilignes en TypeScript:

```typescript
export const fr = {
  longText: `
    Ceci est un texte très long
    qui peut s'étendre sur plusieurs lignes.
  `
}
```

### Q: Comment gérer les variables dans les traductions?
**R:** Utilisez des fonctions pour les traductions avec variables:

```typescript
// Dans fr.ts
welcome: (name: string) => `Bienvenue ${name} !`

// Utilisation
t('welcome', 'Alice') // "Bienvenue Alice !"
```
