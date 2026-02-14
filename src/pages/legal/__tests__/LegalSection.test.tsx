import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

import { LegalSection } from '../LegalSection'

describe('LegalSection', () => {
  it('renders without crashing', () => {
    const { container } = render(<LegalSection title="Test"><p>Content</p></LegalSection>)
    expect(container).toBeTruthy()
  })

  it('renders the title', () => {
    render(<LegalSection title="Test Title"><p>Content</p></LegalSection>)
    expect(screen.getByText('Test Title')).toBeTruthy()
  })

  it('hides content by default', () => {
    render(<LegalSection title="Test"><p>Hidden content</p></LegalSection>)
    expect(screen.queryByText('Hidden content')).toBeNull()
  })

  it('shows content when defaultOpen is true', () => {
    render(<LegalSection title="Test" defaultOpen><p>Visible content</p></LegalSection>)
    expect(screen.getByText('Visible content')).toBeTruthy()
  })

  it('toggles content on click', () => {
    render(<LegalSection title="Test"><p>Toggle content</p></LegalSection>)
    expect(screen.queryByText('Toggle content')).toBeNull()
    fireEvent.click(screen.getByText('Test'))
    expect(screen.getByText('Toggle content')).toBeTruthy()
    fireEvent.click(screen.getByText('Test'))
    expect(screen.queryByText('Toggle content')).toBeNull()
  })
})
