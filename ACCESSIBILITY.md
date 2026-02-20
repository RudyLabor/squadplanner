# Guide d'Accessibilité - Squad Planner

## Vue d'ensemble

Le projet Squad Planner respecte les standards WCAG 2.1 Level AA. Cette documentation explique comment utiliser les utilitaires d'accessibilité dans l'application.

## Table des matières

1. [Navigation au clavier](#navigation-au-clavier)
2. [Gestion des erreurs](#gestion-des-erreurs)
3. [Annonces pour lecteurs d'écran](#annonces-pour-lecteurs-décran)
4. [Focus Management](#focus-management)
5. [Animations et mouvement](#animations-et-mouvement)
6. [Checklist d'accessibilité](#checklist-daccessibilité)

---

## Navigation au clavier

### Skip-link (Passer au contenu)

Le skip-link permet de sauter directement au contenu principal, en évitant la navigation.

**Utilisation:** Appuyez sur Tab au chargement de la page pour voir le skip-link.

```tsx
// Cela est déjà implémenté dans root.tsx
<a href="#main-content" className="skip-link">
  Aller au contenu principal
</a>
```

### Onglets (Tabs)

Le composant `Tabs` supporte la navigation complète au clavier :

| Touche | Action |
|--------|--------|
| ArrowLeft | Onglet précédent |
| ArrowRight | Onglet suivant |
| Home | Premier onglet |
| End | Dernier onglet |
| Tab | Focus sur l'onglet actif |
| Entrée/Espace | Active l'onglet en focus |

```tsx
import { Tabs, TabsList, Tab, TabsContent } from '@/components/ui/Tabs'

export function MyTabs() {
  const [active, setActive] = useState('tab1')

  return (
    <Tabs value={active} onChange={setActive}>
      <TabsList>
        <Tab value="tab1">Onglet 1</Tab>
        <Tab value="tab2">Onglet 2</Tab>
      </TabsList>
      <TabsContent value="tab1">Contenu 1</TabsContent>
      <TabsContent value="tab2">Contenu 2</TabsContent>
    </Tabs>
  )
}
```

### Focus Management Général

Tous les éléments interactifs doivent être accessibles au clavier :

- **Boutons:** Activables avec Tab, Entrée, Espace
- **Liens:** Activables avec Tab, Entrée
- **Champs de formulaire:** Navigables avec Tab
- **Modales:** Focus enfermé (Tab boucle à l'intérieur)

---

## Gestion des erreurs

### Utilitaire humanizeError

Convertit les erreurs techniques en messages français compréhensibles pour l'utilisateur.

```typescript
import { humanizeError } from '@/lib/errorMessages'

try {
  await fetchData()
} catch (error) {
  const userMessage = humanizeError(error)
  // 'Failed to fetch' → 'Connexion perdue. On réessaie automatiquement...'
}
```

### Composant FormError

Affiche les erreurs avec :
- Icône visuelle
- Message humanisé
- Animation de secousse
- Bouton "Réessayer" optionnel
- Annonce au lecteur d'écran

```tsx
import { FormError } from '@/components/FormError'
import { useState } from 'react'

export function MyForm() {
  const [error, setError] = useState<Error | null>(null)

  return (
    <form>
      <FormError
        error={error}
        fieldName="email"
        onRetry={() => handleSubmit()}
      />
    </form>
  )
}
```

### Hook useFormError

Gère l'état des erreurs avec retry automatique et exponential backoff.

```typescript
import { useFormError } from '@/hooks/useFormError'

export function RegistrationForm() {
  const {
    error,
    humanMessage, // Message humanisé
    handleError,
    clearError,
    retry, // Réessayer avec backoff exponentiel
    isRetrying,
    canRetry, // true tant que < maxRetries
    attempt, // Numéro de la tentative
  } = useFormError({ maxRetries: 3 })

  const handleSubmit = async () => {
    clearError()
    try {
      await registerUser()
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <>
      <FormError error={error} onRetry={() => retry(handleSubmit)} />
      {!canRetry && error && (
        <p className="text-error text-sm">
          Trop de tentatives. Réessaie dans quelques minutes.
        </p>
      )}
    </>
  )
}
```

---

## Annonces pour lecteurs d'écran

### Fonction announce

Envoie un message aux régions aria-live pour les lecteurs d'écran.

```typescript
import { announce } from '@/lib/announce'

// Non-urgent (polite) - par défaut
announce('Votre profil a été mis à jour')

// Urgent (assertive) - pour les erreurs ou les avertissements
announce('Erreur: Veuillez vérifier votre connexion internet', 'assertive')
```

### Types de priorité

| Priorité | Utilisation | Exemple |
|----------|------------|---------|
| `polite` | Annonces non-urgentes | Succès, confirmations |
| `assertive` | Avertissements, erreurs | Erreurs de validation |

### Intégration avec FormError

Le composant FormError annonce automatiquement les erreurs de manière assertive :

```tsx
<FormError error={error} />
// Annonce automatiquement le message d'erreur aux lecteurs d'écran
```

---

## Focus Management

### Hook useFocusTrap

Enferme le focus dans une modale ou un dialog. Tab boucle à l'intérieur du conteneur.

```tsx
import { useFocusTrap } from '@/hooks/useFocusTrap'

export function Modal({ isOpen, onClose }) {
  const dialogRef = useFocusTrap(isOpen, () => onClose())

  if (!isOpen) return null

  return (
    <div className="modal" ref={dialogRef} role="dialog">
      {/* Le focus est enfermé ici */}
      <button onClick={onClose}>Fermer</button>
      <button>Action 1</button>
      <button>Action 2</button>
    </div>
  )
}
```

### Hook useFocusOnNavigate

Déplace automatiquement le focus vers #main-content lors de la navigation.

```typescript
import { useFocusOnNavigate } from '@/hooks/useFocusManagement'

export function Page() {
  useFocusOnNavigate() // Utilisé au niveau de la page

  return <main id="main-content">Contenu</main>
}
```

### Hook useAutoFocus

Focus automatique après le montage du composant (utile pour les champs de recherche).

```tsx
import { useAutoFocus } from '@/hooks/useFocusManagement'

export function SearchBar() {
  const inputRef = useAutoFocus()

  return <input ref={inputRef} type="search" placeholder="Rechercher..." />
}
```

---

## Animations et mouvement

### Respecter prefers-reduced-motion

Tous les utilisateurs avec `prefers-reduced-motion: reduce` doivent voir **aucune animation**.

```css
/* Exemple: désactiver l'animation pour les utilisateurs sensibles au mouvement */
@media (prefers-reduced-motion: reduce) {
  .animate-something {
    animation: none;
    transition: none;
  }
}
```

**Test:** Activer "Reduce motion" dans les paramètres d'accessibilité du système.

### Animation d'erreur (field-shake)

L'animation de secousse est désactivée pour les utilisateurs sensibles au mouvement.

```tsx
<input
  className={error ? 'field-shake' : ''}
  // Animation automatiquement désactivée avec prefers-reduced-motion
/>
```

---

## Checklist d'accessibilité

Avant de déployer une nouvelle fonctionnalité, vérifiez les points suivants :

### Clavier

- [ ] Tous les éléments interactifs sont accessibles au clavier
- [ ] L'ordre de tabulation est logique (de gauche à droite, de haut en bas)
- [ ] Les modales ont un focus trap (Tab boucle)
- [ ] Le skip-link est visible et fonctionnel

### Lecteurs d'écran

- [ ] Les images ont des `alt` texts descriptifs
- [ ] Les formulaires ont des `<label>` associés
- [ ] Les erreurs sont annoncées avec `role="alert"`
- [ ] Les changements dynamiques sont annoncés via aria-live
- [ ] Les modales ont `role="dialog"` et `aria-labelledby`

### Couleur et contraste

- [ ] Contraste minimum: WCAG AA (4.5:1 pour le texte normal)
- [ ] Les informations ne sont pas communiquées par la couleur seule
- [ ] Les éléments de formulaire ont des bordures visibles

### Mouvement et clignotement

- [ ] Aucun élément ne clignote plus de 3 fois par seconde
- [ ] Les animations respectent `prefers-reduced-motion`
- [ ] Les vidéos/GIF auto-play n'existent que si silence par défaut

### Structure et sémantique

- [ ] Utiliser `<h1>`, `<h2>`, etc. dans le bon ordre (pas de sauts)
- [ ] Utiliser `<button>` pour les boutons, `<a>` pour les liens
- [ ] Les éléments de formulaire ont les bons types (`type="email"`, etc.)
- [ ] Les éléments implicitement cachés ont `aria-hidden="true"`

### Tests avec des outils réels

Avant de considérer la tâche terminée, testez avec:

- **NVDA** (Windows) - gratuit, open-source
- **JAWS** (Windows) - commercial mais très courant
- **VoiceOver** (macOS/iOS) - gratuit, inclus
- **TalkBack** (Android) - gratuit, inclus
- **Axe DevTools** (Chrome/Firefox) - audit automatisé

---

## Ressources

### Documentation

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Outils de test

- [Axe DevTools](https://www.deque.com/axe/devtools/) - Audit d'accessibilité
- [WAVE](https://wave.webaim.org/) - Visualiseur d'accessibilité
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Audit général
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/) - Contraste

### Lecteurs d'écran

- [NVDA](https://www.nvaccess.org/) - Gratuit, Windows/Linux
- [JAWS Trial](https://www.freedomscientific.com/products/software/jaws/download/) - 40 min de test
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Gratuit, Apple

---

## Support

Si vous avez des questions sur l'accessibilité :

1. Consultez ce guide
2. Vérifiez les exemples dans `src/components/examples/AccessibilityExamples.tsx`
3. Testez avec les outils recommandés
4. Contactez l'équipe ou ouvrez une issue

---

*Dernière mise à jour: 20 février 2026*
