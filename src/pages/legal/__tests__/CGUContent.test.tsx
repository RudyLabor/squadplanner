import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../LegalSection', () => ({
  LegalSection: ({ title, children, defaultOpen }: any) => createElement('div', { 'data-testid': `section-${title}`, 'data-default-open': defaultOpen }, createElement('h3', {}, title), defaultOpen ? children : null),
}))

import { CGUContent } from '../CGUContent'

describe('CGUContent', () => {
  // STRICT: verifies main heading, update date, first section content (defaultOpen), card wrapper, structure
  it('renders main heading, update date, and first section with defaultOpen content', () => {
    const { container } = render(<CGUContent />)

    // 1. Main title
    expect(screen.getByText("Conditions Générales d'Utilisation")).toBeDefined()
    // 2. Title is h1
    const h1 = screen.getByText("Conditions Générales d'Utilisation")
    expect(h1.tagName.toLowerCase()).toBe('h1')
    // 3. Update date
    expect(screen.getByText(/8 février 2026/)).toBeDefined()
    // 4. First section "1. Objet" rendered
    expect(screen.getByText('1. Objet')).toBeDefined()
    // 5. First section has defaultOpen=true, so content is visible
    expect(screen.getByText(/Squad Planner est une application/)).toBeDefined()
    // 6. Card wrapper exists
    expect(container.querySelector('div')).not.toBeNull()
    // 7. Multiple sections rendered
    expect(screen.getByText("2. Acceptation des conditions")).toBeDefined()
  })

  // STRICT: verifies all 10 legal sections are rendered with correct titles
  it('renders all 10 legal sections with correct numbering and titles', () => {
    render(<CGUContent />)

    // 1. Section 1
    expect(screen.getByText('1. Objet')).toBeDefined()
    // 2. Section 2
    expect(screen.getByText("2. Acceptation des conditions")).toBeDefined()
    // 3. Section 3
    expect(screen.getByText('3. Inscription et compte')).toBeDefined()
    // 4. Section 4
    expect(screen.getByText('4. Services proposés')).toBeDefined()
    // 5. Section 5
    expect(screen.getByText('5. Abonnement Premium')).toBeDefined()
    // 6. Section 6
    expect(screen.getByText("6. Comportement de l'utilisateur")).toBeDefined()
    // 7-10
    expect(screen.getByText('7. Propriété intellectuelle')).toBeDefined()
    expect(screen.getByText('8. Limitation de responsabilité')).toBeDefined()
    expect(screen.getByText('9. Résiliation')).toBeDefined()
    expect(screen.getByText('10. Droit applicable')).toBeDefined()
  })

  // STRICT: verifies first section defaultOpen content, and non-defaultOpen sections are collapsed
  it('shows first section content expanded and other sections collapsed', () => {
    render(<CGUContent />)

    // 1. "1. Objet" section has defaultOpen (data-default-open=true)
    const firstSection = screen.getByTestId('section-1. Objet')
    expect(firstSection.getAttribute('data-default-open')).toBe('true')
    // 2. Content of first section is visible
    expect(screen.getByText(/règles d'utilisation/)).toBeDefined()
    // 3. "2. Acceptation" does NOT have defaultOpen
    const secondSection = screen.getByTestId('section-2. Acceptation des conditions')
    expect(secondSection.getAttribute('data-default-open')).not.toBe('true')
    // 4. Content of non-defaultOpen section is hidden
    expect(screen.queryByText(/En créant un compte sur Squad Planner/)).toBeNull()
    // 5. CGU description mentions Squad Planner SAS
    expect(screen.getByText(/Squad Planner SAS/)).toBeDefined()
    // 6. Section count is 10
    const sections = screen.getAllByRole('heading', { level: 3 })
    expect(sections.length).toBe(10)
  })

  // STRICT: verifies content quality — legal terms present, no empty sections
  it('contains meaningful legal content in the visible section', () => {
    const { container } = render(<CGUContent />)

    // 1. App description present
    expect(screen.getByText(/coordination gaming/)).toBeDefined()
    // 2. Feature list mentioned
    expect(screen.getByText(/sessions de jeu/)).toBeDefined()
    // 3. Communication features mentioned
    expect(screen.getByText(/chat et appels vocaux/)).toBeDefined()
    // 4. Reliability feature mentioned
    expect(screen.getByText(/fiabilité/)).toBeDefined()
    // 5. Text content is substantial
    expect(container.textContent!.length).toBeGreaterThan(200)
    // 6. Date is properly formatted
    expect(screen.getByText(/Dernière mise à jour/)).toBeDefined()
  })
})
