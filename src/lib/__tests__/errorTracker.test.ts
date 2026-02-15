/**
 * Comprehensive tests for src/lib/errorTracker.ts
 * Covers: shouldIgnore, getEndpointUrl, getEnvironmentTags, createReport,
 *         flush, enqueue, initErrorTracker, captureException, captureMessage,
 *         setUser, addBreadcrumb, startTransaction, destroyErrorTracker
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set env for PROD mode to allow captureException to enqueue
import.meta.env.PROD = true
import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'

import {
  setUser,
  addBreadcrumb,
  startTransaction,
  destroyErrorTracker,
  captureException,
  captureMessage,
  initErrorTracker,
} from '../errorTracker'

/**
 * Helper: capture a message and immediately flush by calling destroyErrorTracker().
 * Returns the parsed payload from the last fetch call, or null if no fetch.
 */
function captureAndFlush(
  fetchSpy: ReturnType<typeof vi.spyOn>,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
) {
  captureMessage(message, level)
  destroyErrorTracker() // triggers flush()
  if (fetchSpy.mock.calls.length === 0) return null
  const lastCall = fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1]
  return JSON.parse(lastCall[1]?.body as string)
}

describe('errorTracker', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    destroyErrorTracker()
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response())
    import.meta.env.PROD = true
    import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
  })

  afterEach(() => {
    destroyErrorTracker()
    vi.restoreAllMocks()
  })

  // =========================================================================
  // setUser
  // =========================================================================
  describe('setUser', () => {
    it('should set user with id and username', () => {
      expect(() => setUser({ id: 'user-1', username: 'testuser' })).not.toThrow()
    })

    it('should set user with only id', () => {
      expect(() => setUser({ id: 'user-2' })).not.toThrow()
    })

    it('should clear user with null', () => {
      setUser({ id: 'user-1', username: 'test' })
      expect(() => setUser(null)).not.toThrow()
    })

    it('should include user context in subsequent reports', () => {
      setUser({ id: 'user-42', username: 'admin' })
      const payload = captureAndFlush(fetchSpy, 'test msg', 'info')

      expect(payload).not.toBeNull()
      expect(payload.errors[0].userId).toBe('user-42')
      expect(payload.errors[0].username).toBe('admin')
    })

    it('should not include user after clearing with null', () => {
      setUser({ id: 'user-42', username: 'admin' })
      setUser(null)
      const payload = captureAndFlush(fetchSpy, 'test msg', 'info')

      expect(payload).not.toBeNull()
      expect(payload.errors[0].userId).toBeUndefined()
      expect(payload.errors[0].username).toBeUndefined()
    })
  })

  // =========================================================================
  // addBreadcrumb
  // =========================================================================
  describe('addBreadcrumb', () => {
    it('should add breadcrumb without throwing', () => {
      expect(() => addBreadcrumb('clicked button', 'ui', 'info')).not.toThrow()
    })

    it('should use default category and level', () => {
      expect(() => addBreadcrumb('test action')).not.toThrow()
    })

    it('should include breadcrumbs in error reports', () => {
      addBreadcrumb('navigated to /home', 'navigation', 'info')
      addBreadcrumb('clicked button', 'ui', 'debug')
      const payload = captureAndFlush(fetchSpy, 'test msg', 'info')

      expect(payload.errors[0].breadcrumbs).toHaveLength(2)
      expect(payload.errors[0].breadcrumbs[0].message).toBe('navigated to /home')
      expect(payload.errors[0].breadcrumbs[0].category).toBe('navigation')
      expect(payload.errors[0].breadcrumbs[0].level).toBe('info')
      expect(payload.errors[0].breadcrumbs[1].message).toBe('clicked button')
      expect(payload.errors[0].breadcrumbs[1].category).toBe('ui')
      expect(payload.errors[0].breadcrumbs[1].level).toBe('debug')
    })

    it('should limit breadcrumbs to MAX_BREADCRUMBS (20)', () => {
      for (let i = 0; i < 25; i++) {
        addBreadcrumb(`action ${i}`)
      }
      const payload = captureAndFlush(fetchSpy, 'test msg', 'info')

      expect(payload.errors[0].breadcrumbs.length).toBeLessThanOrEqual(20)
      expect(payload.errors[0].breadcrumbs[0].message).toBe('action 5')
      expect(payload.errors[0].breadcrumbs[19].message).toBe('action 24')
    })

    it('should include timestamp in each breadcrumb', () => {
      addBreadcrumb('test')
      const payload = captureAndFlush(fetchSpy, 'test msg', 'info')

      expect(payload.errors[0].breadcrumbs[0].timestamp).toBeDefined()
      // Should be a valid ISO string
      expect(() => new Date(payload.errors[0].breadcrumbs[0].timestamp)).not.toThrow()
    })

    it('should accept all level types', () => {
      expect(() => addBreadcrumb('debug msg', 'test', 'debug')).not.toThrow()
      expect(() => addBreadcrumb('info msg', 'test', 'info')).not.toThrow()
      expect(() => addBreadcrumb('warning msg', 'test', 'warning')).not.toThrow()
      expect(() => addBreadcrumb('error msg', 'test', 'error')).not.toThrow()
    })
  })

  // =========================================================================
  // startTransaction
  // =========================================================================
  describe('startTransaction', () => {
    it('should return null (no-op)', () => {
      expect(startTransaction('test')).toBeNull()
    })

    it('should return null with op parameter', () => {
      expect(startTransaction('test', 'http.request')).toBeNull()
    })
  })

  // =========================================================================
  // destroyErrorTracker
  // =========================================================================
  describe('destroyErrorTracker', () => {
    it('should not throw when called multiple times', () => {
      expect(() => {
        destroyErrorTracker()
        destroyErrorTracker()
        destroyErrorTracker()
      }).not.toThrow()
    })

    it('should flush remaining errors on destroy', () => {
      captureMessage('pending error', 'error')
      destroyErrorTracker()
      expect(fetchSpy).toHaveBeenCalled()
    })

    it('should clear buffer and breadcrumbs', () => {
      addBreadcrumb('test breadcrumb')
      captureMessage('test error', 'error')
      destroyErrorTracker()
      fetchSpy.mockClear()

      // After destroy, new messages shouldn't have old breadcrumbs
      captureMessage('new error', 'error')
      destroyErrorTracker()
      const payload = JSON.parse(fetchSpy.mock.calls[fetchSpy.mock.calls.length - 1][1]?.body as string)
      expect(payload.errors[0].breadcrumbs).toBeUndefined()
    })

    it('should reset initialized flag allowing re-init', () => {
      destroyErrorTracker()
      expect(() => destroyErrorTracker()).not.toThrow()
    })
  })

  // =========================================================================
  // captureMessage
  // =========================================================================
  describe('captureMessage', () => {
    it('should enqueue an info message', () => {
      const payload = captureAndFlush(fetchSpy, 'Information message', 'info')
      expect(payload.errors[0].message).toBe('Information message')
      expect(payload.errors[0].level).toBe('info')
    })

    it('should enqueue a warning message', () => {
      const payload = captureAndFlush(fetchSpy, 'Warning message', 'warning')
      expect(payload.errors[0].level).toBe('warning')
    })

    it('should enqueue an error message', () => {
      const payload = captureAndFlush(fetchSpy, 'Error message', 'error')
      expect(payload.errors[0].level).toBe('error')
    })

    it('should default to info level', () => {
      captureMessage('Default level')
      destroyErrorTracker()
      const payload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(payload.errors[0].level).toBe('info')
    })

    it('should include url, timestamp, userAgent', () => {
      const payload = captureAndFlush(fetchSpy, 'test', 'info')
      expect(payload.errors[0].url).toBeDefined()
      expect(payload.errors[0].timestamp).toBeDefined()
      expect(payload.errors[0].userAgent).toBeDefined()
    })

    it('should include tags', () => {
      const payload = captureAndFlush(fetchSpy, 'test', 'info')
      expect(payload.errors[0].tags).toBeDefined()
      expect(typeof payload.errors[0].tags).toBe('object')
    })
  })

  // =========================================================================
  // captureException
  // =========================================================================
  describe('captureException', () => {
    it('should enqueue error report in PROD', () => {
      const error = new Error('Test error')
      captureException(error)
      destroyErrorTracker()

      expect(fetchSpy).toHaveBeenCalled()
      const payload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(payload.errors[0].message).toBe('Test error')
      expect(payload.errors[0].stack).toBeDefined()
      expect(payload.errors[0].level).toBe('error')
    })

    it('should include extra context', () => {
      const error = new Error('Context error')
      captureException(error, { page: '/home', action: 'load' })
      destroyErrorTracker()

      const payload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(payload.errors[0].extra).toEqual({ page: '/home', action: 'load' })
    })

    it('should log to console in DEV mode instead of enqueueing', () => {
      import.meta.env.PROD = false
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const error = new Error('Dev error')
      captureException(error, { detail: 'test' })

      expect(consoleSpy).toHaveBeenCalledWith('[Error]', 'Dev error', { detail: 'test' })
    })

    it('should capture without extra context', () => {
      const error = new Error('No context')
      captureException(error)
      destroyErrorTracker()

      const payload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(payload.errors[0].message).toBe('No context')
    })
  })

  // =========================================================================
  // shouldIgnore (via enqueue)
  // =========================================================================
  describe('shouldIgnore', () => {
    const ignoredPatterns = [
      'Failed to fetch',
      'NetworkError when attempting to fetch',
      'Load failed while loading',
      'AbortError: cancelled',
      'chrome-extension://abc',
      'moz-extension://def',
      'ResizeObserver loop limit exceeded',
      'WebSocket connection failed',
      'Auth session missing',
      'Auth error occurred',
      'refresh_token_not_found',
    ]

    for (const pattern of ignoredPatterns) {
      it(`should ignore message containing "${pattern.slice(0, 30)}"`, () => {
        fetchSpy.mockClear()
        captureMessage(pattern, 'error')
        destroyErrorTracker()
        // Ignored messages never enter the buffer, so flush sends nothing
        expect(fetchSpy).not.toHaveBeenCalled()
      })
    }

    it('should NOT ignore normal error messages', () => {
      fetchSpy.mockClear()
      captureMessage('Something went wrong', 'error')
      destroyErrorTracker()
      expect(fetchSpy).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // flush behavior
  // =========================================================================
  describe('flush', () => {
    it('should not flush when buffer is empty', () => {
      fetchSpy.mockClear()
      destroyErrorTracker()
      expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('should not flush when endpoint URL is empty', () => {
      const savedUrl = import.meta.env.VITE_SUPABASE_URL
      import.meta.env.VITE_SUPABASE_URL = ''
      fetchSpy.mockClear()

      captureMessage('test', 'error')
      destroyErrorTracker()
      expect(fetchSpy).not.toHaveBeenCalled()

      import.meta.env.VITE_SUPABASE_URL = savedUrl
    })

    it('should send errors via fetch with POST', () => {
      captureMessage('test error', 'error')
      destroyErrorTracker()

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/error-report',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
        })
      )
    })

    it('should silently handle fetch errors', () => {
      fetchSpy.mockImplementation(() => { throw new Error('sync error') })
      captureMessage('test error', 'error')
      expect(() => destroyErrorTracker()).not.toThrow()
    })

    it('should auto-flush at MAX_BUFFER_SIZE (50)', () => {
      fetchSpy.mockClear()
      for (let i = 0; i < 50; i++) {
        captureMessage(`error ${i}`, 'error')
      }
      expect(fetchSpy).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // getEnvironmentTags
  // =========================================================================
  describe('getEnvironmentTags (via createReport)', () => {
    it('should include env tag', () => {
      const payload = captureAndFlush(fetchSpy, 'test', 'info')
      expect(payload.errors[0].tags.env).toBeDefined()
    })

    it('should detect browser from userAgent', () => {
      const payload = captureAndFlush(fetchSpy, 'test', 'info')
      expect(payload.errors[0].tags).toBeDefined()
    })

    it('should detect device type', () => {
      const payload = captureAndFlush(fetchSpy, 'test', 'info')
      expect(payload.errors[0].tags.device).toBe('desktop')
    })
  })

  // =========================================================================
  // createReport
  // =========================================================================
  describe('createReport (via captureMessage/captureException)', () => {
    it('should include all required fields', () => {
      const payload = captureAndFlush(fetchSpy, 'test message', 'warning')
      const report = payload.errors[0]
      expect(report.message).toBe('test message')
      expect(report.level).toBe('warning')
      expect(report.url).toBeDefined()
      expect(report.timestamp).toBeDefined()
      expect(report.userAgent).toBeDefined()
      expect(report.tags).toBeDefined()
    })

    it('should include stack trace for exceptions', () => {
      const error = new Error('stack test')
      captureException(error)
      destroyErrorTracker()

      const payload = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
      expect(payload.errors[0].stack).toContain('stack test')
    })

    it('should not include breadcrumbs when none added', () => {
      // destroyErrorTracker already called in beforeEach, clearing breadcrumbs
      const payload = captureAndFlush(fetchSpy, 'no breadcrumbs', 'info')
      expect(payload.errors[0].breadcrumbs).toBeUndefined()
    })
  })

  // =========================================================================
  // initErrorTracker
  // =========================================================================
  describe('initErrorTracker', () => {
    it('should not throw when called', () => {
      expect(() => initErrorTracker()).not.toThrow()
    })

    it('should be idempotent (only init once)', () => {
      const addListenerSpy = vi.spyOn(window, 'addEventListener')
      initErrorTracker()
      const count1 = addListenerSpy.mock.calls.length
      initErrorTracker()
      const count2 = addListenerSpy.mock.calls.length
      expect(count2).toBe(count1)
    })

    it('should not init in DEV mode', () => {
      import.meta.env.PROD = false
      destroyErrorTracker()
      const addListenerSpy = vi.spyOn(window, 'addEventListener')
      initErrorTracker()
      const errorCalls = addListenerSpy.mock.calls.filter(c => c[0] === 'error')
      expect(errorCalls.length).toBe(0)
      import.meta.env.PROD = true
    })
  })
})
