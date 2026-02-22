import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../types', () => ({
  dayNames: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
}))

import { AISlotSuggestions, CoachTipsSection } from '../AISuggestions'

describe('AISlotSuggestions', () => {
  // STRICT: verifies component returns null when no suggestions — empty container, no section, no heading
  it('renders nothing when slotSuggestions is empty', () => {
    const { container } = render(<AISlotSuggestions slotSuggestions={[]} />)
    // 1. Container has no inner HTML
    expect(container.innerHTML).toBe('')
    // 2. No heading rendered
    expect(screen.queryByText(/Meilleurs créneaux/)).toBeNull()
    // 3. No section rendered
    expect(container.querySelector('section')).toBeNull()
    // 4. No slot card rendered
    expect(screen.queryByText(/%/)).toBeNull()
    // 5. No suggestion hint text
    expect(screen.queryByText(/Suggestions basées/)).toBeNull()
    // 6. Container childNodes empty
    expect(container.childNodes.length).toBe(0)
  })

  // STRICT: verifies single suggestion displays day name, hour, reliability score, section heading, aria label, and hint text
  it('renders a single suggestion with all data points and section structure', () => {
    const suggestions = [{ day_of_week: 3, hour: 21, reliability_score: 85 }]
    const { container } = render(<AISlotSuggestions slotSuggestions={suggestions} />)

    // 1. Section heading exists
    expect(screen.getByText('Meilleurs créneaux suggérés')).toBeDefined()
    // 2. Day name correctly resolved from dayNames array
    expect(screen.getByText('Mercredi 21h')).toBeDefined()
    // 3. Reliability score displayed with percentage
    expect(screen.getByText('85%')).toBeDefined()
    // 4. aria-label on the section
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
    expect(section?.getAttribute('aria-label')).toBe('Suggestions de créneaux IA')
    // 5. Hint text shown when hasSlotHistory is false (default)
    expect(screen.getByText(/Suggestions basées sur les habitudes/)).toBeDefined()
    // 6. Shows precision improvement message
    expect(screen.getByText(/Plus tu joues, plus elles seront/)).toBeDefined()
  })

  // STRICT: verifies hasSlotHistory=true hides the hint text, and multiple suggestions render correctly capped at 3
  it('hides hint text when hasSlotHistory is true and caps at 3 suggestions', () => {
    const suggestions = [
      { day_of_week: 1, hour: 20, reliability_score: 92 },
      { day_of_week: 5, hour: 18, reliability_score: 78 },
      { day_of_week: 6, hour: 14, reliability_score: 65 },
      { day_of_week: 0, hour: 10, reliability_score: 50 },
    ]
    render(<AISlotSuggestions slotSuggestions={suggestions} hasSlotHistory={true} />)

    // 1. Hint text is hidden
    expect(screen.queryByText(/Suggestions basées/)).toBeNull()
    // 2. First slot renders
    expect(screen.getByText('Lundi 20h')).toBeDefined()
    // 3. Second slot renders
    expect(screen.getByText('Vendredi 18h')).toBeDefined()
    // 4. Third slot renders
    expect(screen.getByText('Samedi 14h')).toBeDefined()
    // 5. Fourth slot is NOT rendered (max 3)
    expect(screen.queryByText('Dimanche 10h')).toBeNull()
    // 6. All three scores render
    expect(screen.getByText('92%')).toBeDefined()
    expect(screen.getByText('78%')).toBeDefined()
    expect(screen.getByText('65%')).toBeDefined()
  })
})

describe('CoachTipsSection', () => {
  // STRICT: verifies component returns null when no tips — no section, no heading, empty container
  it('renders nothing when coachTips is empty', () => {
    const { container } = render(<CoachTipsSection coachTips={[]} />)
    // 1. Container empty
    expect(container.innerHTML).toBe('')
    // 2. No heading
    expect(screen.queryByText(/Conseil Coach/)).toBeNull()
    // 3. No section
    expect(container.querySelector('section')).toBeNull()
    // 4. No children at all
    expect(container.childNodes.length).toBe(0)
    // 5. No content text
    expect(screen.queryByText(/Planifie/)).toBeNull()
    // 6. Container has no nested elements
    expect(container.querySelectorAll('*').length).toBe(0)
  })

  // STRICT: verifies tip renders with heading, content, aria label, section structure, and only first tip displayed
  it('renders tip content with full section structure and only displays first tip', () => {
    const tips = [
      { content: 'Planifie ta session le mardi soir pour maximiser la participation.' },
      { content: 'Ce deuxième conseil ne devrait pas apparaître.' },
    ]
    const { container } = render(<CoachTipsSection coachTips={tips} />)

    // 1. Section heading with emoji
    expect(screen.getByText(/Conseil Coach/)).toBeDefined()
    // 2. First tip content displayed
    expect(
      screen.getByText('Planifie ta session le mardi soir pour maximiser la participation.')
    ).toBeDefined()
    // 3. Second tip is NOT displayed (component only shows first)
    expect(screen.queryByText('Ce deuxième conseil ne devrait pas apparaître.')).toBeNull()
    // 4. aria-label on section
    const section = container.querySelector('section')
    expect(section).not.toBeNull()
    expect(section?.getAttribute('aria-label')).toBe('Conseil Coach IA')
    // 5. Section has content (not empty)
    expect(section?.textContent?.length).toBeGreaterThan(10)
    // 6. Coach heading includes emoji marker
    expect(screen.getByText(/🎯/)).toBeDefined()
  })
})
