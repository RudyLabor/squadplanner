import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { createElement } from 'react'

import { SquadPlannerLogo, SquadPlannerIcon } from '../SquadPlannerLogo'

describe('SquadPlannerLogo', () => {
  it('renders an SVG element', () => {
    const { container } = render(createElement(SquadPlannerLogo))
    const svg = container.querySelector('svg')
    expect(svg).toBeDefined()
    expect(svg).not.toBeNull()
  })

  it('renders with default size of 24', () => {
    const { container } = render(createElement(SquadPlannerLogo))
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('24')
    expect(svg?.getAttribute('height')).toBe('24')
  })

  it('renders with custom size', () => {
    const { container } = render(createElement(SquadPlannerLogo, { size: 48 }))
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('48')
    expect(svg?.getAttribute('height')).toBe('48')
  })

  it('applies custom className', () => {
    const { container } = render(createElement(SquadPlannerLogo, { className: 'my-logo' }))
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('class')).toContain('my-logo')
  })

  it('renders circles for squad members', () => {
    const { container } = render(createElement(SquadPlannerLogo))
    const circles = container.querySelectorAll('circle')
    // 4 corner members + 1 central hub
    expect(circles.length).toBe(5)
  })

  it('exports SquadPlannerIcon as alias', () => {
    expect(SquadPlannerIcon).toBe(SquadPlannerLogo)
  })
})
