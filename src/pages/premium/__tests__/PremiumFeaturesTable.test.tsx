import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../PremiumData', () => ({
  FEATURES: [
    { name: 'Squads', free: '2 max', premium: 'Illimité', icon: ({ children, ...props }: any) => createElement('span', props, children), highlight: true },
    { name: 'Export', free: false, premium: true, icon: ({ children, ...props }: any) => createElement('span', props, children), highlight: false },
  ],
}))

import { PremiumFeaturesTable } from '../PremiumFeaturesTable'

describe('PremiumFeaturesTable', () => {
  it('renders without crashing', () => {
    const { container } = render(<PremiumFeaturesTable />)
    expect(container).toBeTruthy()
  })

  it('renders title', () => {
    render(<PremiumFeaturesTable />)
    expect(screen.getByText(/Comparatif des fonctionnalités/)).toBeTruthy()
  })

  it('renders feature names', () => {
    render(<PremiumFeaturesTable />)
    expect(screen.getByText('Squads')).toBeTruthy()
    expect(screen.getByText('Export')).toBeTruthy()
  })
})
