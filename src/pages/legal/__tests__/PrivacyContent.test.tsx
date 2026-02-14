import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../LegalSection', () => ({
  LegalSection: ({ title, children, defaultOpen }: any) => createElement('div', {}, createElement('h3', {}, title), defaultOpen ? children : null),
}))

import { PrivacyContent } from '../PrivacyContent'

describe('PrivacyContent', () => {
  it('renders without crashing', () => {
    const { container } = render(<PrivacyContent />)
    expect(container).toBeTruthy()
  })

  it('renders the main title', () => {
    render(<PrivacyContent />)
    expect(screen.getByText('Politique de Confidentialité')).toBeTruthy()
  })

  it('renders the update date', () => {
    render(<PrivacyContent />)
    expect(screen.getByText(/8 février 2026/)).toBeTruthy()
  })

  it('renders multiple legal sections', () => {
    render(<PrivacyContent />)
    expect(screen.getByText('1. Responsable du traitement')).toBeTruthy()
    expect(screen.getByText('2. Données collectées')).toBeTruthy()
  })
})
