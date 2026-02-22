import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) =>
    createElement('a', { href: to, ...props }, children),
}))

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

vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), {
    getState: vi.fn().mockReturnValue({ locale: 'fr' }),
  }),
}))

import { CookieConsent, COOKIE_CONSENT_KEY } from '../CookieConsent'

describe('CookieConsent', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows cookie banner after delay when no consent given', () => {
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(3500)
    })
    expect(screen.getByText('Cookies & confidentialité')).toBeInTheDocument()
  })

  it('does not show banner when consent already given', () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(3500)
    })
    expect(screen.queryByText('Cookies & confidentialité')).not.toBeInTheDocument()
  })

  it('stores accepted when accept all is clicked', () => {
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(3500)
    })
    fireEvent.click(screen.getByText('Tout accepter'))
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('accepted')
  })

  it('stores essential when essential only is clicked', () => {
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(3500)
    })
    fireEvent.click(screen.getByText('Essentiels uniquement'))
    expect(localStorage.getItem(COOKIE_CONSENT_KEY)).toBe('essential')
  })

  it('renders see details toggle', () => {
    render(<CookieConsent />)
    act(() => {
      vi.advanceTimersByTime(3500)
    })
    expect(screen.getByText('Voir les détails')).toBeInTheDocument()
  })

  it('exports COOKIE_CONSENT_KEY constant', () => {
    expect(COOKIE_CONSENT_KEY).toBe('sq-cookie-consent')
  })
})
