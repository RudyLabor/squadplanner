import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('../../../utils/gameImages', () => ({
  getGameImageUrl: vi.fn().mockReturnValue('/images/valorant.jpg'),
  getGameGradient: vi.fn().mockReturnValue('linear-gradient(to br, red, blue)'),
  getGameInitial: vi.fn().mockReturnValue('V'),
  hasGameImage: vi.fn().mockReturnValue(true),
}))

import { GameCover, GameCoverCompact, GameCoverLarge } from '../GameCover'

describe('GameCover', () => {
  it('renders without crash', () => {
    render(<GameCover gameName="Valorant" />)
    expect(screen.getByAltText('Valorant cover')).toBeInTheDocument()
  })

  it('shows game name on hover overlay', () => {
    render(<GameCover gameName="Valorant" />)
    expect(screen.getByText('Valorant')).toBeInTheDocument()
  })

  it('renders compact variant', () => {
    render(<GameCoverCompact gameName="Apex" />)
    expect(screen.getByAltText('Apex cover')).toBeInTheDocument()
  })

  it('renders large variant', () => {
    render(<GameCoverLarge gameName="Fortnite" />)
    expect(screen.getByAltText('Fortnite cover')).toBeInTheDocument()
  })
})
