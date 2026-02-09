/**
 * PHASE - Focus Management Hook
 *
 * Manages focus for accessibility, especially after navigation
 * and in modal/dialog contexts.
 */
import { useEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Focus the main content area after navigation
 * This helps screen reader users by announcing the new page
 */
export function useFocusOnNavigate() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const announce = useAnnounce()

  useEffect(() => {
    // Skip focus on initial render
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Find the main content area
    const mainContent = document.getElementById('main-content') || document.querySelector('main')

    if (mainContent) {
      // Set tabindex temporarily to make it focusable
      const prevTabIndex = mainContent.getAttribute('tabindex')
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus({ preventScroll: true })

      // Remove tabindex after focus (unless it was already set)
      if (!prevTabIndex) {
        mainContent.removeAttribute('tabindex')
      }
    }

    // Announce the page title to screen readers
    const pageTitle = document.title
    if (pageTitle) {
      announce(pageTitle.replace(' — Squad Planner', ''))
    }
  }, [location.pathname, announce])
}

/**
 * Trap focus within a container (for modals, dialogs)
 * Keeps focus inside the container when active.
 *
 * @param isActive - Whether the focus trap is active
 * @param onEscape - Optional callback when Escape is pressed
 * @returns RefObject to attach to the container element
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  isActive: boolean = true,
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

    // Focus the first focusable element when trap activates
    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      if (e.key === 'Tab') {
        // Re-query elements in case DOM changed
        const currentFocusableElements = container.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const currentFirst = currentFocusableElements[0]
        const currentLast = currentFocusableElements[currentFocusableElements.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === currentFirst) {
            e.preventDefault()
            currentLast?.focus()
          }
        } else {
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

/**
 * Restore focus to a previous element when component unmounts
 */
export function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement

    return () => {
      // Restore focus when unmounting
      previousActiveElement.current?.focus()
    }
  }, [])
}

/**
 * Announce a message to screen readers using ARIA live regions
 */
export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // Find or create the live region
    let liveRegion = document.getElementById(`aria-live-${priority}`)

    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = `aria-live-${priority}`
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    // Clear and set the message (needs to change for screen readers to announce)
    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion!.textContent = message
    }, 100)
  }, [])

  return announce
}

/**
 * Skip link functionality
 */
export function useSkipLink() {
  const handleSkipToContent = useCallback((e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault()
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus()
      mainContent.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  return handleSkipToContent
}

/**
 * Auto-focus an element on mount
 */
export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    // Small delay to ensure element is rendered
    const timeoutId = setTimeout(() => {
      ref.current?.focus()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  return ref
}

/**
 * Roving tabindex for lists/grids
 * Only one item in the group is tabbable at a time
 */
export function useRovingTabindex<T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical' | 'both'
    wrap?: boolean
  } = {}
) {
  const { orientation = 'vertical', wrap = true } = options
  const currentIndex = useRef(0)

  useEffect(() => {
    if (items.length === 0) return

    // Set initial tabindex
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === currentIndex.current ? '0' : '-1')
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const index = items.indexOf(target as T)
      if (index === -1) return

      let nextIndex = index

      const isHorizontal = orientation === 'horizontal' || orientation === 'both'
      const isVertical = orientation === 'vertical' || orientation === 'both'

      switch (e.key) {
        case 'ArrowRight':
          if (isHorizontal) {
            nextIndex = wrap
              ? (index + 1) % items.length
              : Math.min(index + 1, items.length - 1)
          }
          break
        case 'ArrowLeft':
          if (isHorizontal) {
            nextIndex = wrap
              ? (index - 1 + items.length) % items.length
              : Math.max(index - 1, 0)
          }
          break
        case 'ArrowDown':
          if (isVertical) {
            nextIndex = wrap
              ? (index + 1) % items.length
              : Math.min(index + 1, items.length - 1)
          }
          break
        case 'ArrowUp':
          if (isVertical) {
            nextIndex = wrap
              ? (index - 1 + items.length) % items.length
              : Math.max(index - 1, 0)
          }
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = items.length - 1
          break
        default:
          return
      }

      if (nextIndex !== index) {
        e.preventDefault()
        items[index].setAttribute('tabindex', '-1')
        items[nextIndex].setAttribute('tabindex', '0')
        items[nextIndex].focus()
        currentIndex.current = nextIndex
      }
    }

    items.forEach(item => {
      item.addEventListener('keydown', handleKeyDown)
    })

    return () => {
      items.forEach(item => {
        item.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [items, orientation, wrap])
}

/**
 * Provides helper functions for common screen reader announcements.
 * Uses useAnnounce() internally with appropriate priorities.
 */
export function useA11yAnnouncements() {
  const announce = useAnnounce()

  const announceAction = useCallback((action: string) => {
    announce(action, 'polite')
  }, [announce])

  const announceError = useCallback((error: string) => {
    announce(error, 'assertive')
  }, [announce])

  const announceLoading = useCallback((isLoading: boolean, context?: string) => {
    if (isLoading) {
      announce(context ? `Loading ${context}...` : 'Loading...', 'polite')
    } else {
      announce(context ? `${context} loaded` : 'Loaded', 'polite')
    }
  }, [announce])

  const announceNavigation = useCallback((pageName: string) => {
    announce(`Navigated to ${pageName}`, 'polite')
  }, [announce])

  return { announceAction, announceError, announceLoading, announceNavigation }
}
