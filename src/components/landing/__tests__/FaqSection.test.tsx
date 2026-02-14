import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

vi.mock('../../icons', () => ({
  ChevronDown: (props: any) => createElement('span', props, 'chevron'),
}))

import { FaqSection, faqs } from '../FaqSection'

describe('FaqSection', () => {
  it('renders without crash', () => {
    render(<FaqSection />)
    expect(screen.getByText('Questions fréquentes')).toBeInTheDocument()
  })

  it('renders all FAQ questions', () => {
    render(<FaqSection />)
    expect(screen.getByText('Squad Planner est-il gratuit ?')).toBeInTheDocument()
    expect(screen.getByText('Comment inviter mes amis ?')).toBeInTheDocument()
  })

  it('has FAQ buttons with aria-expanded', () => {
    render(<FaqSection />)
    const buttons = screen.getAllByRole('button')
    // At least one button should have aria-expanded attribute
    const faqButtons = buttons.filter((b) => b.getAttribute('aria-expanded') !== null)
    expect(faqButtons.length).toBeGreaterThan(0)
    expect(faqButtons[0]).toHaveAttribute('aria-expanded', 'false')
  })

  it('exports faqs array', () => {
    expect(faqs.length).toBeGreaterThan(0)
    expect(faqs[0].q).toBeDefined()
    expect(faqs[0].a).toBeDefined()
  })
})
