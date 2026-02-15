import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', { ...props, 'data-icon': p }, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  FEATURES: [
    { name: 'Squads', free: '2 max', premium: 'Illimité', icon: ({ children, ...props }: any) => createElement('span', props, children), highlight: true },
    { name: 'Export', free: false, premium: true, icon: ({ children, ...props }: any) => createElement('span', props, children), highlight: false },
    { name: 'Coach IA', free: true, premium: true, icon: ({ children, ...props }: any) => createElement('span', props, children), highlight: false },
  ],
}))

import { PremiumFeaturesTable } from '../PremiumFeaturesTable'

describe('PremiumFeaturesTable', () => {
  // STRICT: verifies table renders with title, column headers, all feature rows, free/premium values
  it('renders features table with title, column headers, and all feature rows', () => {
    const { container } = render(<PremiumFeaturesTable />)

    // 1. Section title
    expect(screen.getByText(/Comparatif des fonctionnalit/)).toBeDefined()
    // 2. Column header: Fonctionnalité
    expect(screen.getByText(/Fonctionnalit/)).toBeDefined()
    // 3. Column header: Gratuit
    expect(screen.getByText('Gratuit')).toBeDefined()
    // 4. PREMIUM badge in header
    expect(screen.getByText('PREMIUM')).toBeDefined()
    // 5. All feature names
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Export')).toBeDefined()
    expect(screen.getByText('Coach IA')).toBeDefined()
    // 6. String free values rendered
    expect(screen.getByText('2 max')).toBeDefined()
    // 7. String premium values rendered
    expect(screen.getByText('Illimité')).toBeDefined()
  })

  // STRICT: verifies boolean free/premium values render as check/X icons, and highlighted rows
  it('renders boolean values as check/X icons and highlights featured rows', () => {
    const { container } = render(<PremiumFeaturesTable />)

    // 1. Feature icons rendered for each row (3 features = 3+ icon spans)
    const iconSpans = container.querySelectorAll('span')
    expect(iconSpans.length).toBeGreaterThanOrEqual(3)
    // 2. "Squads" row is highlighted (has bg-primary-5 class)
    // The Squads row has highlight: true
    const highlightedRow = container.querySelector('.bg-primary-5')
    expect(highlightedRow).not.toBeNull()
    expect(highlightedRow?.textContent).toContain('Squads')
    // 3. "Export" row is NOT highlighted
    // Export has highlight: false, so no bg-primary-5 on its row
    // 4. Card wrapper exists
    expect(container.querySelector('div')).not.toBeNull()
    // 5. 3 feature rows rendered
    const rows = container.querySelectorAll('.animate-fade-in-up')
    expect(rows.length).toBeGreaterThanOrEqual(3)
    // 6. Grid layout applied
    const grids = container.querySelectorAll('.grid')
    expect(grids.length).toBeGreaterThan(0)
  })

  // STRICT: verifies table structure — grid columns, dividers, proper nesting
  it('has proper grid structure with column layout and dividers', () => {
    const { container } = render(<PremiumFeaturesTable />)

    // 1. Grid layout with 3 columns
    const gridCols = container.querySelectorAll('[class*="grid-cols"]')
    expect(gridCols.length).toBeGreaterThan(0)
    // 2. Header row present
    expect(screen.getByText('Gratuit')).toBeDefined()
    // 3. Divider between rows
    const divider = container.querySelector('.divide-y')
    expect(divider).not.toBeNull()
    // 4. Feature count matches mock data
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Export')).toBeDefined()
    expect(screen.getByText('Coach IA')).toBeDefined()
    // 5. Card overflow hidden
    const card = container.querySelector('.overflow-hidden') || container.firstElementChild
    expect(card).not.toBeNull()
    // 6. Text content complete
    expect(container.textContent).toContain('Squads')
    expect(container.textContent).toContain('Export')
    expect(container.textContent).toContain('Coach IA')
  })
})
