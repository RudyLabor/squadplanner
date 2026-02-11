import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ImageViewer } from '../ImageViewer'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, drag, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
    m: {
      ...actual.m,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, drag, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
  }
})

describe('ImageViewer', () => {
  it('does not render when closed', () => {
    render(<ImageViewer src="test.jpg" isOpen={false} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders when open', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal=true', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('renders image with src', () => {
    render(<ImageViewer src="test.jpg" alt="Test image" isOpen onClose={() => {}} />)
    expect(screen.getByAltText('Test image')).toHaveAttribute('src', 'test.jpg')
  })

  it('renders toolbar controls', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByLabelText('Zoomer')).toBeInTheDocument()
    expect(screen.getByLabelText('Dézoomer')).toBeInTheDocument()
    expect(screen.getByLabelText('Pivoter')).toBeInTheDocument()
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ImageViewer src="test.jpg" isOpen onClose={onClose} />)
    await user.click(screen.getByLabelText('Fermer'))
    expect(onClose).toHaveBeenCalled()
  })

  it('displays zoom percentage', () => {
    render(<ImageViewer src="test.jpg" isOpen onClose={() => {}} />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
