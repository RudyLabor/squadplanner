import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AnimatedCheckmark, AnimatedXMark, AnimatedWarning, AnimatedInfo } from '../ToastIcons'

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      ...actual.motion,
      svg: ({ children, ...props }: any) => {
        const { initial, animate, transition, ...rest } = props
        return <svg {...rest}>{children}</svg>
      },
      circle: (props: any) => {
        const { initial, animate, transition, ...rest } = props
        return <circle {...rest} />
      },
      path: (props: any) => {
        const { initial, animate, transition, ...rest } = props
        return <path {...rest} />
      },
      line: (props: any) => {
        const { initial, animate, transition, ...rest } = props
        return <line {...rest} />
      },
    },
  }
})

describe('AnimatedCheckmark', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedCheckmark />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('accepts custom size', () => {
    const { container } = render(<AnimatedCheckmark size={32} />)
    expect(container.querySelector('svg')).toHaveAttribute('width', '32')
  })
})

describe('AnimatedXMark', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedXMark />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AnimatedWarning', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedWarning />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AnimatedInfo', () => {
  it('renders svg with aria-hidden', () => {
    const { container } = render(<AnimatedInfo />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
