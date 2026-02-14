import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  TESTIMONIALS: [
    { name: 'Alex', squad: 'Squad1', memberSince: '6 mois', text: 'Super!', avatarType: 'alex' },
  ],
}))

vi.mock('../TestimonialAvatars', () => ({
  TestimonialAvatar: () => createElement('div', { 'data-testid': 'avatar' }),
}))

import { PremiumTestimonials } from '../PremiumTestimonials'

describe('PremiumTestimonials', () => {
  it('renders without crashing', () => {
    const { container } = render(<PremiumTestimonials />)
    expect(container).toBeTruthy()
  })

  it('renders section title', () => {
    render(<PremiumTestimonials />)
    expect(screen.getByText(/Ils sont passés Premium/)).toBeTruthy()
  })

  it('renders testimonial name', () => {
    render(<PremiumTestimonials />)
    expect(screen.getByText('Alex')).toBeTruthy()
  })
})
