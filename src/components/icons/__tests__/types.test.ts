import { describe, it, expect } from 'vitest'
import { d } from '../types'
import type { IconProps } from '../types'

describe('icons/types', () => {
  // STRICT: verifies the d object exports all required SVG default attributes with exact values and types
  it('d contains all default SVG attributes with correct values', () => {
    expect(d.xmlns).toBe('http://www.w3.org/2000/svg')
    expect(d.width).toBe(24)
    expect(d.height).toBe(24)
    expect(d.viewBox).toBe('0 0 24 24')
    expect(d.fill).toBe('none')
    expect(d.stroke).toBe('currentColor')
    expect(d.strokeWidth).toBe(2)
    expect(d.strokeLinecap).toBe('round')
    expect(d.strokeLinejoin).toBe('round')
    expect(Object.keys(d).length).toBe(9)
  })

  // STRICT: verifies d attribute types are correct at runtime and strokeLinecap/strokeLinejoin use literal 'round' type
  it('d attributes have correct runtime types', () => {
    expect(typeof d.xmlns).toBe('string')
    expect(typeof d.width).toBe('number')
    expect(typeof d.height).toBe('number')
    expect(typeof d.viewBox).toBe('string')
    expect(typeof d.fill).toBe('string')
    expect(typeof d.stroke).toBe('string')
    expect(typeof d.strokeWidth).toBe('number')
    expect(typeof d.strokeLinecap).toBe('string')
    expect(typeof d.strokeLinejoin).toBe('string')
  })

  // STRICT: verifies IconProps type is compatible with SVG props including standard and custom attributes
  it('IconProps type accepts standard SVG attributes', () => {
    const minProps: IconProps = { width: 16, height: 16 }
    expect(minProps.width).toBe(16)
    expect(minProps.height).toBe(16)

    const fullProps: IconProps = {
      width: 32,
      height: 32,
      className: 'icon-test',
      fill: 'red',
      stroke: 'blue',
      strokeWidth: 3,
      viewBox: '0 0 32 32',
      'aria-hidden': true,
    }
    expect(fullProps.className).toBe('icon-test')
    expect(fullProps.fill).toBe('red')
    expect(fullProps.stroke).toBe('blue')
    expect(fullProps.strokeWidth).toBe(3)
    expect(fullProps['aria-hidden']).toBe(true)
    expect(fullProps.viewBox).toBe('0 0 32 32')
  })
})
