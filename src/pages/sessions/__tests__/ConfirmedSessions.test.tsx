import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  Button: ({ children, ...props }: any) => createElement('button', props, children),
  Badge: ({ children, variant, ...props }: any) => createElement('span', { 'data-variant': variant, ...props }, children),
  SessionCardSkeleton: () => createElement('div', { 'data-testid': 'skeleton' }),
  ContentTransition: ({ children, isLoading, skeleton }: any) => isLoading ? skeleton : children,
}))

vi.mock('../types', () => ({
  formatDate: (d: string) => new Date(d).toLocaleDateString('fr-FR'),
}))

import { ConfirmedSessions, HowItWorksSection } from '../ConfirmedSessions'

describe('ConfirmedSessions', () => {
  // STRICT: verifies empty state — heading visible, badge count, empty state title, CTA link to /squads, CTA button text
  it('renders empty state with correct heading, empty message, and navigation CTA', () => {
    const { container } = render(<ConfirmedSessions confirmed={[]} sessionsLoading={false} />)

    // 1. Section heading "Sessions confirmées"
    expect(screen.getByText('Sessions confirmées')).toBeDefined()
    // 2. Badge shows 0 count
    expect(screen.getByText('0')).toBeDefined()
    // 3. Empty state title
    expect(screen.getByText('Aucune session confirmée')).toBeDefined()
    // 4. Empty state description
    expect(screen.getByText(/Réponds "Présent" à une session/)).toBeDefined()
    // 5. CTA button exists
    expect(screen.getByText('Voir mes squads')).toBeDefined()
    // 6. Link points to /squads
    const link = container.querySelector('a[href="/squads"]')
    expect(link).not.toBeNull()
    // 7. Section has aria-label
    const section = container.querySelector('section')
    expect(section?.getAttribute('aria-label')).toBe('Sessions confirmées')
  })

  // STRICT: verifies session cards render — title, date, RSVP count, badge "Confirmé", link to session detail, list structure
  it('renders session cards with title, date, RSVP count, badge, and detail links', () => {
    const sessions = [
      { id: 's1', title: 'Ranked Soir', game: 'Valorant', scheduled_at: '2026-02-14T21:00:00Z', rsvp_counts: { present: 3 } },
      { id: 's2', title: '', game: 'LoL', scheduled_at: '2026-02-15T18:00:00Z', rsvp_counts: { present: 0 } },
    ]
    const { container } = render(<ConfirmedSessions confirmed={sessions} sessionsLoading={false} />)

    // 1. First session title displayed
    expect(screen.getByText('Ranked Soir')).toBeDefined()
    // 2. Second session falls back to game name when title empty (renders 'LoL')
    expect(screen.getByText('LoL')).toBeDefined()
    // 3. RSVP count shows "3 présents"
    expect(screen.getByText('3 présents')).toBeDefined()
    // 4. RSVP count defaults to "0 présents" when count is 0
    expect(screen.getByText('0 présents')).toBeDefined()
    // 5. "Confirmé" badge rendered for each
    const badges = screen.getAllByText('Confirmé')
    expect(badges.length).toBe(2)
    // 6. Links to session detail pages
    expect(container.querySelector('a[href="/session/s1"]')).not.toBeNull()
    expect(container.querySelector('a[href="/session/s2"]')).not.toBeNull()
    // 7. Badge count shows total
    expect(screen.getByText('2')).toBeDefined()
    // 8. List uses ul element
    const list = container.querySelector('ul')
    expect(list).not.toBeNull()
  })

  // STRICT: verifies loading state — skeleton rendered instead of content, badge hidden
  it('renders skeletons when loading and hides badge count', () => {
    render(<ConfirmedSessions confirmed={[]} sessionsLoading={true} />)

    // 1. Skeletons rendered (ContentTransition shows skeleton when loading)
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBe(3)
    // 2. Badge count is NOT rendered when loading
    expect(screen.queryByText('0')).toBeNull()
    // 3. Section heading still visible
    expect(screen.getByText('Sessions confirmées')).toBeDefined()
    // 4. Empty state message NOT shown
    expect(screen.queryByText('Aucune session confirmée')).toBeNull()
    // 5. No session cards rendered
    expect(screen.queryByText('Confirmé')).toBeNull()
    // 6. No list element
    expect(screen.queryByText('Voir mes squads')).toBeNull()
  })
})

describe('HowItWorksSection', () => {
  // STRICT: verifies all 4 steps render with correct numbering, text, heading, aria-label, and ordered list structure
  it('renders all 4 steps with numbering, descriptions, heading, and aria-label', () => {
    const { container } = render(<HowItWorksSection />)

    // 1. Section heading
    expect(screen.getByText('Comment fonctionnent les sessions ?')).toBeDefined()
    // 2. Step 1 text
    expect(screen.getByText('Un membre de ta squad propose un créneau')).toBeDefined()
    // 3. Step 2 text
    expect(screen.getByText(/Tu cliques "Présent", "Absent" ou "Peut-être"/)).toBeDefined()
    // 4. Step 3 text
    expect(screen.getByText(/tu fais ton check-in/)).toBeDefined()
    // 5. Step 4 text
    expect(screen.getByText('Ton score de fiabilité augmente !')).toBeDefined()
    // 6. Step numbers are rendered
    expect(screen.getByText('1')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('4')).toBeDefined()
    // 7. aria-label on section
    const section = container.querySelector('section')
    expect(section?.getAttribute('aria-label')).toBe('Guide des sessions')
    // 8. Uses ordered list (ol)
    const ol = container.querySelector('ol')
    expect(ol).not.toBeNull()
  })
})
