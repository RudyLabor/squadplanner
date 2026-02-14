import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../types', () => ({
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
}))

import { AISlotSuggestions, CoachTipsSection } from '../AISuggestions'

describe('AISlotSuggestions', () => {
  it('renders null when no suggestions', () => {
    const { container } = render(<AISlotSuggestions slotSuggestions={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders suggestions when provided', () => {
    const suggestions = [
      { day_of_week: 3, hour: 21, reliability_score: 85 },
    ]
    render(<AISlotSuggestions slotSuggestions={suggestions} />)
    expect(screen.getByText(/Meilleurs créneaux/)).toBeTruthy()
    expect(screen.getByText('Mercredi 21h')).toBeTruthy()
  })
})

describe('CoachTipsSection', () => {
  it('renders null when no tips', () => {
    const { container } = render(<CoachTipsSection coachTips={[]} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders tips when provided', () => {
    render(<CoachTipsSection coachTips={[{ content: 'Planifie ta session le mardi' }]} />)
    expect(screen.getByText('Planifie ta session le mardi')).toBeTruthy()
  })
})
