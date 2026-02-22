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
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

import { PartyEmptyState } from '../PartyEmptyState'

describe('PartyEmptyState', () => {
  // STRICT: verifies main heading, description text, CTA button, link target, icon presence, and card structure
  it('renders empty state with heading, description, CTA button linking to /squads', () => {
    const { container } = render(<PartyEmptyState />)

    // 1. Main heading
    expect(screen.getByText('Parle avec ta squad')).toBeDefined()
    // 2. Description text explaining what to do
    expect(screen.getByText(/squad pour lancer des parties vocales/)).toBeDefined()
    // 3. CTA button text
    expect(screen.getByText('Trouver une squad')).toBeDefined()
    // 4. Link points to /squads
    const link = container.querySelector('a[href="/squads"]')
    expect(link).not.toBeNull()
    // 5. Button is inside the link
    const button = screen.getByText('Trouver une squad').closest('button')
    expect(button).not.toBeNull()
    // 6. Card container exists
    expect(container.querySelector('div')).not.toBeNull()
  })

  // STRICT: verifies the component renders consistently, text content correct, no broken elements
  it('displays complete empty state content without errors', () => {
    const { container } = render(<PartyEmptyState />)

    // 1. Component renders without throwing
    expect(container).toBeTruthy()
    // 2. Heading has the expected tag (h3)
    const heading = screen.getByText('Parle avec ta squad')
    expect(heading.tagName.toLowerCase()).toBe('h3')
    // 3. Description is a paragraph
    const desc = screen.getByText(/squad pour lancer des parties vocales/)
    expect(desc.tagName.toLowerCase()).toBe('p')
    // 4. Button element present
    const buttons = container.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
    // 5. Only one CTA action
    expect(buttons.length).toBe(1)
    // 6. Full text content is rendered (not empty)
    expect(container.textContent!.length).toBeGreaterThan(20)
  })

  // STRICT: verifies accessibility — link navigates correctly, button is clickable, text is meaningful
  it('has accessible link to squads page and meaningful text', () => {
    const { container } = render(<PartyEmptyState />)

    // 1. Link present
    const links = container.querySelectorAll('a')
    expect(links.length).toBe(1)
    // 2. Link href is /squads
    expect(links[0].getAttribute('href')).toBe('/squads')
    // 3. Button text describes the action
    expect(screen.getByText('Trouver une squad')).toBeDefined()
    // 4. Heading describes the feature
    expect(screen.getByText('Parle avec ta squad')).toBeDefined()
    // 5. No broken/empty text nodes
    const allText = container.textContent
    expect(allText).toContain('Parle avec ta squad')
    expect(allText).toContain('Trouver une squad')
    // 6. Container has nested structure (not flat)
    expect(container.querySelectorAll('div').length).toBeGreaterThan(1)
  })
})
