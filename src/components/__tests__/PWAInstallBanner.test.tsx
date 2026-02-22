import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

// Polyfill CSS.supports for jsdom
if (typeof globalThis.CSS === 'undefined') {
  ;(globalThis as any).CSS = { supports: () => false }
} else if (typeof globalThis.CSS.supports !== 'function') {
  ;(globalThis.CSS as any).supports = () => false
}

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

// Mock icons
vi.mock('../icons', () => ({
  Download: (props: any) => createElement('svg', props),
  X: (props: any) => createElement('svg', props),
}))

let mockShowBanner = true
const mockPromptInstall = vi.fn()
const mockDismissBanner = vi.fn()

vi.mock('../../hooks/usePWAInstall', () => ({
  usePWAInstallStore: vi.fn().mockImplementation((selector: any) => {
    const state = {
      get showBanner() {
        return mockShowBanner
      },
      promptInstall: mockPromptInstall,
      dismissBanner: mockDismissBanner,
    }
    return selector ? selector(state) : state
  }),
}))

import { PWAInstallBanner } from '../PWAInstallBanner'

describe('PWAInstallBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowBanner = true
  })

  it('renders install banner when showBanner is true', () => {
    render(createElement(PWAInstallBanner))
    expect(screen.getByText('Installer Squad Planner')).toBeDefined()
    expect(screen.getByText("Accès rapide depuis ton écran d'accueil")).toBeDefined()
  })

  it('renders Installer button', () => {
    render(createElement(PWAInstallBanner))
    expect(screen.getByText('Installer')).toBeDefined()
  })

  it('renders Plus tard button', () => {
    render(createElement(PWAInstallBanner))
    expect(screen.getByText('Plus tard')).toBeDefined()
  })

  it('calls promptInstall when Installer is clicked', () => {
    render(createElement(PWAInstallBanner))
    fireEvent.click(screen.getByText('Installer'))
    expect(mockPromptInstall).toHaveBeenCalled()
  })

  it('calls dismissBanner when Plus tard is clicked', () => {
    render(createElement(PWAInstallBanner))
    fireEvent.click(screen.getByText('Plus tard'))
    expect(mockDismissBanner).toHaveBeenCalled()
  })

  it('calls dismissBanner when close button is clicked', () => {
    render(createElement(PWAInstallBanner))
    fireEvent.click(screen.getByLabelText("Fermer la bannière d'installation"))
    expect(mockDismissBanner).toHaveBeenCalled()
  })

  it('renders nothing when showBanner is false', () => {
    mockShowBanner = false
    const { container } = render(createElement(PWAInstallBanner))
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })
})
