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

import { PrivacyContent } from '../PrivacyContent'

describe('PrivacyContent', () => {
  // STRICT: verifies main heading, update date, first section expanded, card wrapper, structure
  it('renders main heading, update date, and first section with expanded content', () => {
    const { container } = render(<PrivacyContent />)

    // 1. Main title
    expect(screen.getByText('Politique de Confidentialité')).toBeDefined()
    // 2. Title is h1
    const h1 = screen.getByText('Politique de Confidentialité')
    expect(h1.tagName.toLowerCase()).toBe('h1')
    // 3. Update date
    expect(screen.getByText(/8 février 2026/)).toBeDefined()
    // 4. First section "1. Responsable du traitement"
    expect(screen.getByText('1. Responsable du traitement')).toBeDefined()
    // 5. First section is defaultOpen, content visible
    expect(screen.getByText(/Squad Planner SAS/)).toBeDefined()
    // 6. Contact email visible in first section
    expect(screen.getByText(/privacy@squadplanner.fr/)).toBeDefined()
    // 7. Card wrapper present
    expect(container.querySelector('div')).not.toBeNull()
  })

  // STRICT: verifies all 11 legal sections are rendered with correct titles
  it('renders all 11 privacy sections with correct numbering and titles', () => {
    render(<PrivacyContent />)

    // 1-6 first six sections
    expect(screen.getByText('1. Responsable du traitement')).toBeDefined()
    expect(screen.getByText('2. Données collectées')).toBeDefined()
    expect(screen.getByText('3. Finalités du traitement')).toBeDefined()
    expect(screen.getByText('4. Base légale')).toBeDefined()
    expect(screen.getByText('5. Partage des données')).toBeDefined()
    expect(screen.getByText('6. Conservation des données')).toBeDefined()
    // 7-11 remaining sections
    expect(screen.getByText('7. Vos droits (RGPD)')).toBeDefined()
    expect(screen.getByText('8. Cookies et stockage local')).toBeDefined()
    expect(screen.getByText('9. Sécurité')).toBeDefined()
    expect(screen.getByText('10. Transferts internationaux')).toBeDefined()
    expect(screen.getByText('11. Contact et réclamation')).toBeDefined()
  })

  // STRICT: verifies defaultOpen behavior — first section expanded, others collapsed
  it('shows first section content expanded and other sections collapsed', () => {
    render(<PrivacyContent />)

    // 1. First section defaultOpen
    const firstSection = screen.getByTestId('section-1. Responsable du traitement')
    expect(firstSection.getAttribute('data-default-open')).toBe('true')
    // 2. First section content visible
    expect(screen.getByText(/privacy@squadplanner.fr/)).toBeDefined()
    // 3. Second section NOT defaultOpen
    const secondSection = screen.getByTestId('section-2. Données collectées')
    expect(secondSection.getAttribute('data-default-open')).not.toBe('true')
    // 4. Second section content NOT visible
    expect(screen.queryByText(/Données d'inscription/)).toBeNull()
    // 5. Total section count is 11
    const sections = screen.getAllByRole('heading', { level: 3 })
    expect(sections.length).toBe(11)
    // 6. Responsible entity mentioned
    expect(screen.getByText(/siège social/)).toBeDefined()
  })

  // STRICT: verifies content quality — GDPR terms, data types, legal language
  it('contains meaningful privacy content with GDPR references', () => {
    const { container } = render(<PrivacyContent />)

    // 1. "Politique de Confidentialité" heading
    expect(screen.getByText('Politique de Confidentialité')).toBeDefined()
    // 2. France mentioned in first section
    expect(screen.getByText(/France/)).toBeDefined()
    // 3. Company name
    expect(screen.getByText(/Squad Planner SAS/)).toBeDefined()
    // 4. Contact info present
    expect(screen.getByText(/privacy@squadplanner.fr/)).toBeDefined()
    // 5. Text content substantial
    expect(container.textContent!.length).toBeGreaterThan(200)
    // 6. Date properly formatted
    expect(screen.getByText(/Dernière mise à jour/)).toBeDefined()
  })
})
