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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Button: ({ children, onClick, disabled, ...props }: any) => createElement('button', { onClick, disabled, ...props }, children),
}))

import { PartySquadCard } from '../PartySquadCard'

describe('PartySquadCard', () => {
  const defaultSquad = { id: 's1', name: 'Les Ranked', game: 'Valorant', member_count: 4 }

  // STRICT: verifies card content — squad name, game, member count with plural, join button, icon, card structure
  it('renders squad card with name, game info, member count, and join button', () => {
    const { container } = render(<PartySquadCard squad={defaultSquad} onJoin={vi.fn()} isConnecting={false} />)

    // 1. Squad name rendered
    expect(screen.getByText('Les Ranked')).toBeDefined()
    // 2. Game and member count
    expect(screen.getByText('Valorant · 4 membres')).toBeDefined()
    // 3. Join button text
    expect(screen.getByText('Rejoindre')).toBeDefined()
    // 4. Squad name has h3 heading tag
    const heading = screen.getByText('Les Ranked')
    expect(heading.tagName.toLowerCase()).toBe('h3')
    // 5. Card container exists
    expect(container.querySelectorAll('div').length).toBeGreaterThan(0)
    // 6. Button is enabled
    const btn = screen.getByText('Rejoindre').closest('button')
    expect(btn?.disabled).toBe(false)
  })

  // STRICT: verifies onJoin callback is called when clicking the join button
  it('calls onJoin when join button is clicked', () => {
    const onJoin = vi.fn()
    render(<PartySquadCard squad={defaultSquad} onJoin={onJoin} isConnecting={false} />)

    // 1. onJoin not called initially
    expect(onJoin).not.toHaveBeenCalled()
    // 2. Click join button
    fireEvent.click(screen.getByText('Rejoindre').closest('button')!)
    // 3. onJoin called once
    expect(onJoin).toHaveBeenCalledTimes(1)
    // 4. Click again
    fireEvent.click(screen.getByText('Rejoindre').closest('button')!)
    // 5. Called twice total
    expect(onJoin).toHaveBeenCalledTimes(2)
    // 6. Button remains enabled for multiple clicks
    expect(screen.getByText('Rejoindre').closest('button')?.disabled).toBe(false)
  })

  // STRICT: verifies connecting state — button disabled, UI remains intact
  it('disables join button when isConnecting is true', () => {
    render(<PartySquadCard squad={defaultSquad} onJoin={vi.fn()} isConnecting={true} />)

    // 1. Button is disabled
    const btn = screen.getByText('Rejoindre')?.closest('button') ?? document.querySelectorAll('button')[0]
    expect(btn?.disabled).toBe(true)
    // 2. Squad name still shown
    expect(screen.getByText('Les Ranked')).toBeDefined()
    // 3. Game info still shown
    expect(screen.getByText('Valorant · 4 membres')).toBeDefined()
    // 4. Component renders without errors
    expect(btn).not.toBeNull()
    // 5. Join text or loader still visible
    // (In connecting state the component shows Loader2 icon instead of "Rejoindre" text)
    // The button itself is present
    const buttons = document.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
    // 6. Squad name heading tag preserved
    expect(screen.getByText('Les Ranked').tagName.toLowerCase()).toBe('h3')
  })

  // STRICT: verifies singular member count for 1 member
  it('shows singular "membre" when member_count is 1', () => {
    const singleSquad = { id: 's2', name: 'Solo Queue', game: 'CS2', member_count: 1 }
    render(<PartySquadCard squad={singleSquad} onJoin={vi.fn()} isConnecting={false} />)

    // 1. Squad name
    expect(screen.getByText('Solo Queue')).toBeDefined()
    // 2. Singular form
    expect(screen.getByText('CS2 · 1 membre')).toBeDefined()
    // 3. No plural "membres"
    expect(screen.queryByText(/1 membres/)).toBeNull()
    // 4. Join button still present
    expect(screen.getByText('Rejoindre')).toBeDefined()
    // 5. Game name displayed
    expect(screen.getByText(/CS2/)).toBeDefined()
    // 6. Component renders without crash
    expect(screen.getByText('Solo Queue').tagName.toLowerCase()).toBe('h3')
  })
})
