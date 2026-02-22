import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TestimonialAvatar } from '../TestimonialAvatars'

describe('TestimonialAvatar', () => {
  /* ---------------------------------------------------------------- */
  /*  Alex avatar                                                      */
  /* ---------------------------------------------------------------- */
  describe('type="alex"', () => {
    it('renders an SVG element', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      const svg = container.querySelector('svg')
      expect(svg).not.toBeNull()
    })

    it('has aria-label "Avatar AlexGaming"', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Avatar AlexGaming')
    })

    it('has 48x48 dimensions', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('width')).toBe('48')
      expect(svg.getAttribute('height')).toBe('48')
    })

    it('has flex-shrink-0 class', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      expect(container.querySelector('svg')?.classList.contains('flex-shrink-0')).toBe(true)
    })

    it('has correct viewBox', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      expect(container.querySelector('svg')?.getAttribute('viewBox')).toBe('0 0 48 48')
    })

    it('contains linear gradient defs with alexBg and alexSkin ids', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      expect(container.querySelector('#alexBg')).not.toBeNull()
      expect(container.querySelector('#alexSkin')).not.toBeNull()
    })

    it('contains a circle element (background)', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      const circle = container.querySelector('circle')
      expect(circle).not.toBeNull()
      expect(circle?.getAttribute('cx')).toBe('24')
      expect(circle?.getAttribute('cy')).toBe('24')
      expect(circle?.getAttribute('r')).toBe('24')
    })

    it('has ellipse elements for eyes', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      const ellipses = container.querySelectorAll('ellipse')
      expect(ellipses.length).toBeGreaterThanOrEqual(2)
    })

    it('has headphone rects (earpieces)', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThanOrEqual(2)
    })

    it('does not render marie or lucas gradient ids', () => {
      const { container } = render(<TestimonialAvatar type="alex" />)
      expect(container.querySelector('#marieBg')).toBeNull()
      expect(container.querySelector('#lucasBg')).toBeNull()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Marie avatar                                                     */
  /* ---------------------------------------------------------------- */
  describe('type="marie"', () => {
    it('renders an SVG element', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      expect(container.querySelector('svg')).not.toBeNull()
    })

    it('has aria-label "Avatar MarieGG"', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Avatar MarieGG')
    })

    it('has 48x48 dimensions', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('width')).toBe('48')
      expect(svg.getAttribute('height')).toBe('48')
    })

    it('has flex-shrink-0 class', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      expect(container.querySelector('svg')?.classList.contains('flex-shrink-0')).toBe(true)
    })

    it('contains linear gradient defs with marieBg, marieSkin, marieHair', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      expect(container.querySelector('#marieBg')).not.toBeNull()
      expect(container.querySelector('#marieSkin')).not.toBeNull()
      expect(container.querySelector('#marieHair')).not.toBeNull()
    })

    it('contains a circle element (background)', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBeGreaterThanOrEqual(1)
    })

    it('has earring circles (small decorative circles)', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      // Marie has earring circles at cx=13 and cx=35
      const circles = container.querySelectorAll('circle')
      const earringCircles = Array.from(circles).filter(
        (c) => c.getAttribute('cx') === '13' || c.getAttribute('cx') === '35'
      )
      expect(earringCircles.length).toBeGreaterThanOrEqual(2)
    })

    it('has ellipse elements for eyes', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      const ellipses = container.querySelectorAll('ellipse')
      expect(ellipses.length).toBeGreaterThanOrEqual(2)
    })

    it('does not render alex or lucas gradient ids', () => {
      const { container } = render(<TestimonialAvatar type="marie" />)
      expect(container.querySelector('#alexBg')).toBeNull()
      expect(container.querySelector('#lucasBg')).toBeNull()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Lucas avatar (default/fallback)                                  */
  /* ---------------------------------------------------------------- */
  describe('type="lucas"', () => {
    it('renders an SVG element', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      expect(container.querySelector('svg')).not.toBeNull()
    })

    it('has aria-label "Avatar LucasApex"', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Avatar LucasApex')
    })

    it('has 48x48 dimensions', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('width')).toBe('48')
      expect(svg.getAttribute('height')).toBe('48')
    })

    it('has flex-shrink-0 class', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      expect(container.querySelector('svg')?.classList.contains('flex-shrink-0')).toBe(true)
    })

    it('contains linear gradient defs with lucasBg and lucasSkin', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      expect(container.querySelector('#lucasBg')).not.toBeNull()
      expect(container.querySelector('#lucasSkin')).not.toBeNull()
    })

    it('contains a circle background element', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      const circles = container.querySelectorAll('circle')
      expect(circles.length).toBeGreaterThanOrEqual(1)
    })

    it('has a cap rect element', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      // Lucas has a cap/visor rect
      const rects = container.querySelectorAll('rect')
      expect(rects.length).toBeGreaterThanOrEqual(2)
    })

    it('has beard stubble circles (small decorative dots)', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      // Lucas has multiple small circles for beard stubble
      const circles = container.querySelectorAll('circle')
      // At least the background circle + beard stubble circles
      expect(circles.length).toBeGreaterThanOrEqual(10)
    })

    it('has ellipse elements for eyes', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      const ellipses = container.querySelectorAll('ellipse')
      expect(ellipses.length).toBeGreaterThanOrEqual(2)
    })

    it('does not render alex or marie gradient ids', () => {
      const { container } = render(<TestimonialAvatar type="lucas" />)
      expect(container.querySelector('#alexBg')).toBeNull()
      expect(container.querySelector('#marieBg')).toBeNull()
    })
  })

  /* ---------------------------------------------------------------- */
  /*  Shared behavior across all types                                 */
  /* ---------------------------------------------------------------- */
  describe('shared behavior', () => {
    it.each(['alex', 'marie', 'lucas'] as const)('type="%s" renders an SVG with xmlns', (type) => {
      const { container } = render(<TestimonialAvatar type={type} />)
      const svg = container.querySelector('svg')!
      expect(svg.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg')
    })

    it.each(['alex', 'marie', 'lucas'] as const)(
      'type="%s" has fill="none" on root SVG',
      (type) => {
        const { container } = render(<TestimonialAvatar type={type} />)
        const svg = container.querySelector('svg')!
        expect(svg.getAttribute('fill')).toBe('none')
      }
    )

    it.each(['alex', 'marie', 'lucas'] as const)(
      'type="%s" has path elements for face features',
      (type) => {
        const { container } = render(<TestimonialAvatar type={type} />)
        const paths = container.querySelectorAll('path')
        expect(paths.length).toBeGreaterThanOrEqual(3)
      }
    )

    it('each type produces a unique aria-label', () => {
      const { container: c1 } = render(<TestimonialAvatar type="alex" />)
      const { container: c2 } = render(<TestimonialAvatar type="marie" />)
      const { container: c3 } = render(<TestimonialAvatar type="lucas" />)

      const labels = [
        c1.querySelector('svg')?.getAttribute('aria-label'),
        c2.querySelector('svg')?.getAttribute('aria-label'),
        c3.querySelector('svg')?.getAttribute('aria-label'),
      ]
      const unique = new Set(labels)
      expect(unique.size).toBe(3)
    })

    it('each type uses unique gradient IDs (no collision)', () => {
      const { container: c1 } = render(<TestimonialAvatar type="alex" />)
      const { container: c2 } = render(<TestimonialAvatar type="marie" />)
      const { container: c3 } = render(<TestimonialAvatar type="lucas" />)

      // Get all gradient IDs from defs
      const getIds = (c: HTMLElement) =>
        Array.from(c.querySelectorAll('linearGradient')).map((el) => el.id)

      const alexIds = getIds(c1)
      const marieIds = getIds(c2)
      const lucasIds = getIds(c3)

      // No overlap between sets
      for (const id of alexIds) {
        expect(marieIds).not.toContain(id)
        expect(lucasIds).not.toContain(id)
      }
      for (const id of marieIds) {
        expect(lucasIds).not.toContain(id)
      }
    })
  })
})
