/**
 * Tests for src/lib/sentry.ts
 * The sentry module is a backwards-compatibility shim that re-exports
 * from errorTracker.ts. We verify all re-exports are present and aliased correctly.
 */
import { describe, it, expect, vi } from 'vitest'

// Mock errorTracker to avoid side-effects
vi.mock('../errorTracker', () => ({
  initErrorTracker: vi.fn(),
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  setUser: vi.fn(),
  addBreadcrumb: vi.fn(),
  startTransaction: vi.fn(),
}))

import {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
} from '../sentry'

import {
  initErrorTracker,
  captureException as originalCaptureException,
  captureMessage as originalCaptureMessage,
  setUser as originalSetUser,
  addBreadcrumb as originalAddBreadcrumb,
  startTransaction as originalStartTransaction,
} from '../errorTracker'

describe('sentry (compatibility shim)', () => {
  it('should export initSentry as alias for initErrorTracker', () => {
    expect(initSentry).toBe(initErrorTracker)
  })

  it('should export captureException from errorTracker', () => {
    expect(captureException).toBe(originalCaptureException)
  })

  it('should export captureMessage from errorTracker', () => {
    expect(captureMessage).toBe(originalCaptureMessage)
  })

  it('should export setUser from errorTracker', () => {
    expect(setUser).toBe(originalSetUser)
  })

  it('should export addBreadcrumb from errorTracker', () => {
    expect(addBreadcrumb).toBe(originalAddBreadcrumb)
  })

  it('should export startTransaction from errorTracker', () => {
    expect(startTransaction).toBe(originalStartTransaction)
  })

  it('initSentry should be callable', () => {
    expect(() => initSentry()).not.toThrow()
    expect(initErrorTracker).toHaveBeenCalled()
  })

  it('captureException should forward calls to errorTracker', () => {
    const error = new Error('test')
    captureException(error, { detail: 'ctx' })
    expect(originalCaptureException).toHaveBeenCalledWith(error, { detail: 'ctx' })
  })

  it('captureMessage should forward calls to errorTracker', () => {
    captureMessage('test message', 'warning')
    expect(originalCaptureMessage).toHaveBeenCalledWith('test message', 'warning')
  })
})
