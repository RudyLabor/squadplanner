/**
 * EXEMPLES D'UTILISATION - Phase 3 UX Obsessionnelle
 *
 * Ce fichier montre comment utiliser les nouvelles utilitaires d'accessibilité,
 * de gestion d'erreurs et de navigation au clavier.
 */

import { useState } from 'react'
import { FormError } from '../FormError'
import { useFormError } from '../../hooks/useFormError'
import { announce } from '../../lib/announce'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { Tabs, TabsList, Tab, TabsContent } from '../ui/Tabs'

// === EXEMPLE 1: Formulaire avec gestion d'erreurs ===
export function LoginFormExample() {
  const { error, humanMessage, handleError, clearError, isRetrying, canRetry, retry } =
    useFormError({
      maxRetries: 3,
    })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      // Simulation d'une requête réseau
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: 'user@example.com', password: 'password' }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      // Succès
      announce('Connexion réussie ! Redirection...', 'assertive')
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          className="w-full px-3 py-2 border border-border-subtle rounded-lg"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          className="w-full px-3 py-2 border border-border-subtle rounded-lg"
          placeholder="••••••"
        />
      </div>

      {/* Affiche l'erreur avec shake et annonce */}
      <FormError
        error={error}
        fieldName="credentials"
        onRetry={async () => {
          await retry(() => handleSubmit({} as React.FormEvent))
        }}
      />

      <button
        type="submit"
        disabled={isRetrying}
        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover disabled:opacity-50"
      >
        {isRetrying ? 'Connexion en cours...' : 'Se connecter'}
      </button>

      {!canRetry && error && (
        <p className="text-sm text-error">Trop de tentatives. Réessaie dans quelques minutes.</p>
      )}
    </form>
  )
}

// === EXEMPLE 2: Modal avec focus trap ===
export function ModalExample() {
  const [isOpen, setIsOpen] = useState(false)
  const dialogRef = useFocusTrap(isOpen, () => setIsOpen(false))

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
      >
        Ouvrir la modale
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        ref={dialogRef}
        role="dialog"
        aria-labelledby="dialog-title"
        className="bg-bg-surface rounded-lg p-6 max-w-md w-full focus-trap-active"
      >
        <h2 id="dialog-title" className="text-xl font-bold mb-4">
          Confirmation
        </h2>

        <p className="text-text-secondary mb-6">Veux-tu vraiment effectuer cette action ?</p>

        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(false)}
            className="flex-1 px-4 py-2 bg-bg-elevated border border-border-subtle rounded-lg hover:bg-bg-hover"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              announce('Action confirmée', 'assertive')
              setIsOpen(false)
            }}
            className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  )
}

// === EXEMPLE 3: Navigation au clavier dans les onglets ===
export function TabsNavigationExample() {
  const [activeTab, setActiveTab] = useState('profile')

  return (
    <Tabs value={activeTab} onChange={setActiveTab} variant="pills">
      <TabsList className="mb-4">
        <Tab value="profile" icon={<span>👤</span>}>
          Profil
        </Tab>
        <Tab value="settings" icon={<span>⚙️</span>}>
          Paramètres
        </Tab>
        <Tab value="notifications" icon={<span>🔔</span>}>
          Notifications
        </Tab>
        <Tab value="privacy" icon={<span>🔒</span>}>
          Confidentialité
        </Tab>
      </TabsList>

      <TabsContent value="profile" className="p-4">
        <h2 className="text-lg font-bold mb-3">Profil</h2>
        <p className="text-text-secondary">
          Naviguer avec les flèches: ArrowLeft/ArrowRight, ou Home/End pour aller aux extrémités.
        </p>
      </TabsContent>

      <TabsContent value="settings" className="p-4">
        <h2 className="text-lg font-bold mb-3">Paramètres</h2>
        <p className="text-text-secondary">
          Les touches de clavier sont gérées automatiquement par le composant Tabs.
        </p>
      </TabsContent>

      <TabsContent value="notifications" className="p-4">
        <h2 className="text-lg font-bold mb-3">Notifications</h2>
        <p className="text-text-secondary">Le focus est annoncé aux lecteurs d'écran.</p>
      </TabsContent>

      <TabsContent value="privacy" className="p-4">
        <h2 className="text-lg font-bold mb-3">Confidentialité</h2>
        <p className="text-text-secondary">Fonctionne avec NVDA, JAWS, VoiceOver et TalkBack.</p>
      </TabsContent>
    </Tabs>
  )
}

// === EXEMPLE 4: Annonce d'événements ===
export function AnnouncementExample() {
  const [count, setCount] = useState(0)

  const handleIncrement = () => {
    const newCount = count + 1
    setCount(newCount)
    announce(`Compteur augmenté à ${newCount}`, 'polite')
  }

  const handleError = () => {
    announce('Une erreur est survenue. Réessaie ou contacte le support.', 'assertive')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <p className="text-lg font-bold">Compteur: {count}</p>
        <button
          onClick={handleIncrement}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
        >
          +1
        </button>
      </div>

      <button
        onClick={handleError}
        className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error-hover"
      >
        Déclencher erreur
      </button>

      <p className="text-sm text-text-secondary">
        Les annonces sont envoyées aux régions aria-live et audibles via les lecteurs d'écran.
      </p>
    </div>
  )
}

// === EXEMPLE 5: Intégration complète ===
export function CompleteAccessibilityExample() {
  const [activeExample, setActiveExample] = useState<'login' | 'modal' | 'tabs' | 'announce'>(
    'login'
  )

  return (
    <div className="space-y-8 p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Exemples d'accessibilité - Phase 3</h1>

      <Tabs value={activeExample} onChange={(v) => setActiveExample(v as any)} variant="pills">
        <TabsList>
          <Tab value="login">Formulaire</Tab>
          <Tab value="modal">Modale</Tab>
          <Tab value="tabs">Onglets</Tab>
          <Tab value="announce">Annonces</Tab>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <LoginFormExample />
        </TabsContent>

        <TabsContent value="modal" className="mt-6">
          <ModalExample />
        </TabsContent>

        <TabsContent value="tabs" className="mt-6">
          <TabsNavigationExample />
        </TabsContent>

        <TabsContent value="announce" className="mt-6">
          <AnnouncementExample />
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
        <h3 className="font-bold mb-2">Conseils de test:</h3>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>✓ Appuie sur Tab pour naviguer entre les éléments</li>
          <li>✓ Appuie sur Entrée ou Espace pour activer les boutons</li>
          <li>✓ Dans les onglets: Flèches, Home, End</li>
          <li>✓ Utilise un lecteur d'écran pour les annonces</li>
          <li>✓ Teste avec prefers-reduced-motion pour vérifier les animations</li>
        </ul>
      </div>
    </div>
  )
}
