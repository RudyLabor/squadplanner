import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../icons', () => new Proxy({}, {
  get: (_t, p) => typeof p === 'string' ? (props: any) => createElement('span', props, String(p)) : undefined,
}))

import { mockMembers, MockNavbar } from '../MockupShared'

describe('MockupShared', () => {
  // STRICT: verifies mockMembers exports 5 members with correct structure (name, initial, color, score)
  it('exports mockMembers with correct data structure', () => {
    expect(mockMembers).toHaveLength(5)
    expect(mockMembers[0].name).toBe('Max')
    expect(mockMembers[0].initial).toBe('M')
    expect(mockMembers[0].score).toBe(94)
    expect(typeof mockMembers[0].color).toBe('string')

    expect(mockMembers[1].name).toBe('Luna')
    expect(mockMembers[1].initial).toBe('L')
    expect(mockMembers[1].score).toBe(100)

    expect(mockMembers[2].name).toBe('Kira')
    expect(mockMembers[2].initial).toBe('K')
    expect(mockMembers[2].score).toBe(87)

    expect(mockMembers[3].name).toBe('Jay')
    expect(mockMembers[3].initial).toBe('J')
    expect(mockMembers[3].score).toBe(92)

    expect(mockMembers[4].name).toBe('Zoe')
    expect(mockMembers[4].initial).toBe('Z')
    expect(mockMembers[4].score).toBe(78)

    // Each member has all required fields
    mockMembers.forEach((m) => {
      expect(m).toHaveProperty('name')
      expect(m).toHaveProperty('initial')
      expect(m).toHaveProperty('color')
      expect(m).toHaveProperty('score')
    })
  })

  // STRICT: verifies MockNavbar renders all 5 nav items with labels and highlights the active one
  it('MockNavbar renders all nav items and highlights active', () => {
    render(<MockNavbar active="home" />)
    expect(screen.getByText('Accueil')).toBeInTheDocument()
    expect(screen.getByText('Squads')).toBeInTheDocument()
    expect(screen.getByText('Party')).toBeInTheDocument()
    expect(screen.getByText('Messages')).toBeInTheDocument()
    expect(screen.getByText('Profil')).toBeInTheDocument()

    // Active item has primary color class
    const accueil = screen.getByText('Accueil')
    expect(accueil.classList.contains('text-primary')).toBe(true)
    expect(accueil.classList.contains('font-medium')).toBe(true)

    // Inactive items have tertiary color class
    const squads = screen.getByText('Squads')
    expect(squads.classList.contains('text-text-tertiary')).toBe(true)
    expect(squads.classList.contains('font-medium')).toBe(false)

    // Icons rendered for each nav item (5 icons)
    const icons = screen.getAllByText(/Home|Users|Mic|MessageCircle|User/)
    expect(icons.length).toBe(5)
  })
})
