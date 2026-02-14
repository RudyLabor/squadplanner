import { describe, it, expect, vi } from 'vitest'
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
  it('renders children', () => {
    render(createElement(PullToRefresh, {
      onRefresh: vi.fn().mockResolvedValue(undefined),
      children: createElement('div', {}, 'Content'),
    }))
    expect(screen.getByText('Content')).toBeDefined()
  })

  it('renders with custom className', () => {
    const { container } = render(createElement(PullToRefresh, {
      onRefresh: vi.fn().mockResolvedValue(undefined),
      className: 'custom-class',
      children: createElement('div', {}, 'Stuff'),
    }))
    expect(container.firstChild).toBeDefined()
    expect((container.firstChild as HTMLElement).className).toContain('custom-class')
  })

  it('renders without crashing when disabled', () => {
    render(createElement(PullToRefresh, {
      onRefresh: vi.fn().mockResolvedValue(undefined),
      disabled: true,
      children: createElement('div', {}, 'Disabled Pull'),
    }))
    expect(screen.getByText('Disabled Pull')).toBeDefined()
  })
})
