import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TestimonialAvatar } from '../TestimonialAvatars'

describe('TestimonialAvatar', () => {
  it('renders alex avatar', () => {
    const { container } = render(<TestimonialAvatar type="alex" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders marie avatar', () => {
    const { container } = render(<TestimonialAvatar type="marie" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renders lucas avatar (default)', () => {
    const { container } = render(<TestimonialAvatar type="lucas" />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('each avatar has proper aria-label', () => {
    const { container: c1 } = render(<TestimonialAvatar type="alex" />)
    expect(c1.querySelector('svg')?.getAttribute('aria-label')).toContain('AlexGaming')

    const { container: c2 } = render(<TestimonialAvatar type="marie" />)
    expect(c2.querySelector('svg')?.getAttribute('aria-label')).toContain('MarieGG')

    const { container: c3 } = render(<TestimonialAvatar type="lucas" />)
    expect(c3.querySelector('svg')?.getAttribute('aria-label')).toContain('LucasApex')
  })
})
