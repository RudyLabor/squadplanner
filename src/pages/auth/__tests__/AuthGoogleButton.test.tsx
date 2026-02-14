import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/ui', () => ({
  Button: ({ children, ...props }: any) => createElement('button', props, children),
}))

import { AuthGoogleButton } from '../AuthGoogleButton'

describe('AuthGoogleButton', () => {
  it('renders without crashing', () => {
    const { container } = render(<AuthGoogleButton onClick={vi.fn()} disabled={false} />)
    expect(container).toBeTruthy()
  })

  it('renders Google button text', () => {
    render(<AuthGoogleButton onClick={vi.fn()} disabled={false} />)
    expect(screen.getByText('Continuer avec Google')).toBeTruthy()
  })

  it('renders divider text', () => {
    render(<AuthGoogleButton onClick={vi.fn()} disabled={false} />)
    expect(screen.getByText('ou par email')).toBeTruthy()
  })

  it('calls onClick when button is clicked', () => {
    const onClick = vi.fn()
    render(<AuthGoogleButton onClick={onClick} disabled={false} />)
    fireEvent.click(screen.getByText('Continuer avec Google'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('has aria-label for accessibility', () => {
    render(<AuthGoogleButton onClick={vi.fn()} disabled={false} />)
    expect(screen.getByLabelText('Continuer avec Google')).toBeTruthy()
  })
})
