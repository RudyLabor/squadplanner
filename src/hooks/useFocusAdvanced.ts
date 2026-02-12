import { useEffect, useRef, useCallback } from 'react'
import { useAnnounce } from './useFocusManagement'

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
            nextIndex = wrap ? (index + 1) % items.length : Math.min(index + 1, items.length - 1)
          }
          break
        case 'ArrowLeft':
          if (isHorizontal) {
            nextIndex = wrap ? (index - 1 + items.length) % items.length : Math.max(index - 1, 0)
          }
          break
        case 'ArrowDown':
          if (isVertical) {
            nextIndex = wrap ? (index + 1) % items.length : Math.min(index + 1, items.length - 1)
          }
          break
        case 'ArrowUp':
          if (isVertical) {
            nextIndex = wrap ? (index - 1 + items.length) % items.length : Math.max(index - 1, 0)
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

    items.forEach((item) => {
      item.addEventListener('keydown', handleKeyDown)
    })

    return () => {
      items.forEach((item) => {
        item.removeEventListener('keydown', handleKeyDown)
      })
    }
  }, [items, orientation, wrap])
}

export function useA11yAnnouncements() {
  const announce = useAnnounce()

  const announceAction = useCallback(
    (action: string) => {
      announce(action, 'polite')
    },
    [announce]
  )

  const announceError = useCallback(
    (error: string) => {
      announce(error, 'assertive')
    },
    [announce]
  )

  const announceLoading = useCallback(
    (isLoading: boolean, context?: string) => {
      if (isLoading) {
        announce(context ? `Loading ${context}...` : 'Loading...', 'polite')
      } else {
        announce(context ? `${context} loaded` : 'Loaded', 'polite')
      }
    },
    [announce]
  )

  const announceNavigation = useCallback(
    (pageName: string) => {
      announce(`Navigated to ${pageName}`, 'polite')
    },
    [announce]
  )

  return { announceAction, announceError, announceLoading, announceNavigation }
}
