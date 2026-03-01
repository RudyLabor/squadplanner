import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../../hooks/useNetworkQuality', () => ({
  useNetworkQualityStore: vi.fn().mockReturnValue({ localQuality: 'good' }),
  QUALITY_INFO: {
    unknown: { label: 'Inconnu', description: 'Qualité inconnue', color: '#888', bars: 0 },
    excellent: {
      label: 'Excellente',
      description: 'Connexion excellente',
      color: '#22c55e',
      bars: 4,
    },
    good: { label: 'Bonne', description: 'Connexion stable', color: '#4ade80', bars: 3 },
    fair: { label: 'Moyenne', description: 'Connexion acceptable', color: '#facc15', bars: 2 },
    poor: { label: 'Faible', description: 'Connexion instable', color: '#ef4444', bars: 1 },
  },
}))

vi.mock('../ui/Tooltip', () => ({
  Tooltip: ({ children, content }: any) => createElement('div', { title: content }, children),
}))

import {
  NetworkQualityIndicator,
  NetworkQualityBadge,
  QualityChangeToast,
} from '../NetworkQualityIndicator'
import { useNetworkQualityStore } from '../../hooks/useNetworkQuality'

const mockedUseNetworkQualityStore = vi.mocked(useNetworkQualityStore)

describe('NetworkQualityIndicator', () => {
  it('renders without crash', () => {
    const { container } = render(<NetworkQualityIndicator />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with forced quality', () => {
    render(<NetworkQualityIndicator forceQuality="excellent" showLabel={true} />)
    expect(screen.getByText('Excellente')).toBeInTheDocument()
  })

  it('renders with showLabel=true', () => {
    render(<NetworkQualityIndicator showLabel={true} />)
    expect(screen.getByText('Bonne')).toBeInTheDocument()
  })

  it('renders sr-only text for accessibility', () => {
    render(<NetworkQualityIndicator />)
    expect(screen.getByText(/Qualité réseau/)).toBeInTheDocument()
  })

  it('renders unknown quality state via forceQuality', () => {
    render(<NetworkQualityIndicator forceQuality="unknown" showLabel={true} />)
    expect(screen.getByText('Inconnu')).toBeInTheDocument()
  })

  it('renders with different sizes', () => {
    const { container: sm } = render(<NetworkQualityIndicator size="sm" />)
    const { container: lg } = render(<NetworkQualityIndicator size="lg" />)
    expect(sm.firstChild).toBeTruthy()
    expect(lg.firstChild).toBeTruthy()
  })
})

describe('NetworkQualityBadge', () => {
  it('renders badge with quality label', () => {
    render(<NetworkQualityBadge />)
    expect(screen.getByText('Bonne')).toBeInTheDocument()
  })
})

describe('QualityChangeToast', () => {
  it('renders when visible', () => {
    render(<QualityChangeToast isVisible={true} newQuality="excellent" onClose={vi.fn()} />)
    expect(screen.getByText('Connexion améliorée')).toBeInTheDocument()
  })

  it('does not render when not visible', () => {
    render(<QualityChangeToast isVisible={false} newQuality="poor" onClose={vi.fn()} />)
    expect(screen.queryByText('Connexion dégradée')).not.toBeInTheDocument()
  })

  it('shows degraded message for poor quality', () => {
    render(<QualityChangeToast isVisible={true} newQuality="poor" onClose={vi.fn()} />)
    expect(screen.getByText('Connexion dégradée')).toBeInTheDocument()
  })

  it('shows improved message for good quality', () => {
    render(<QualityChangeToast isVisible={true} newQuality="good" onClose={vi.fn()} />)
    expect(screen.getByText('Connexion améliorée')).toBeInTheDocument()
  })
})
