import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../icons', () => new Proxy({}, {
  get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', props, String(p)) : undefined,
}))

import { mockMembers, MockNavbar } from '../MockupShared'

describe('MockupShared', () => {
  it('exports mockMembers', () => {
    expect(mockMembers).toHaveLength(5)
    expect(mockMembers[0].name).toBe('Max')
  })

  it('MockNavbar renders without crash', () => {
    render(<MockNavbar active="home" />)
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByText('Squads')).toBeInTheDocument()
  })
})
