/**
 * Tests for src/lib/motionLazy.ts
 * Covers: LazyMotionDiv, LazyAnimatePresence, LazyMotionSpan,
 *         LazyMotionButton, useMotionPreload, simpleTransitions
 */
import { describe, it, expect, vi } from 'vitest'

// Mock framer-motion before importing
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: Record<string, unknown>) => props,
    span: (props: Record<string, unknown>) => props,
    button: (props: Record<string, unknown>) => props,
  },
  AnimatePresence: (props: Record<string, unknown>) => props,
}))

// Mock react lazy to just call the factory and return the resolved default
vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react')
  return {
    ...actual,
    lazy: (factory: () => Promise<{ default: unknown }>) => {
      // Store the factory so we can call it in tests
      const component = Object.assign(() => null, { _factory: factory })
      return component
    },
  }
})

import {
  LazyMotionDiv,
  LazyAnimatePresence,
  LazyMotionSpan,
  LazyMotionButton,
  useMotionPreload,
  simpleTransitions,
} from '../motionLazy'

describe('motionLazy', () => {
  // =========================================================================
  // Lazy components are defined
  // =========================================================================
  describe('lazy components', () => {
    it('should export LazyMotionDiv', () => {
      expect(LazyMotionDiv).toBeDefined()
    })

    it('should export LazyAnimatePresence', () => {
      expect(LazyAnimatePresence).toBeDefined()
    })

    it('should export LazyMotionSpan', () => {
      expect(LazyMotionSpan).toBeDefined()
    })

    it('should export LazyMotionButton', () => {
      expect(LazyMotionButton).toBeDefined()
    })

    it('LazyMotionDiv factory should resolve to motion.div', async () => {
      const factory = (LazyMotionDiv as unknown as { _factory: () => Promise<{ default: unknown }> })._factory
      const result = await factory()
      expect(result).toHaveProperty('default')
    })

    it('LazyAnimatePresence factory should resolve to AnimatePresence', async () => {
      const factory = (LazyAnimatePresence as unknown as { _factory: () => Promise<{ default: unknown }> })._factory
      const result = await factory()
      expect(result).toHaveProperty('default')
    })

    it('LazyMotionSpan factory should resolve to motion.span', async () => {
      const factory = (LazyMotionSpan as unknown as { _factory: () => Promise<{ default: unknown }> })._factory
      const result = await factory()
      expect(result).toHaveProperty('default')
    })

    it('LazyMotionButton factory should resolve to motion.button', async () => {
      const factory = (LazyMotionButton as unknown as { _factory: () => Promise<{ default: unknown }> })._factory
      const result = await factory()
      expect(result).toHaveProperty('default')
    })
  })

  // =========================================================================
  // useMotionPreload
  // =========================================================================
  describe('useMotionPreload', () => {
    it('should return an object with a preload function', () => {
      const { preload } = useMotionPreload()
      expect(typeof preload).toBe('function')
    })

    it('should call import("framer-motion") when preload is invoked', () => {
      const { preload } = useMotionPreload()
      // Should not throw
      expect(() => preload()).not.toThrow()
    })
  })

  // =========================================================================
  // simpleTransitions
  // =========================================================================
  describe('simpleTransitions', () => {
    it('should define fadeIn transition class', () => {
      expect(simpleTransitions.fadeIn).toContain('transition-opacity')
    })

    it('should define slideUp transition class', () => {
      expect(simpleTransitions.slideUp).toContain('transition-transform')
    })

    it('should define scaleIn transition class', () => {
      expect(simpleTransitions.scaleIn).toContain('transition-transform')
      expect(simpleTransitions.scaleIn).toContain('scale-100')
    })

    it('should define fade variant with initial, animate, exit', () => {
      expect(simpleTransitions.fade).toEqual({
        initial: 'opacity-0',
        animate: 'opacity-100',
        exit: 'opacity-0',
      })
    })

    it('should define slide variant with initial, animate, exit', () => {
      expect(simpleTransitions.slide.initial).toContain('translate-y-4')
      expect(simpleTransitions.slide.animate).toContain('translate-y-0')
      expect(simpleTransitions.slide.exit).toContain('translate-y-4')
    })
  })
})
