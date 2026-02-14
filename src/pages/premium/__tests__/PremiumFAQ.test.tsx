import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  FAQ: [
    { q: 'Question 1?', a: 'Answer 1' },
    { q: 'Question 2?', a: 'Answer 2' },
  ],
}))

import { PremiumFAQ } from '../PremiumFAQ'

describe('PremiumFAQ', () => {
  it('renders without crashing', () => {
    const { container } = render(<PremiumFAQ />)
    expect(container).toBeTruthy()
  })

  it('renders FAQ title', () => {
    render(<PremiumFAQ />)
    expect(screen.getByText(/Questions fréquentes/)).toBeTruthy()
  })

  it('renders FAQ questions', () => {
    render(<PremiumFAQ />)
    expect(screen.getByText('Question 1?')).toBeTruthy()
    expect(screen.getByText('Question 2?')).toBeTruthy()
  })
})
