import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', { ...props, 'data-icon': p }, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  CardContent: ({ children, ...props }: any) => createElement('div', props, children),
}))

import { SquadCard } from '../SquadCard'

describe('SquadCard', () => {
  const defaultProps = {
    squad: { id: 's1', name: 'Les Ranked', game: 'Valorant', invite_code: 'ABC123', member_count: 5 },
    isOwner: false,
    hasActiveParty: false,
    copiedCode: null as string | null,
    onCopyCode: vi.fn(),
  }

  // STRICT: verifies card content — squad name, game, member count, link to detail, copy button, no owner badge, "Aucune session" default
  it('renders squad card with name, game, member count, detail link, and copy invite button', () => {
    const { container } = render(<SquadCard {...defaultProps} />)

    // 1. Squad name
    expect(screen.getByText('Les Ranked')).toBeDefined()
    // 2. Game and member count with plural
    expect(screen.getByText(/Valorant · 5 membres/)).toBeDefined()
    // 3. Link to squad detail page
    const link = container.querySelector('a[href="/squad/s1"]')
    expect(link).not.toBeNull()
    // 4. Copy invite code button with aria-label
    const copyBtn = screen.getByLabelText("Copier le code d'invitation")
    expect(copyBtn).toBeDefined()
    // 5. No Crown icon (not owner)
    expect(container.querySelector('[data-icon="Crown"]')).toBeNull()
    // 6. Default session state "Aucune session planifiée"
    expect(screen.getByText('Aucune session planifiée')).toBeDefined()
    // 7. Squad name has h3 heading
    expect(screen.getByText('Les Ranked').tagName.toLowerCase()).toBe('h3')
    // 8. Squad name has correct id for aria-labelledby
    expect(screen.getByText('Les Ranked').id).toBe('squad-name-s1')
  })

  // STRICT: verifies owner badge, active party indicator, and copy code callback
  it('shows owner crown, active party indicator, and triggers onCopyCode', () => {
    const onCopyCode = vi.fn()
    const { container } = render(<SquadCard {...defaultProps} isOwner={true} hasActiveParty={true} onCopyCode={onCopyCode} />)

    // 1. Crown icon shown for owner
    expect(container.querySelector('[data-icon="Crown"]')).not.toBeNull()
    // 2. "Party en cours" text shown
    expect(screen.getByText('Party en cours')).toBeDefined()
    // 3. No "Aucune session planifiée" when party active
    expect(screen.queryByText('Aucune session planifiée')).toBeNull()
    // 4. Click copy button triggers onCopyCode
    const copyBtn = screen.getByLabelText("Copier le code d'invitation")
    fireEvent.click(copyBtn)
    // 5. onCopyCode called with invite code
    expect(onCopyCode).toHaveBeenCalledWith('ABC123')
    // 6. Mic icon shown for active party (instead of Gamepad2)
    expect(container.querySelector('[data-icon="Mic"]')).not.toBeNull()
  })

  // STRICT: verifies copied code state — Check icon shown instead of Copy icon
  it('shows Check icon when invite code has been copied', () => {
    const { container } = render(<SquadCard {...defaultProps} copiedCode="ABC123" />)

    // 1. Check icon shown (copied state)
    expect(container.querySelector('[data-icon="Check"]')).not.toBeNull()
    // 2. Copy icon NOT shown
    expect(container.querySelector('[data-icon="Copy"]')).toBeNull()
    // 3. Squad name still shown
    expect(screen.getByText('Les Ranked')).toBeDefined()
    // 4. Game info still shown
    expect(screen.getByText(/Valorant · 5 membres/)).toBeDefined()
    // 5. Link still works
    expect(container.querySelector('a[href="/squad/s1"]')).not.toBeNull()
    // 6. Copy button still present and clickable
    const copyBtn = screen.getByLabelText("Copier le code d'invitation")
    expect(copyBtn).toBeDefined()
  })

  // STRICT: verifies member_count fallback and singular form
  it('handles member count fallback and singular form', () => {
    // 1. Single member — singular "membre"
    const { unmount: u1 } = render(<SquadCard {...defaultProps} squad={{ ...defaultProps.squad, member_count: 1 }} />)
    expect(screen.getByText('Valorant · 1 membre')).toBeDefined()
    u1()

    // 2. Falls back to total_members when member_count missing
    const { unmount: u2 } = render(<SquadCard {...defaultProps} squad={{ ...defaultProps.squad, member_count: undefined, total_members: 3 } as any} />)
    expect(screen.getByText(/3 membres/)).toBeDefined()
    u2()

    // 3. Falls back to 1 when both missing
    const { unmount: u3 } = render(<SquadCard {...defaultProps} squad={{ ...defaultProps.squad, member_count: undefined } as any} />)
    expect(screen.getByText(/1 membre/)).toBeDefined()
    u3()

    // 4. Gamepad2 icon shown when no active party
    const { container } = render(<SquadCard {...defaultProps} />)
    expect(container.querySelector('[data-icon="Gamepad2"]')).not.toBeNull()
    // 5. No Mic icon when no party
    expect(container.querySelector('[data-icon="Mic"]')).toBeNull()
    // 6. ChevronRight arrow present
    expect(container.querySelector('[data-icon="ChevronRight"]')).not.toBeNull()
  })
})
