/**
 * Automated accessibility tests for all UI components
 * Uses axe-core via jest-axe to detect WCAG violations
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

// ─── Button ───────────────────────────────────────────────
import { Button } from '../Button'

describe('Button a11y', () => {
  it('renders without a11y violations', async () => {
    const { container } = render(<Button>Click me</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders loading state without violations', async () => {
    const { container } = render(<Button isLoading>Loading</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders disabled state without violations', async () => {
    const { container } = render(<Button disabled>Disabled</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Card ─────────────────────────────────────────────────
import { Card } from '../Card'

describe('Card a11y', () => {
  it('renders without a11y violations', async () => {
    const { container } = render(<Card>Card content</Card>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders clickable card without violations', async () => {
    const { container } = render(<Card onClick={() => {}}>Clickable</Card>)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Input ────────────────────────────────────────────────
import { Input } from '../Input'

describe('Input a11y', () => {
  it('renders with label without violations', async () => {
    const { container } = render(<Input label="Email" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders with error without violations', async () => {
    const { container } = render(<Input label="Email" error="Required field" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Badge ────────────────────────────────────────────────
import { Badge } from '../Badge'

describe('Badge a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<Badge variant="success">Active</Badge>)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders count badge without violations', async () => {
    const { container } = render(<Badge variant="primary" count={5} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Toggle ───────────────────────────────────────────────
import { Toggle } from '../Toggle'

describe('Toggle a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<Toggle checked={false} onChange={() => {}} label="Dark mode" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders checked state without violations', async () => {
    const { container } = render(<Toggle checked={true} onChange={() => {}} label="Dark mode" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Checkbox ─────────────────────────────────────────────
import { Checkbox } from '../Checkbox'

describe('Checkbox a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<Checkbox label="Accept terms" checked={false} onChange={() => {}} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── ProgressBar ──────────────────────────────────────────
import { ProgressBar } from '../ProgressBar'

describe('ProgressBar a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<ProgressBar value={50} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── ProgressRing ─────────────────────────────────────────
import { ProgressRing } from '../ProgressRing'

describe('ProgressRing a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<ProgressRing value={75} size={48} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Divider ──────────────────────────────────────────────
import { Divider } from '../Divider'

describe('Divider a11y', () => {
  it('renders horizontal without violations', async () => {
    const { container } = render(<Divider />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('renders with text without violations', async () => {
    const { container } = render(<Divider text="or" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Slider ───────────────────────────────────────────────
import { Slider } from '../Slider'

describe('Slider a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<Slider value={50} onChange={() => {}} label="Volume" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── EmptyState ───────────────────────────────────────────
import { EmptyState } from '../EmptyState'

describe('EmptyState a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(
      <EmptyState
        title="No items"
        description="You have no items yet"
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Tooltip ──────────────────────────────────────────────
import { Tooltip } from '../Tooltip'

describe('Tooltip a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── AnimatedCounter ──────────────────────────────────────
import { AnimatedCounter } from '../AnimatedCounter'

describe('AnimatedCounter a11y', () => {
  it('renders with aria-live without violations', async () => {
    const { container } = render(<AnimatedCounter value={42} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── ScrollToTop ──────────────────────────────────────────
import { ScrollToTop } from '../ScrollToTop'

describe('ScrollToTop a11y', () => {
  it('renders without violations', async () => {
    const { container } = render(<ScrollToTop />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

// ─── Skeleton ─────────────────────────────────────────────
import { Skeleton } from '../Skeleton'

describe('Skeleton a11y', () => {
  it('renders without violations (should be aria-hidden)', async () => {
    const { container } = render(<Skeleton className="h-4 w-32" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})
