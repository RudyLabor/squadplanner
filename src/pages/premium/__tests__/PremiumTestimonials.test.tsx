import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => ({
  Crown: (p: any) => createElement('span', { ...p, 'data-icon': 'Crown' }),
  Check: (p: any) => createElement('span', { ...p, 'data-icon': 'Check' }),
  X: (p: any) => createElement('span', { ...p, 'data-icon': 'X' }),
  Gift: (p: any) => createElement('span', { ...p, 'data-icon': 'Gift' }),
  ArrowRight: (p: any) => createElement('span', { ...p, 'data-icon': 'ArrowRight' }),
  Loader2: ({ children, ...p }: any) =>
    createElement('span', { 'data-testid': 'loader', ...p }, children),
  Rocket: (p: any) => createElement('span', { ...p, 'data-icon': 'Rocket' }),
  Sparkles: (p: any) => createElement('span', { ...p, 'data-icon': 'Sparkles' }),
  Shield: (p: any) => createElement('span', { ...p, 'data-icon': 'Shield' }),
  Clock: (p: any) => createElement('span', { ...p, 'data-icon': 'Clock' }),
  CheckCircle2: (p: any) => createElement('span', { ...p, 'data-icon': 'CheckCircle2' }),
  Zap: (p: any) => createElement('span', { ...p, 'data-icon': 'Zap' }),
  ChevronDown: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronDown' }),
  ChevronUp: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronUp' }),
  Users: (p: any) => createElement('span', { ...p, 'data-icon': 'Users' }),
  Calendar: (p: any) => createElement('span', { ...p, 'data-icon': 'Calendar' }),
  BarChart3: (p: any) => createElement('span', { ...p, 'data-icon': 'BarChart3' }),
  Mic2: (p: any) => createElement('span', { ...p, 'data-icon': 'Mic2' }),
}))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  TESTIMONIALS: [
    {
      name: 'Profil : Capitaine de squad',
      squad: 'Squad ranked 5v5',
      memberSince: 'Profil type',
      text: 'Le coach IA a transformé notre squad !',
      avatarType: 'alex',
    },
    {
      name: 'Profil : Joueuse compétitive',
      squad: 'Squad ranked féminine',
      memberSince: 'Profil type',
      text: 'Les heatmaps de présence sont incroyables.',
      avatarType: 'marie',
    },
  ],
}))

vi.mock('../TestimonialAvatars', () => ({
  TestimonialAvatar: ({ type }: any) => createElement('div', { 'data-testid': `avatar-${type}` }),
}))

import { PremiumTestimonials } from '../PremiumTestimonials'

describe('PremiumTestimonials', () => {
  // STRICT: verifies section title, subtitle, all use case names, squad contexts, profile type labels
  it('renders use cases section with title, subtitle, and all metadata', () => {
    render(<PremiumTestimonials />)

    // 1. Section title
    expect(screen.getByText(/Cas d'usage Premium/)).toBeDefined()
    // 2. Subtitle
    expect(screen.getByText(/Le Premium s'adapte/)).toBeDefined()
    // 3. First use case name
    expect(screen.getByText('Profil : Capitaine de squad')).toBeDefined()
    // 4. Second use case name
    expect(screen.getByText('Profil : Joueuse compétitive')).toBeDefined()
    // 5. Squad contexts
    expect(screen.getByText('Squad ranked 5v5')).toBeDefined()
    expect(screen.getByText('Squad ranked féminine')).toBeDefined()
    // 6. Profile type labels
    const profilTypeElements = screen.getAllByText('Profil type')
    expect(profilTypeElements.length).toBe(2)
  })

  // STRICT: verifies use case content — text, avatars, no star ratings
  it('renders use case text, avatars, and no star ratings', () => {
    const { container } = render(<PremiumTestimonials />)

    // 1. First use case text
    expect(screen.getByText(/Le coach IA a transform/)).toBeDefined()
    // 2. Second use case text
    expect(screen.getByText(/Les heatmaps de pr/)).toBeDefined()
    // 3. Avatar for first use case
    expect(screen.getByTestId('avatar-alex')).toBeDefined()
    // 4. Avatar for second use case
    expect(screen.getByTestId('avatar-marie')).toBeDefined()
    // 5. No star ratings (removed for honest use case framing)
    const stars = container.querySelectorAll('[data-icon="Star"]')
    expect(stars.length).toBe(0)
  })

  // STRICT: verifies layout structure — grid layout, cards, text formatting
  it('has grid layout with cards and proper text formatting', () => {
    const { container } = render(<PremiumTestimonials />)

    // 1. Grid layout for cards
    const grid = container.querySelector('.grid')
    expect(grid).not.toBeNull()
    // 2. Two use case cards rendered
    const avatars = screen.getAllByTestId(/avatar-/)
    expect(avatars.length).toBe(2)
    // 3. Clock icons for profile type label
    const clocks = container.querySelectorAll('[data-icon="Clock"]')
    expect(clocks.length).toBe(2)
    // 4. Text content is substantial
    expect(container.textContent!.length).toBeGreaterThan(100)
    // 5. Names are rendered as semibold
    const nameEl = screen.getByText('Profil : Capitaine de squad')
    expect(nameEl.className).toContain('font-semibold')
  })
})
