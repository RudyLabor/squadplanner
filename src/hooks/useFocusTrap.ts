import { useEffect, useRef, type RefObject } from 'react'

/**
 * Hook pour créer un focus trap dans un conteneur
 * Garde le focus à l'intérieur du conteneur quand il est actif
 *
 * @param isActive - Si le focus trap est actif
 * @param onEscape - Callback optionnel appelé quand Escape est pressé
 * @returns RefObject à attacher au conteneur
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean,
  onEscape?: () => void
): RefObject<T | null> {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]

    // Focus le premier élément focusable au montage
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      // Gestion de la touche Escape
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      // Gestion du focus trap avec Tab
      if (e.key === 'Tab') {
        // Re-query les éléments au cas où le DOM aurait changé
        const currentFocusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const currentFirst = currentFocusableElements[0]
        const currentLast = currentFocusableElements[currentFocusableElements.length - 1]

        if (e.shiftKey) {
          // Shift+Tab : retour au dernier si on est sur le premier
          if (document.activeElement === currentFirst) {
            e.preventDefault()
            currentLast?.focus()
          }
        } else {
          // Tab : aller au premier si on est sur le dernier
          if (document.activeElement === currentLast) {
            e.preventDefault()
            currentFirst?.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive, onEscape])

  return containerRef
}

export default useFocusTrap
