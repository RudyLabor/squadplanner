import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { CopyLinkButton } from '../CopyLinkButton'

vi.mock('../../icons', () =>
  new Proxy({}, {
    get: (_t, name) =>
      typeof name === 'string'
        ? (props: any) => createElement('svg', { 'data-testid': `icon-${name}`, ...props })
        : undefined,
  })
)

describe('CopyLinkButton', () => {
  it('renders "Copier le lien d\'invitation" when not copied', () => {
    render(<CopyLinkButton linkCopied={false} onCopy={vi.fn()} />)
    expect(screen.getByText("Copier le lien d'invitation")).toBeDefined()
  })

  it('renders "Lien copié !" when copied', () => {
    render(<CopyLinkButton linkCopied={true} onCopy={vi.fn()} />)
    expect(screen.getByText('Lien copié !')).toBeDefined()
  })

  it('calls onCopy when clicked', () => {
    const onCopy = vi.fn()
    render(<CopyLinkButton linkCopied={false} onCopy={onCopy} />)
    fireEvent.click(screen.getByText("Copier le lien d'invitation"))
    expect(onCopy).toHaveBeenCalled()
  })

  it('shows Check icon when copied', () => {
    render(<CopyLinkButton linkCopied={true} onCopy={vi.fn()} />)
    expect(screen.getByTestId('icon-Check')).toBeDefined()
  })

  it('shows Copy icon when not copied', () => {
    render(<CopyLinkButton linkCopied={false} onCopy={vi.fn()} />)
    expect(screen.getByTestId('icon-Copy')).toBeDefined()
  })
})
