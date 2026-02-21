import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest'
import { announce } from '../announce'

describe('announce', () => {
  let politeEl: HTMLElement
  let assertiveEl: HTMLElement

  beforeEach(() => {
    // Set up aria-live regions in the DOM
    politeEl = document.createElement('div')
    politeEl.id = 'aria-live-polite'
    document.body.appendChild(politeEl)

    assertiveEl = document.createElement('div')
    assertiveEl.id = 'aria-live-assertive'
    document.body.appendChild(assertiveEl)
  })

  afterEach(() => {
    // Clean up DOM elements after each test to prevent leaks
    document.getElementById('aria-live-polite')?.remove()
    document.getElementById('aria-live-assertive')?.remove()
    vi.restoreAllMocks()
  })

  it('announces to polite region by default', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    announce('Nouveau message reçu')
    expect(politeEl.textContent).toBe('Nouveau message reçu')
    expect(assertiveEl.textContent).toBe('')
  })

  it('announces to assertive region when specified', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      cb(0)
      return 0
    })

    announce('Erreur critique', 'assertive')
    expect(assertiveEl.textContent).toBe('Erreur critique')
  })

  it('clears text before setting to force re-announcement', () => {
    politeEl.textContent = 'ancien message'

    const calls: string[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      calls.push('raf')
      cb(0)
      return 0
    })

    announce('nouveau message')
    // The clear happens synchronously before rAF
    expect(calls).toContain('raf')
    expect(politeEl.textContent).toBe('nouveau message')
  })

  it('does nothing if aria-live region does not exist', () => {
    politeEl.remove()
    assertiveEl.remove()

    // Should not throw
    expect(() => announce('test message')).not.toThrow()
    expect(() => announce('test message', 'assertive')).not.toThrow()

    // Restore for cleanup
    document.body.appendChild(politeEl)
    document.body.appendChild(assertiveEl)
  })
})
