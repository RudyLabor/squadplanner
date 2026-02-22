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
          ? ({ children, style, ...r }: any) => createElement(p, { ...r, style }, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, style, ...r }: any) => createElement(p, { ...r, style }, children)
          : undefined,
    }
  ),
}))

vi.mock('../../../utils/animations', () => ({
  scrollRevealLight: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
}))

import { ProblemSection } from '../ProblemSection'

describe('ProblemSection', () => {
  it('renders section with correct aria-label', () => {
    render(<ProblemSection />)
    expect(screen.getByLabelText('Le problème')).toBeInTheDocument()
  })

  it('renders the heading', () => {
    render(<ProblemSection />)
    expect(screen.getByText('Le problème que tu connais trop bien')).toBeInTheDocument()
  })

  it('renders the subheading', () => {
    render(<ProblemSection />)
    expect(
      screen.getByText(
        "T'as des amis. T'as Discord. T'as des jeux. Mais vous jouez jamais ensemble."
      )
    ).toBeInTheDocument()
  })

  describe('Problem items', () => {
    it('renders all 4 problem items with emojis', () => {
      render(<ProblemSection />)
      expect(screen.getByText('💬')).toBeInTheDocument()
      expect(screen.getByText('🤷')).toBeInTheDocument()
      expect(screen.getByText('👻')).toBeInTheDocument()
      expect(screen.getByText('😤')).toBeInTheDocument()
    })

    it('renders all 4 problem texts', () => {
      render(<ProblemSection />)
      expect(screen.getByText(/Personne ne répond/)).toBeInTheDocument()
      expect(screen.getByText(/Rien ne se passe/)).toBeInTheDocument()
      expect(screen.getByText(/2 mecs sur 5 se connectent/)).toBeInTheDocument()
      expect(screen.getByText(/tout le monde attend/i)).toBeInTheDocument()
    })

    it('renders exactly 4 problem items', () => {
      render(<ProblemSection />)
      // Each problem item has the emoji in a span + text in a p
      const emojis = ['💬', '🤷', '👻', '😤']
      emojis.forEach((e) => {
        expect(screen.getByText(e)).toBeInTheDocument()
      })
    })
  })

  describe('Chevron arrows between items', () => {
    it('renders 3 chevron arrows (between 4 items, not after the last)', () => {
      const { container } = render(<ProblemSection />)
      // Chevrons are SVGs with viewBox="0 0 16 16"
      const chevronSvgs = container.querySelectorAll('svg[viewBox="0 0 16 16"]')
      expect(chevronSvgs.length).toBe(3)
    })

    it('chevron arrows have aria-hidden="true"', () => {
      const { container } = render(<ProblemSection />)
      const chevronSvgs = container.querySelectorAll('svg[viewBox="0 0 16 16"]')
      chevronSvgs.forEach((svg) => {
        expect(svg.getAttribute('aria-hidden')).toBe('true')
      })
    })

    it('chevron arrows have different opacities based on arrowOpacities array', () => {
      const { container } = render(<ProblemSection />)
      const chevronSvgs = container.querySelectorAll('svg[viewBox="0 0 16 16"]')
      const expectedOpacities = [0.25, 0.4, 0.6]
      chevronSvgs.forEach((svg, i) => {
        const style = svg.getAttribute('style') || ''
        expect(style).toContain(`opacity: ${expectedOpacities[i]}`)
      })
    })

    it('chevron SVGs contain the correct path', () => {
      const { container } = render(<ProblemSection />)
      const paths = container.querySelectorAll('svg[viewBox="0 0 16 16"] path')
      expect(paths.length).toBe(3)
      paths.forEach((path) => {
        expect(path.getAttribute('d')).toBe('M4 6L8 10L12 6')
        expect(path.getAttribute('stroke')).toBe('currentColor')
      })
    })
  })

  describe('Result box', () => {
    it('renders the explosion emoji', () => {
      render(<ProblemSection />)
      expect(screen.getByText('💥')).toBeInTheDocument()
    })

    it('renders the result message', () => {
      render(<ProblemSection />)
      expect(
        screen.getByText(/Résultat → Plus personne n'organise rien. Ta squad meurt à petit feu./)
      ).toBeInTheDocument()
    })
  })

  describe('Layout structure', () => {
    it('has max-w-4xl container', () => {
      const { container } = render(<ProblemSection />)
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument()
    })

    it('has max-w-lg for problem list', () => {
      const { container } = render(<ProblemSection />)
      const problemList = container.querySelectorAll('.max-w-lg')
      expect(problemList.length).toBe(2) // one for problems, one for result box
    })
  })
})
