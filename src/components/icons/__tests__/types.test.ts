import { describe, it, expect } from 'vitest'
import { d } from '../types'
import type { IconProps } from '../types'

describe('icons/types', () => {
  it('module can be imported', () => {
    expect(d).toBeDefined()
  })

  it('d contains default SVG attributes', () => {
    expect(d.xmlns).toBe('http://www.w3.org/2000/svg')
    expect(d.width).toBe(24)
    expect(d.height).toBe(24)
  })

  it('IconProps type is usable', () => {
    const props: IconProps = { width: 16, height: 16 }
    expect(props.width).toBe(16)
  })
})
