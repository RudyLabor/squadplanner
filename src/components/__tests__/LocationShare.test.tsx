import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

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
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

import { LocationShareButton, isLocationMessage, parseLocationMessage, LocationMessage } from '../LocationShare'

describe('LocationShareButton', () => {
  it('renders button with aria-label', () => {
    render(<LocationShareButton onShare={vi.fn()} />)
    expect(screen.getByLabelText('Partager ma position')).toBeInTheDocument()
  })

  it('button is disabled when disabled prop is true', () => {
    render(<LocationShareButton onShare={vi.fn()} disabled={true} />)
    expect(screen.getByLabelText('Partager ma position')).toBeDisabled()
  })
})

describe('isLocationMessage', () => {
  it('returns true for location message format', () => {
    expect(isLocationMessage('[location:48.8566,2.3522]')).toBe(true)
  })

  it('returns false for regular messages', () => {
    expect(isLocationMessage('Hello world')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isLocationMessage('')).toBe(false)
  })
})

describe('parseLocationMessage', () => {
  it('parses valid location message', () => {
    const result = parseLocationMessage('[location:48.8566,2.3522]')
    expect(result).toEqual({ lat: 48.8566, lng: 2.3522 })
  })

  it('parses negative coordinates', () => {
    const result = parseLocationMessage('[location:-33.8688,151.2093]')
    expect(result).toEqual({ lat: -33.8688, lng: 151.2093 })
  })

  it('returns null for invalid format', () => {
    expect(parseLocationMessage('Hello world')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseLocationMessage('')).toBeNull()
  })
})

describe('LocationMessage', () => {
  it('renders coordinates', () => {
    render(<LocationMessage lat={48.8566} lng={2.3522} />)
    expect(screen.getByText(/48\.8566/)).toBeInTheDocument()
    expect(screen.getByText(/2\.3522/)).toBeInTheDocument()
  })

  it('renders Google Maps link', () => {
    render(<LocationMessage lat={48.8566} lng={2.3522} />)
    const link = screen.getByLabelText('Ouvrir la position dans Google Maps')
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toContain('google.com/maps')
  })

  it('renders "Je suis la" text', () => {
    render(<LocationMessage lat={48.8566} lng={2.3522} />)
    expect(screen.getByText('Je suis la')).toBeInTheDocument()
  })

  it('link opens in new tab', () => {
    render(<LocationMessage lat={48.8566} lng={2.3522} />)
    const link = screen.getByLabelText('Ouvrir la position dans Google Maps')
    expect(link.getAttribute('target')).toBe('_blank')
  })
})
