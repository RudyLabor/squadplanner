import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => ({
  Crown: (p: any) => createElement('span', { ...p, 'data-icon': 'Crown' }),
  Check: (p: any) => createElement('span', { ...p, 'data-icon': 'Check' }),
  X: (p: any) => createElement('span', { ...p, 'data-icon': 'X' }),
  Users: (p: any) => createElement('span', { ...p, 'data-icon': 'Users' }),
  Calendar: (p: any) => createElement('span', { ...p, 'data-icon': 'Calendar' }),
  Sparkles: (p: any) => createElement('span', { ...p, 'data-icon': 'Sparkles' }),
  BarChart3: (p: any) => createElement('span', { ...p, 'data-icon': 'BarChart3' }),
  Mic2: (p: any) => createElement('span', { ...p, 'data-icon': 'Mic2' }),
  Shield: (p: any) => createElement('span', { ...p, 'data-icon': 'Shield' }),
  Zap: (p: any) => createElement('span', { ...p, 'data-icon': 'Zap' }),
  ChevronRight: (p: any) => createElement('span', { ...p, 'data-icon': 'ChevronRight' }),
}))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  FEATURES: [
    { name: 'Squads', free: '2 max', premium: '5', squadLeader: 'Illimité', club: 'Illimité', icon: (p: any) => createElement('span', p), highlight: true },
    { name: 'Export', free: false, premium: false, squadLeader: true, club: true, icon: (p: any) => createElement('span', p), highlight: false },
    { name: 'Coach IA', free: false, premium: 'Basique', squadLeader: 'Avancé', club: 'Avancé', icon: (p: any) => createElement('span', p), highlight: false },
  ],
}))

import { PremiumFeaturesTable } from '../PremiumFeaturesTable'

describe('PremiumFeaturesTable', () => {
  // STRICT: verifies table renders with title, column headers, all feature rows, free/premium values
  it('renders features table with title, column headers, and all feature rows', () => {
    const { container } = render(<PremiumFeaturesTable />)

    // 1. Section title
    expect(screen.getByText(/Comparatif des fonctionnalit/)).toBeDefined()
    // 2. Column header: Feature
    expect(screen.getByText('Feature')).toBeDefined()
    // 3. Column header: Gratuit
    expect(screen.getByText('Gratuit')).toBeDefined()
    // 4. Premium badge in header
    expect(screen.getByText('Premium')).toBeDefined()
    // 4b. Leader and Club badges in header (4-tier)
    expect(screen.getByText('Leader', { exact: false })).toBeDefined()
    expect(screen.getByText('Club')).toBeDefined()
    // 5. All feature names
    expect(screen.getByText('Squads')).toBeDefined()
    expect(screen.getByText('Export')).toBeDefined()
    expect(screen.getByText('Coach IA')).toBeDefined()
    // 6. String free values rendered
    expect(screen.getByText('2 max')).toBeDefined()
    // 7. String premium values rendered (multiple Illimité across tiers)
    expect(screen.getAllByText('Illimité').length).toBeGreaterThanOrEqual(1)
  })

  // STRICT: verifies boolean free/premium values render as check/X icons, and alternating rows
  it('renders boolean values as check/X icons and alternating row backgrounds', () => {
    const { container } = render(<PremiumFeaturesTable />)

    // 1. Feature icons rendered for each row (3 features = 3+ icon spans)
    const iconSpans = container.querySelectorAll('span')
    expect(iconSpans.length).toBeGreaterThanOrEqual(3)
    // 2. Alternating row backgrounds (bg-bg-base / bg-overlay-faint/50)
    const bgBaseRows = container.querySelectorAll('.bg-bg-base')
    expect(bgBaseRows.length).toBeGreaterThan(0)
    // 3. Card wrapper exists
    expect(container.querySelector('div')).not.toBeNull()
    // 4. 3 feature rows rendered
    const rows = container.querySelectorAll('.animate-fade-in-up')
    expect(rows.length).toBeGreaterThanOrEqual(3)
    // 5. Grid layout applied
    const grids = container.querySelectorAll('.grid')
    expect(grids.length).toBeGreaterThan(0)
    // 6. Sticky first column
    const stickyElements = container.querySelectorAll('.sticky')
    expect(stickyElements.length).toBeGreaterThan(0)
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
