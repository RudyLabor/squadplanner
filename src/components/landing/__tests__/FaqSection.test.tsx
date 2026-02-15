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
  ChevronDown: (props: any) => createElement('span', { ...props, 'data-testid': 'chevron-icon' }, 'chevron'),
}))

import { FaqSection, faqs } from '../FaqSection'

describe('FaqSection', () => {
  it('renders section with correct aria-label', () => {
    render(<FaqSection />)
    expect(screen.getByLabelText('Questions fréquentes')).toBeInTheDocument()
  })

  it('renders the heading', () => {
    render(<FaqSection />)
    expect(screen.getByText('Questions fréquentes')).toBeInTheDocument()
  })

  describe('faqs export', () => {
    it('exports the faqs array with 8 items', () => {
      expect(faqs).toHaveLength(8)
    })

    it('each FAQ has q and a properties', () => {
      faqs.forEach((faq) => {
        expect(faq.q).toBeDefined()
        expect(typeof faq.q).toBe('string')
        expect(faq.a).toBeDefined()
        expect(typeof faq.a).toBe('string')
        expect(faq.q.length).toBeGreaterThan(0)
        expect(faq.a.length).toBeGreaterThan(0)
      })
    })
  })

  describe('FAQ questions rendering', () => {
    it('renders all 8 FAQ questions', () => {
      render(<FaqSection />)
      faqs.forEach((faq) => {
        expect(screen.getByText(faq.q)).toBeInTheDocument()
      })
    })

    it('renders 8 buttons (one per FAQ)', () => {
      render(<FaqSection />)
      expect(screen.getAllByRole('button').length).toBe(8)
    })

    it('renders 8 chevron icons', () => {
      render(<FaqSection />)
      const chevrons = screen.getAllByTestId('chevron-icon')
      expect(chevrons.length).toBe(8)
    })
  })

  describe('Accordion expand/collapse (aria-expanded state)', () => {
    it('all FAQ buttons start with aria-expanded=false', () => {
      render(<FaqSection />)
      screen.getAllByRole('button').forEach((btn) => {
        expect(btn).toHaveAttribute('aria-expanded', 'false')
      })
    })

    it('clicking a question expands it (aria-expanded=true)', async () => {
      const user = userEvent.setup()
      render(<FaqSection />)

      const btn = screen.getAllByRole('button')[0]
      expect(btn).toHaveAttribute('aria-expanded', 'false')

      await user.click(btn)

      // Re-query after click as DOM may have re-rendered
      const updatedBtn = screen.getAllByRole('button')[0]
      expect(updatedBtn).toHaveAttribute('aria-expanded', 'true')
    })

    it('clicking the same question again collapses it', async () => {
      const user = userEvent.setup()
      render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[0])
      expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-expanded', 'true')

      await user.click(screen.getAllByRole('button')[0])
      expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-expanded', 'false')
    })

    it('clicking a different question closes the previous one', async () => {
      const user = userEvent.setup()
      render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[0])
      expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-expanded', 'false')

      await user.click(screen.getAllByRole('button')[1])
      expect(screen.getAllByRole('button')[0]).toHaveAttribute('aria-expanded', 'false')
      expect(screen.getAllByRole('button')[1]).toHaveAttribute('aria-expanded', 'true')
    })
  })

  describe('Answer display (open/close CSS class)', () => {
    it('answers start with faq-answer class but no open class', () => {
      const { container } = render(<FaqSection />)
      const answers = container.querySelectorAll('.faq-answer')
      expect(answers.length).toBe(8)
      answers.forEach((answer) => {
        expect(answer.classList.contains('open')).toBe(false)
      })
    })

    it('clicking a question adds open class to its answer', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[0])

      const answers = container.querySelectorAll('.faq-answer')
      expect(answers[0].classList.contains('open')).toBe(true)
      // Other answers remain closed
      for (let i = 1; i < answers.length; i++) {
        expect(answers[i].classList.contains('open')).toBe(false)
      }
    })

    it('collapsing a question removes open class from its answer', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[0])
      expect(container.querySelectorAll('.faq-answer')[0].classList.contains('open')).toBe(true)

      await user.click(screen.getAllByRole('button')[0])
      expect(container.querySelectorAll('.faq-answer')[0].classList.contains('open')).toBe(false)
    })

    it('switching questions moves open class to the new answer', async () => {
      const user = userEvent.setup()
      const { container } = render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[0])
      await user.click(screen.getAllByRole('button')[2])

      const answers = container.querySelectorAll('.faq-answer')
      expect(answers[0].classList.contains('open')).toBe(false)
      expect(answers[2].classList.contains('open')).toBe(true)
    })
  })

  describe('ChevronDown rotation', () => {
    it('chevron has no rotate-180 class when collapsed', () => {
      render(<FaqSection />)
      screen.getAllByTestId('chevron-icon').forEach((chevron) => {
        expect(chevron.className).not.toContain('rotate-180')
      })
    })

    it('chevron has rotate-180 class when expanded', async () => {
      const user = userEvent.setup()
      render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[0])

      const chevrons = screen.getAllByTestId('chevron-icon')
      expect(chevrons[0].className).toContain('rotate-180')
      for (let i = 1; i < chevrons.length; i++) {
        expect(chevrons[i].className).not.toContain('rotate-180')
      }
    })
  })

  describe('FAQ answer text content', () => {
    it('renders the answer text for the first FAQ', () => {
      render(<FaqSection />)
      expect(screen.getByText(/100% gratuit pour commencer/)).toBeInTheDocument()
    })

    it('renders answer text for all FAQs', () => {
      render(<FaqSection />)
      faqs.forEach((faq) => {
        const words = faq.a.split(' ').slice(0, 3).join(' ')
        expect(screen.getByText(new RegExp(words.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument()
      })
    })
  })

  describe('Full accordion interaction cycle', () => {
    it('can expand last FAQ', async () => {
      const user = userEvent.setup()
      render(<FaqSection />)

      const buttons = screen.getAllByRole('button')
      const lastIdx = buttons.length - 1
      await user.click(buttons[lastIdx])

      expect(screen.getAllByRole('button')[lastIdx]).toHaveAttribute('aria-expanded', 'true')
    })

    it('expanding FAQ in the middle works correctly', async () => {
      const user = userEvent.setup()
      render(<FaqSection />)

      await user.click(screen.getAllByRole('button')[3])

      screen.getAllByRole('button').forEach((btn, i) => {
        if (i === 3) {
          expect(btn).toHaveAttribute('aria-expanded', 'true')
        } else {
          expect(btn).toHaveAttribute('aria-expanded', 'false')
        }
      })
    })
  })
})
