import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { usePWAInstallStore } from '../usePWAInstall'

function createMockPromptEvent(outcome: 'accepted' | 'dismissed') {
  return {
    prompt: vi.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome }),
    preventDefault: vi.fn(),
  } as unknown as Event & {
    prompt(): Promise<void>
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
  }
}

describe('usePWAInstallStore', () => {
  let localStorageStore: Record<string, string>

  beforeEach(() => {
    // Reset store state
    act(() => {
      usePWAInstallStore.setState({
        deferredPrompt: null,
        isInstallable: false,
        showBanner: false,
      })
    })

    // Mock localStorage
    localStorageStore = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(
      (key: string) => localStorageStore[key] ?? null
    )
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => { localStorageStore[key] = value }
    )
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(
      (key: string) => { delete localStorageStore[key] }
    )

    // Mock matchMedia — default: not standalone (not installed)
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList))
  })

  it('starts with null deferredPrompt, not installable, no banner', () => {
    expect(usePWAInstallStore.getState().deferredPrompt).toBeNull()
    expect(usePWAInstallStore.getState().isInstallable).toBe(false)
    expect(usePWAInstallStore.getState().showBanner).toBe(false)
  })

  it('setDeferredPrompt sets isInstallable to true', () => {
    const event = createMockPromptEvent('dismissed')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })
    expect(usePWAInstallStore.getState().isInstallable).toBe(true)
  })

  it('setDeferredPrompt shows banner when visit count >= 3', () => {
    // Simulate 2 prior visits so the 3rd call inside shouldShowBanner hits >= 3
    localStorageStore['sq-visits'] = '2'

    const event = createMockPromptEvent('dismissed')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })
    expect(usePWAInstallStore.getState().showBanner).toBe(true)
  })

  it('setDeferredPrompt does NOT show banner when already installed (matchMedia standalone)', () => {
    localStorageStore['sq-visits'] = '10'

    // Override matchMedia to simulate standalone mode
    vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList))

    const event = createMockPromptEvent('dismissed')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })
    expect(usePWAInstallStore.getState().showBanner).toBe(false)
  })

  it('dismissBanner saves dismiss timestamp to localStorage and hides banner', () => {
    // Set up state with banner showing
    localStorageStore['sq-visits'] = '5'
    const event = createMockPromptEvent('dismissed')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })
    expect(usePWAInstallStore.getState().showBanner).toBe(true)

    act(() => {
      usePWAInstallStore.getState().dismissBanner()
    })
    expect(usePWAInstallStore.getState().showBanner).toBe(false)
    expect(localStorageStore['sq-pwa-dismissed']).toBeDefined()
    expect(Number(localStorageStore['sq-pwa-dismissed'])).toBeGreaterThan(0)
  })

  it('promptInstall calls prompt() and returns true when accepted', async () => {
    const event = createMockPromptEvent('accepted')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })

    let result: boolean
    await act(async () => {
      result = await usePWAInstallStore.getState().promptInstall()
    })
    expect(result!).toBe(true)
    expect(event.prompt).toHaveBeenCalled()
    expect(localStorageStore['sq-pwa-installed']).toBe('true')
  })

  it('promptInstall returns false when dismissed', async () => {
    const event = createMockPromptEvent('dismissed')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })

    let result: boolean
    await act(async () => {
      result = await usePWAInstallStore.getState().promptInstall()
    })
    expect(result!).toBe(false)
    expect(localStorageStore['sq-pwa-installed']).toBeUndefined()
  })

  it('promptInstall resets state after use', async () => {
    const event = createMockPromptEvent('accepted')
    act(() => {
      usePWAInstallStore.getState().setDeferredPrompt(event as any)
    })
    expect(usePWAInstallStore.getState().isInstallable).toBe(true)

    await act(async () => {
      await usePWAInstallStore.getState().promptInstall()
    })
    expect(usePWAInstallStore.getState().deferredPrompt).toBeNull()
    expect(usePWAInstallStore.getState().isInstallable).toBe(false)
    expect(usePWAInstallStore.getState().showBanner).toBe(false)
  })
})
