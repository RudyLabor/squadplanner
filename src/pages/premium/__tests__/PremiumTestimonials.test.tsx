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
  Star: (p: any) => createElement('span', { ...p, 'data-icon': 'Star' }),
}))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  TESTIMONIALS: [
    {
      name: 'Alex',
      squad: 'Les Tryharders',
      memberSince: '6 mois',
      text: 'Le coach IA a transformé notre squad !',
      avatarType: 'alex',
    },
    {
      name: 'Marie',
      squad: 'GameGirls',
      memberSince: '3 mois',
      text: 'Les stats avancées sont incroyables.',
      avatarType: 'marie',
    },
  ],
}))

vi.mock('../TestimonialAvatars', () => ({
  TestimonialAvatar: ({ type }: any) => createElement('div', { 'data-testid': `avatar-${type}` }),
}))

import { PremiumTestimonials } from '../PremiumTestimonials'

describe('PremiumTestimonials', () => {
  // STRICT: verifies section title, subtitle, all testimonial names, squad names, membership durations
  it('renders testimonials section with title, subtitle, and all testimonial metadata', () => {
    render(<PremiumTestimonials />)

    // 1. Section title
    expect(screen.getByText(/Ils sont pass/)).toBeDefined()
    // 2. Subtitle
    expect(screen.getByText(/ne reviendraient pas en arri/)).toBeDefined()
    // 3. First testimonial name
    expect(screen.getByText('Alex')).toBeDefined()
    // 4. Second testimonial name
    expect(screen.getByText('Marie')).toBeDefined()
    // 5. Squad names
    expect(screen.getByText('Les Tryharders')).toBeDefined()
    expect(screen.getByText('GameGirls')).toBeDefined()
    // 6. Membership durations
    expect(screen.getByText('6 mois')).toBeDefined()
    expect(screen.getByText('3 mois')).toBeDefined()
  })

  // STRICT: verifies testimonial content — quotes, avatars, star ratings, verified badges
  it('renders testimonial quotes, avatars, star ratings, and verified badges', () => {
    const { container } = render(<PremiumTestimonials />)

    // 1. First testimonial quote
    expect(screen.getByText(/Le coach IA a transform/)).toBeDefined()
    // 2. Second testimonial quote
    expect(screen.getByText(/Les stats avanc/)).toBeDefined()
    // 3. Avatar for first testimonial
    expect(screen.getByTestId('avatar-alex')).toBeDefined()
    // 4. Avatar for second testimonial
    expect(screen.getByTestId('avatar-marie')).toBeDefined()
    // 5. Star ratings (5 stars per testimonial, 2 testimonials = 10 stars)
    const stars = container.querySelectorAll('[data-icon="Star"]')
    expect(stars.length).toBe(10)
    // 6. Verified badges (CheckCircle2 icon for each testimonial)
    const badges = container.querySelectorAll('[data-icon="CheckCircle2"]')
    expect(badges.length).toBe(2)
  })

  // STRICT: verifies layout structure — grid layout, cards, quote formatting
  it('has grid layout with cards and proper quote formatting', () => {
    const { container } = render(<PremiumTestimonials />)

    // 1. Grid layout for cards
    const grid = container.querySelector('.grid')
    expect(grid).not.toBeNull()
    // 2. Two testimonial cards rendered
    const avatars = screen.getAllByTestId(/avatar-/)
    expect(avatars.length).toBe(2)
    // 3. Quotes use guillemet format
    expect(container.textContent).toContain('\u00ab')
    expect(container.textContent).toContain('\u00bb')
    // 4. Clock icons for membership duration
    const clocks = container.querySelectorAll('[data-icon="Clock"]')
    expect(clocks.length).toBe(2)
    // 5. Text content is substantial
    expect(container.textContent!.length).toBeGreaterThan(100)
    // 6. Names are rendered as semibold
    const nameEl = screen.getByText('Alex')
    expect(nameEl.className).toContain('font-semibold')
  })
})
