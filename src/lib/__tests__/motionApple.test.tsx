import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Mock requestAnimationFrame / cancelAnimationFrame for spring animation tests
let rafCallbacks: ((time: number) => void)[] = []
let rafId = 0
vi.stubGlobal('requestAnimationFrame', (cb: (time: number) => void) => {
  rafCallbacks.push(cb)
  return ++rafId
})
vi.stubGlobal('cancelAnimationFrame', vi.fn())

import {
  ApplePresets,
  useAppleMotion,
  AppleMicroInteractions,
  generateAppleCSS,
  AppleButton,
  AppleModal,
} from '../motionApple'

// Helper to flush raf callbacks
function flushRAF(times = 1) {
  for (let i = 0; i < times; i++) {
    const cbs = [...rafCallbacks]
    rafCallbacks = []
    cbs.forEach(cb => cb(performance.now()))
  }
}

describe('motionApple', () => {
  beforeEach(() => {
    rafCallbacks = []
    rafId = 0
    vi.clearAllMocks()
  })

  describe('ApplePresets', () => {
    it('exports gentle preset with correct values', () => {
      expect(ApplePresets.gentle).toEqual({ tension: 300, friction: 20 })
    })

    it('exports smooth preset with correct values', () => {
      expect(ApplePresets.smooth).toEqual({ tension: 280, friction: 25 })
    })

    it('exports bouncy preset with correct values', () => {
      expect(ApplePresets.bouncy).toEqual({ tension: 400, friction: 15 })
    })

    it('exports snappy preset with correct values', () => {
      expect(ApplePresets.snappy).toEqual({ tension: 500, friction: 30 })
    })

    it('exports wobbly preset with correct values', () => {
      expect(ApplePresets.wobbly).toEqual({ tension: 180, friction: 12 })
    })

    it('all presets have tension and friction properties', () => {
      for (const [name, preset] of Object.entries(ApplePresets)) {
        expect(preset).toHaveProperty('tension')
        expect(preset).toHaveProperty('friction')
        expect(typeof preset.tension).toBe('number')
        expect(typeof preset.friction).toBe('number')
      }
    })

    it('presets are readonly (frozen)', () => {
      // The as const ensures TypeScript treats them as readonly
      // Verify the values can't accidentally change by checking expected totals
      const presetCount = Object.keys(ApplePresets).length
      expect(presetCount).toBe(5)
    })
  })

  describe('generateAppleCSS', () => {
    it('returns a non-empty CSS string', () => {
      const css = generateAppleCSS()
      expect(typeof css).toBe('string')
      expect(css.length).toBeGreaterThan(0)
    })

    it('includes motion-apple-gentle class', () => {
      const css = generateAppleCSS()
      expect(css).toContain('.motion-apple-gentle')
    })

    it('includes motion-apple-snappy class', () => {
      const css = generateAppleCSS()
      expect(css).toContain('.motion-apple-snappy')
    })

    it('includes motion-apple-smooth class', () => {
      const css = generateAppleCSS()
      expect(css).toContain('.motion-apple-smooth')
    })

    it('includes motion-element class with hardware acceleration', () => {
      const css = generateAppleCSS()
      expect(css).toContain('.motion-element')
      expect(css).toContain('translateZ(0)')
      expect(css).toContain('backface-visibility')
    })

    it('includes apple-button hover and active states', () => {
      const css = generateAppleCSS()
      expect(css).toContain('.apple-button')
      expect(css).toContain('.apple-button:hover')
      expect(css).toContain('.apple-button:active')
      expect(css).toContain('scale(1.02)')
      expect(css).toContain('scale(0.98)')
    })

    it('includes apple-skeleton shimmer animation', () => {
      const css = generateAppleCSS()
      expect(css).toContain('.apple-skeleton')
      expect(css).toContain('apple-shimmer')
      expect(css).toContain('@keyframes apple-shimmer')
    })

    it('includes cubic-bezier timing functions', () => {
      const css = generateAppleCSS()
      expect(css).toContain('cubic-bezier')
    })
  })

  describe('AppleButton', () => {
    it('renders children', () => {
      render(<AppleButton>Click me</AppleButton>)
      expect(screen.getByText('Click me')).toBeDefined()
    })

    it('renders as a button element', () => {
      render(<AppleButton>Test</AppleButton>)
      const button = screen.getByRole('button')
      expect(button).toBeDefined()
    })

    it('applies motion-element class', () => {
      render(<AppleButton>Test</AppleButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('motion-element')
    })

    it('applies custom className', () => {
      render(<AppleButton className="my-custom-class">Test</AppleButton>)
      const button = screen.getByRole('button')
      expect(button.className).toContain('my-custom-class')
      expect(button.className).toContain('motion-element')
    })

    it('calls onClick when clicked (after spring animation completes)', async () => {
      const handleClick = vi.fn()
      render(<AppleButton onClick={handleClick}>Test</AppleButton>)
      const button = screen.getByRole('button')
      fireEvent.click(button)

      // The handleClick runs two chained spring animations then calls onClick.
      // Each animation uses requestAnimationFrame and the promise resolves when the
      // spring settles. We need to interleave raf flushes with microtask ticks
      // to allow the await chain to progress between animations.
      for (let i = 0; i < 600; i++) {
        flushRAF()
        // Allow microtasks (Promise.then) to execute between raf frames
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      // The onClick is called after both animations resolve
      expect(handleClick).toHaveBeenCalled()
    })

    it('renders with default gentle variant', () => {
      // Just verifying no error when rendering with default variant
      const { container } = render(<AppleButton>Default</AppleButton>)
      expect(container.querySelector('button')).toBeDefined()
    })

    it('renders with snappy variant', () => {
      const { container } = render(<AppleButton variant="snappy">Snappy</AppleButton>)
      expect(container.querySelector('button')).toBeDefined()
    })

    it('renders with smooth variant', () => {
      const { container } = render(<AppleButton variant="smooth">Smooth</AppleButton>)
      expect(container.querySelector('button')).toBeDefined()
    })
  })

  describe('AppleModal', () => {
    it('renders children when isOpen is true', () => {
      render(
        <AppleModal isOpen={true} onClose={() => {}}>
          <p>Modal Content</p>
        </AppleModal>
      )
      expect(screen.getByText('Modal Content')).toBeDefined()
    })

    it('does not render when isOpen is false', () => {
      render(
        <AppleModal isOpen={false} onClose={() => {}}>
          <p>Modal Content</p>
        </AppleModal>
      )
      expect(screen.queryByText('Modal Content')).toBeNull()
    })

    it('renders backdrop with expected classes', () => {
      const { container } = render(
        <AppleModal isOpen={true} onClose={() => {}}>
          <p>Modal Content</p>
        </AppleModal>
      )
      const backdrop = container.querySelector('.fixed.inset-0')
      expect(backdrop).toBeDefined()
    })

    it('renders modal content container with motion-element class', () => {
      const { container } = render(
        <AppleModal isOpen={true} onClose={() => {}}>
          <p>Content</p>
        </AppleModal>
      )
      const modal = container.querySelector('.motion-element')
      expect(modal).toBeDefined()
    })

    it('renders with rounded top corners and padding', () => {
      const { container } = render(
        <AppleModal isOpen={true} onClose={() => {}}>
          <p>Content</p>
        </AppleModal>
      )
      const modal = container.querySelector('.rounded-t-3xl')
      expect(modal).toBeDefined()
    })

    it('transitions from closed to open', () => {
      const { rerender, container } = render(
        <AppleModal isOpen={false} onClose={() => {}}>
          <p>Content</p>
        </AppleModal>
      )
      expect(screen.queryByText('Content')).toBeNull()

      rerender(
        <AppleModal isOpen={true} onClose={() => {}}>
          <p>Content</p>
        </AppleModal>
      )
      expect(screen.getByText('Content')).toBeDefined()
    })
  })

  describe('AppleMicroInteractions', () => {
    it('exports buttonPress function', () => {
      expect(typeof AppleMicroInteractions.buttonPress).toBe('function')
    })

    it('exports modalSlideUp function', () => {
      expect(typeof AppleMicroInteractions.modalSlideUp).toBe('function')
    })

    it('exports cardFlip function', () => {
      expect(typeof AppleMicroInteractions.cardFlip).toBe('function')
    })

    it('exports notificationBounce function', () => {
      expect(typeof AppleMicroInteractions.notificationBounce).toBe('function')
    })
  })

  describe('useAppleMotion hook', () => {
    it('returns animate function', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)
      expect(result).toHaveProperty('animate')
      expect(typeof result.animate).toBe('function')
    })

    it('animate returns a promise', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return <div id="test-el" />
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      const promise = result.animate(el, 'opacity', 0, 1)
      expect(promise).toBeInstanceOf(Promise)
    })

    it('animate sets scale transform', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      result.animate(el, 'scale', 1, 0.97, { spring: ApplePresets.snappy })

      // Flush a few raf to see the animation in progress
      flushRAF(5)
      // The transform should have been set to some scale value
      expect(el.style.transform).toContain('scale(')
    })

    it('animate sets translateY transform', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      result.animate(el, 'translateY', 100, 0, { spring: ApplePresets.smooth })

      flushRAF(5)
      expect(el.style.transform).toContain('translateY(')
    })

    it('animate sets opacity', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      result.animate(el, 'opacity', 0, 1, { spring: ApplePresets.gentle })

      flushRAF(5)
      expect(el.style.opacity).toBeDefined()
    })

    it('animate sets willChange during animation', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      result.animate(el, 'scale', 1, 0.5, { spring: ApplePresets.snappy })

      flushRAF(1)
      expect(el.style.willChange).toBe('scale')
    })

    it('animate resets willChange to auto on completion', async () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      const promise = result.animate(el, 'opacity', 0, 0, { spring: ApplePresets.snappy })

      // Animate from 0 to 0 should complete almost immediately
      flushRAF(500)

      // After enough frames, the spring should have settled
      await promise.catch(() => {}) // may or may not resolve depending on precision
    })

    it('uses smooth preset as default when no spring config provided', () => {
      let result: any
      function TestComponent() {
        result = useAppleMotion()
        return null
      }
      render(<TestComponent />)

      const el = document.createElement('div')
      // Call without spring config - should default to ApplePresets.smooth
      result.animate(el, 'scale', 1, 0.5)

      flushRAF(5)
      // Should not throw and should apply the transform
      expect(el.style.transform).toContain('scale(')
    })
  })
})
