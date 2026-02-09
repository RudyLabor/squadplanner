import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Tooltip, TooltipTrigger } from '../Tooltip'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      ...actual.motion,
      div: ({ children, ...props }: any) => {
        const { initial, animate, exit, transition, style: mStyle, ...rest } = props
        return <div style={mStyle} {...rest}>{children}</div>
      },
    },
  }
})

describe('Tooltip', () => {
  it('renders children', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.getByText('Hover me')).toBeInTheDocument()
  })

  it('does not show tooltip initially', () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('renders trigger wrapper as inline-block', () => {
    const { container } = render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(container.querySelector('.inline-block')).toBeInTheDocument()
  })
})

describe('TooltipTrigger', () => {
  it('renders children', () => {
    render(
      <TooltipTrigger content="Help">
        <button>Button</button>
      </TooltipTrigger>
    )
    expect(screen.getByText('Button')).toBeInTheDocument()
  })

  it('includes sr-only text for screen readers', () => {
    render(
      <TooltipTrigger content="Help text">
        <button>Button</button>
      </TooltipTrigger>
    )
    expect(screen.getByText('Help text')).toHaveClass('sr-only')
  })
})
