import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
}))

vi.mock('../LegalSection', () => ({
  LegalSection: ({ title, children, defaultOpen }: any) => createElement('div', { 'data-testid': `section-${title}` }, createElement('h3', {}, title), defaultOpen ? children : null),
}))

import { CGUContent } from '../CGUContent'

describe('CGUContent', () => {
  it('renders without crashing', () => {
    const { container } = render(<CGUContent />)
    expect(container).toBeTruthy()
  })

  it('renders the main title', () => {
    render(<CGUContent />)
    expect(screen.getByText("Conditions Générales d'Utilisation")).toBeTruthy()
  })

  it('renders the update date', () => {
    render(<CGUContent />)
    expect(screen.getByText(/8 février 2026/)).toBeTruthy()
  })

  it('renders multiple legal sections', () => {
    render(<CGUContent />)
    expect(screen.getByText('1. Objet')).toBeTruthy()
    expect(screen.getByText("2. Acceptation des conditions")).toBeTruthy()
  })
})
