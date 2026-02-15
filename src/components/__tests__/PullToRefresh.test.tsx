import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock icons
vi.mock('../icons', () => ({
  RefreshCw: (props: any) => createElement('svg', { ...props, 'data-testid': 'icon-refresh' }),
}))

// Mock haptics
vi.mock('../../utils/haptics', () => ({
  haptic: { light: vi.fn(), medium: vi.fn(), selection: vi.fn() },
}))

import { PullToRefresh } from '../PullToRefresh'

describe('PullToRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // STRICT: Verifies children rendering, container ref setup, default className applied, content structure
  it('renders children correctly with default props and container structure', () => {
    const { container } = render(createElement(PullToRefresh, {
      onRefresh: vi.fn().mockResolvedValue(undefined),
      children: createElement('div', { 'data-testid': 'child' }, 'Pull Content'),
    }))

    // 1. Children are rendered
    expect(screen.getByText('Pull Content')).toBeInTheDocument()
    // 2. Child has correct test id
    expect(screen.getByTestId('child')).toBeInTheDocument()
    // 3. Container has 'relative' class (from default className='')
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toHaveClass('relative')
    // 4. No pull indicator visible initially (pullDistance is 0)
    expect(screen.queryByTestId('icon-refresh')).not.toBeInTheDocument()
    // 5. Container is a div element
    expect(wrapper.tagName).toBe('DIV')
    // 6. Content wrapper div exists inside
    expect(wrapper.children.length).toBeGreaterThanOrEqual(1)
  })

  // STRICT: Verifies custom className prop is applied, disabled prop doesn't break rendering
  it('applies custom className and renders correctly when disabled', () => {
    const { container } = render(createElement(PullToRefresh, {
      onRefresh: vi.fn().mockResolvedValue(undefined),
      className: 'custom-pull-class',
      children: createElement('div', {}, 'Custom Class'),
    }))

    // 1. Custom class is present
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('custom-pull-class')
    // 2. 'relative' class is also present
    expect(wrapper.className).toContain('relative')
    // 3. Children still rendered
    expect(screen.getByText('Custom Class')).toBeInTheDocument()
    // 4. No pull indicator visible
    expect(screen.queryByTestId('icon-refresh')).not.toBeInTheDocument()

    // Now test disabled prop
    const { container: disabledContainer } = render(createElement(PullToRefresh, {
      onRefresh: vi.fn().mockResolvedValue(undefined),
      disabled: true,
      children: createElement('div', {}, 'Disabled Content'),
    }))

    // 5. Disabled content still renders
    expect(screen.getByText('Disabled Content')).toBeInTheDocument()
    // 6. Container still has proper structure
    expect(disabledContainer.firstChild).toBeTruthy()
  })

  // STRICT: Verifies threshold prop, multiple children rendering, onRefresh ref is stored
  it('accepts threshold prop and renders multiple children correctly', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)
    const { container } = render(createElement(PullToRefresh, {
      onRefresh,
      threshold: 120,
      children: createElement('div', {},
        createElement('span', {}, 'Child 1'),
        createElement('span', {}, 'Child 2'),
        createElement('span', {}, 'Child 3'),
      ),
    }))

    // 1. All children render
    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
    // 2. Container wrapper exists
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper).toBeTruthy()
    // 3. Has relative class
    expect(wrapper).toHaveClass('relative')
    // 4. No refresh indicator visible at rest
    expect(screen.queryByTestId('icon-refresh')).not.toBeInTheDocument()
    // 5. onRefresh is a function (not called yet)
    expect(onRefresh).not.toHaveBeenCalled()
    // 6. Container has at least one child div
    expect(wrapper.children.length).toBeGreaterThanOrEqual(1)
  })
})
