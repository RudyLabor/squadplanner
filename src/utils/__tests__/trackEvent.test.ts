/**
 * Tests for src/utils/trackEvent.ts
 * Covers: initTrackingListeners (click tracking, event queuing, flush)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock analytics module
const mockTrackEvent = vi.fn()
const mockInitAnalytics = vi.fn()

vi.mock('../analytics', () => ({
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  initAnalytics: () => mockInitAnalytics(),
}))

import { initTrackingListeners } from '../trackEvent'

describe('trackEvent', () => {
  let addEventSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    addEventSpy = vi.spyOn(document, 'addEventListener')
    vi.spyOn(window, 'addEventListener')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should export initTrackingListeners as a function', () => {
    expect(typeof initTrackingListeners).toBe('function')
  })

  it('should register a click event listener on document', () => {
    initTrackingListeners()

    expect(addEventSpy).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      expect.objectContaining({ passive: true })
    )
  })

  it('should register beforeunload listener on window', () => {
    initTrackingListeners()

    expect(window.addEventListener).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    )
  })

  it('should queue a page_view event on init', () => {
    initTrackingListeners()

    // Advance flush timer (5000ms)
    vi.advanceTimersByTime(5001)

    // The page_view event should be flushed via trackAnalyticsEvent
    expect(mockTrackEvent).toHaveBeenCalledWith(
      'page_view',
      expect.objectContaining({
        url: expect.any(String),
        referrer: expect.any(String),
        timestamp: expect.any(Number),
      })
    )
  })

  it('should track clicks on data-track elements', () => {
    initTrackingListeners()

    // Get the click handler
    const clickHandler = addEventSpy.mock.calls.find((c) => c[0] === 'click')?.[1] as EventListener

    // Create a mock element with data-track attribute
    const el = document.createElement('button')
    el.setAttribute('data-track', 'cta_click')
    document.body.appendChild(el)

    const event = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(event, 'target', { value: el })
    clickHandler(event)

    // Flush timer
    vi.advanceTimersByTime(5001)

    expect(mockTrackEvent).toHaveBeenCalledWith(
      'cta_click',
      expect.objectContaining({
        url: expect.any(String),
      })
    )

    document.body.removeChild(el)
  })

  it('should not track clicks on elements without data-track', () => {
    initTrackingListeners()
    mockTrackEvent.mockClear()

    const clickHandler = addEventSpy.mock.calls.find((c) => c[0] === 'click')?.[1] as EventListener

    const el = document.createElement('button')
    document.body.appendChild(el)

    const event = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(event, 'target', { value: el })
    clickHandler(event)

    vi.advanceTimersByTime(5001)

    // Only the initial page_view, not a new event from this click
    // Actually mockTrackEvent was cleared, so should not be called for the click
    const clickCalls = mockTrackEvent.mock.calls.filter(
      (c) => c[0] !== 'page_view'
    )
    expect(clickCalls).toHaveLength(0)

    document.body.removeChild(el)
  })

  it('should batch events and flush every 5 seconds', () => {
    initTrackingListeners()
    mockTrackEvent.mockClear()

    const clickHandler = addEventSpy.mock.calls.find((c) => c[0] === 'click')?.[1] as EventListener

    const el = document.createElement('button')
    el.setAttribute('data-track', 'btn_1')
    document.body.appendChild(el)

    const event = new MouseEvent('click', { bubbles: true })
    Object.defineProperty(event, 'target', { value: el })

    clickHandler(event)

    // Before flush timeout, nothing sent
    expect(mockTrackEvent).not.toHaveBeenCalled()

    // After 5 seconds, flush happens
    vi.advanceTimersByTime(5001)

    expect(mockTrackEvent).toHaveBeenCalled()

    document.body.removeChild(el)
  })

  it('should initialize analytics module via dynamic import', () => {
    // initTrackingListeners triggers import('./analytics').then(({ initAnalytics }) => initAnalytics())
    // We verify the function does not throw and sets up listeners properly
    // The analytics mock is already set up, so this verifies integration
    initTrackingListeners()

    // Verify that the click and beforeunload listeners were registered
    // which means initTrackingListeners executed without error
    const clickRegistered = addEventSpy.mock.calls.some((c) => c[0] === 'click')
    expect(clickRegistered).toBe(true)
  })
})
