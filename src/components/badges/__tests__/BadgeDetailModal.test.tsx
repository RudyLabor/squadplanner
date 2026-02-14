import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { BadgeDetailModal } from '../BadgeDetailModal'

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

describe('BadgeDetailModal', () => {
  const mockBadge = {
    id: 'badge-1',
    user_id: 'user-1',
    badge_type: 'mvp',
    season: '2026-01',
    squad_id: 'squad-1',
    awarded_at: '2026-01-15T10:00:00Z',
    squad_name: 'Team Alpha',
  }

  it('renders nothing when badge is null', () => {
    const { container } = render(<BadgeDetailModal badge={null} onClose={vi.fn()} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders badge details when badge is provided', () => {
    render(<BadgeDetailModal badge={mockBadge} onClose={vi.fn()} />)
    expect(screen.getByText('MVP')).toBeDefined()
    expect(screen.getByText('Meilleur joueur du mois')).toBeDefined()
    expect(screen.getByText('Janvier 2026')).toBeDefined()
    expect(screen.getByText('Team Alpha')).toBeDefined()
  })

  it('displays the formatted date', () => {
    render(<BadgeDetailModal badge={mockBadge} onClose={vi.fn()} />)
    // French locale date format
    const dateText = new Date('2026-01-15T10:00:00Z').toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    expect(screen.getByText(dateText)).toBeDefined()
  })

  it('calls onClose when Fermer button is clicked', () => {
    const onClose = vi.fn()
    render(<BadgeDetailModal badge={mockBadge} onClose={onClose} />)
    fireEvent.click(screen.getByText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })

  it('falls back to mvp config for unknown badge type', () => {
    const unknownBadge = { ...mockBadge, badge_type: 'unknown_type' }
    render(<BadgeDetailModal badge={unknownBadge} onClose={vi.fn()} />)
    expect(screen.getByText('MVP')).toBeDefined()
  })

  it('does not show squad name when not provided', () => {
    const badgeWithoutSquad = { ...mockBadge, squad_name: undefined }
    render(<BadgeDetailModal badge={badgeWithoutSquad} onClose={vi.fn()} />)
    expect(screen.queryByText('Squad')).toBeNull()
  })
})
