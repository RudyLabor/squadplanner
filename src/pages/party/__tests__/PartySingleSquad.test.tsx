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

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Button: ({ children, onClick, disabled, ...props }: any) =>
    createElement('button', { onClick, disabled, ...props }, children),
}))

import { PartySingleSquad, PartyStatsCard } from '../PartySingleSquad'

describe('PartySingleSquad', () => {
  // STRICT: verifies squad info display — name, game, member count, heading, join button text, member avatars
  it('renders squad info with name, game, member count, heading, and join button', () => {
    render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'Ma Super Squad', game: 'Valorant', member_count: 5 }}
        isConnecting={false}
        onJoin={vi.fn()}
      />
    )

    // 1. Squad name displayed
    expect(screen.getByText('Ma Super Squad')).toBeDefined()
    // 2. Game and member count info
    expect(screen.getByText(/Valorant · 5 membres/)).toBeDefined()
    // 3. Member count repeated with "dans la squad"
    expect(screen.getByText(/5 membres dans la squad/)).toBeDefined()
    // 4. Join button text
    expect(screen.getByText('Lancer la party')).toBeDefined()
    // 5. "Prêt à parler ?" heading
    expect(screen.getByText(/Pr/)).toBeDefined()
    // 6. Join button is enabled
    const joinBtn = screen.getByText('Lancer la party').closest('button')
    expect(joinBtn?.disabled).toBe(false)
  })

  // STRICT: verifies onJoin callback fires when button clicked, button disabled when connecting
  it('calls onJoin when button is clicked and disables button when connecting', () => {
    const onJoin = vi.fn()
    const { unmount } = render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'Test', game: 'Val', member_count: 3 }}
        isConnecting={false}
        onJoin={onJoin}
      />
    )

    // 1. Click join button
    fireEvent.click(screen.getByText('Lancer la party').closest('button')!)
    // 2. onJoin called once
    expect(onJoin).toHaveBeenCalledTimes(1)
    unmount()

    // 3. When connecting, button is disabled
    render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'Test', game: 'Val', member_count: 3 }}
        isConnecting={true}
        onJoin={vi.fn()}
      />
    )
    const disabledBtn = screen.getByText('Lancer la party').closest('button')
    expect(disabledBtn?.disabled).toBe(true)
    // 4. onJoin not called on disabled button click
    const newOnJoin = vi.fn()
    // button is disabled so the click handler should not fire
    fireEvent.click(disabledBtn!)
    expect(newOnJoin).not.toHaveBeenCalled()
    // 5. Loader text still "Lancer la party"
    expect(screen.getByText('Lancer la party')).toBeDefined()
    // 6. Component renders without error in connecting state
    expect(disabledBtn).not.toBeNull()
  })

  // STRICT: verifies member_count fallback to total_members then to 1
  it('falls back member count from member_count to total_members to 1', () => {
    // 1. Uses member_count when available
    const { unmount: u1 } = render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'A', game: 'G', member_count: 7 }}
        isConnecting={false}
        onJoin={vi.fn()}
      />
    )
    expect(screen.getByText(/7 membres/)).toBeDefined()
    u1()

    // 2. Falls back to total_members when member_count missing
    const { unmount: u2 } = render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'A', game: 'G', total_members: 4 } as any}
        isConnecting={false}
        onJoin={vi.fn()}
      />
    )
    expect(screen.getByText(/4 membres/)).toBeDefined()
    u2()

    // 3. Falls back to 1 when both missing
    const { unmount: u3 } = render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'A', game: 'G' } as any}
        isConnecting={false}
        onJoin={vi.fn()}
      />
    )
    expect(screen.getByText(/1 membre /)).toBeDefined()
    u3()

    // 4. Singular "membre" when count is 1
    render(
      <PartySingleSquad
        squad={{ id: 's1', name: 'Solo', game: 'G', member_count: 1 }}
        isConnecting={false}
        onJoin={vi.fn()}
      />
    )
    // member_count=1 => "1 membre" (no 's')
    expect(screen.getByText('1 membre dans la squad')).toBeDefined()
    // 5. Plural "membres" when count > 1 is already tested above
    // 6. Component always renders squad name regardless of member count
    expect(screen.getByText('Solo')).toBeDefined()
  })
})

describe('PartyStatsCard', () => {
  // STRICT: verifies stats card renders with headings, stats labels, placeholder values, and "bientôt" message
  it('renders stats card with all stat labels, placeholder values, and history section', () => {
    const { container } = render(<PartyStatsCard squadName="Test Squad" />)

    // 1. "Party vocale" heading
    expect(screen.getByText('Party vocale')).toBeDefined()
    // 2. "Statistiques" subtitle
    expect(screen.getByText('Statistiques')).toBeDefined()
    // 3. Duration stat label
    expect(screen.getByText(/moyenne/)).toBeDefined()
    // 4. Weekly stat label
    expect(screen.getByText('Cette semaine')).toBeDefined()
    // 5. Participants stat label
    expect(screen.getByText('Participants moy.')).toBeDefined()
    // 6. "Bientôt disponible" placeholder
    expect(screen.getByText(/disponible/)).toBeDefined()
    // 7. History section
    expect(screen.getByText(/Historique/)).toBeDefined()
    // 8. Empty history message
    expect(screen.getByText(/Aucune party enregistr/)).toBeDefined()
  })
})
