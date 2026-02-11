import { useEffect, useRef, useCallback } from 'react'
import type { RefObject } from 'react'
import { useLocation } from 'react-router-dom'

export { useRovingTabindex, useA11yAnnouncements } from './useFocusAdvanced'

export function useAnnounce() {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    let liveRegion = document.getElementById(`aria-live-${priority}`)

    if (!liveRegion) {
      liveRegion = document.createElement('div')
      liveRegion.id = `aria-live-${priority}`
      liveRegion.setAttribute('aria-live', priority)
      liveRegion.setAttribute('aria-atomic', 'true')
      liveRegion.className = 'sr-only'
      document.body.appendChild(liveRegion)
    }

    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion!.textContent = message
    }, 100)
  }, [])

  return announce
}

export function useFocusOnNavigate() {
  const location = useLocation()
  const isFirstRender = useRef(true)
  const announce = useAnnounce()

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const mainContent = document.getElementById('main-content') || document.querySelector('main')

    if (mainContent) {
      const prevTabIndex = mainContent.getAttribute('tabindex')
      mainContent.setAttribute('tabindex', '-1')
      mainContent.focus({ preventScroll: true })

      if (!prevTabIndex) {
        mainContent.removeAttribute('tabindex')
      }
    }

    const pageTitle = document.title
    if (pageTitle) {
      announce(pageTitle.replace(' — Squad Planner', ''))
    }
  }, [location.pathname, announce])
}

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

    firstElement?.focus()

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      if (e.key === 'Tab') {
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

export function useRestoreFocus() {
  const previousActiveElement = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previousActiveElement.current = document.activeElement as HTMLElement

    return () => {
      previousActiveElement.current?.focus()
    }
  }, [])
}

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

export function useAutoFocus<T extends HTMLElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      ref.current?.focus()
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [])

  return ref
}
