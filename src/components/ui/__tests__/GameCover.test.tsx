import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const getGameImageUrlMock = vi.fn().mockReturnValue('/images/valorant.jpg')
const getGameGradientMock = vi.fn().mockReturnValue('linear-gradient(to bottom right, #ff4655, #0f1923)')
const getGameInitialMock = vi.fn().mockReturnValue('V')
const hasGameImageMock = vi.fn().mockReturnValue(true)

vi.mock('../../../utils/gameImages', () => ({
  getGameImageUrl: (...args: any[]) => getGameImageUrlMock(...args),
  getGameGradient: (...args: any[]) => getGameGradientMock(...args),
  getGameInitial: (...args: any[]) => getGameInitialMock(...args),
  hasGameImage: (...args: any[]) => hasGameImageMock(...args),
}))

import { GameCover, GameCoverCompact, GameCoverLarge } from '../GameCover'

describe('GameCover', () => {
  // STRICT: renders image with correct alt, src, lazy loading, hover overlay with game name, correct size classes
  it('renders complete game cover with image, alt text, lazy loading, and hover overlay', () => {
    const { container } = render(<GameCover gameName="Valorant" size="md" />)

    // Image rendered with correct attributes
    const img = screen.getByAltText('Valorant cover')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/images/valorant.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')

    // Hover overlay contains game name
    expect(screen.getByText('Valorant')).toBeInTheDocument()

    // Size classes for md
    expect(container.firstChild).toHaveClass('w-24')
    expect(container.firstChild).toHaveClass('h-24')
    expect(container.firstChild).toHaveClass('text-2xl')

    // Common classes
    expect(container.firstChild).toHaveClass('rounded-lg')
    expect(container.firstChild).toHaveClass('overflow-hidden')
    expect(container.firstChild).toHaveClass('relative')
  })

  // STRICT: fallback renders gradient + initial letter when no image, no img tag, correct initial
  it('renders gradient fallback with initial when no image available', () => {
    hasGameImageMock.mockReturnValue(false)
    getGameInitialMock.mockReturnValue('A')
    getGameGradientMock.mockReturnValue('linear-gradient(to br, #00ff00, #0000ff)')

    const { container } = render(<GameCover gameName="Apex Legends" />)

    // No img tag when no image
    expect(screen.queryByRole('img')).not.toBeInTheDocument()

    // Initial letter shown
    expect(screen.getByText('A')).toBeInTheDocument()

    // Gradient applied as background
    expect(container.firstChild).toHaveStyle({
      background: 'linear-gradient(to br, #00ff00, #0000ff)',
    })

    // Hover overlay still shows game name
    expect(screen.getByText('Apex Legends')).toBeInTheDocument()

    // Restore mocks
    hasGameImageMock.mockReturnValue(true)
    getGameInitialMock.mockReturnValue('V')
  })

  // STRICT: image error triggers fallback to gradient + initial
  it('falls back to gradient on image load error', () => {
    hasGameImageMock.mockReturnValue(true)
    getGameInitialMock.mockReturnValue('F')
    getGameGradientMock.mockReturnValue('linear-gradient(to br, orange, purple)')

    render(<GameCover gameName="Fortnite" />)

    const img = screen.getByAltText('Fortnite cover')
    expect(img).toBeInTheDocument()

    // Simulate image error
    fireEvent.error(img)

    // After error, should show initial (image hidden via hasImage becoming false)
    expect(screen.getByText('F')).toBeInTheDocument()

    // Game name still in overlay
    expect(screen.getByText('Fortnite')).toBeInTheDocument()
  })

  // STRICT: size variants - sm, md, lg apply correct Tailwind classes
  it('applies correct size classes for sm, md, and lg', () => {
    // Small
    const { container: smContainer } = render(<GameCover gameName="V" size="sm" />)
    expect(smContainer.firstChild).toHaveClass('w-16', 'h-16', 'text-lg')

    // Medium (default)
    const { container: mdContainer } = render(<GameCover gameName="V" size="md" />)
    expect(mdContainer.firstChild).toHaveClass('w-24', 'h-24', 'text-2xl')

    // Large
    const { container: lgContainer } = render(<GameCover gameName="V" size="lg" />)
    expect(lgContainer.firstChild).toHaveClass('w-32', 'h-32', 'text-3xl')
  })

  // STRICT: GameCoverCompact renders with sm size, GameCoverLarge renders with lg size
  it('GameCoverCompact uses sm size and GameCoverLarge uses lg size', () => {
    const { container: compactContainer } = render(<GameCoverCompact gameName="LoL" />)
    expect(compactContainer.firstChild).toHaveClass('w-16', 'h-16', 'text-lg')
    expect(screen.getByAltText('LoL cover')).toBeInTheDocument()

    const { container: largeContainer } = render(<GameCoverLarge gameName="Dota" />)
    expect(largeContainer.firstChild).toHaveClass('w-32', 'h-32', 'text-3xl')
    expect(screen.getByAltText('Dota cover')).toBeInTheDocument()
  })

  // STRICT: custom className is applied alongside size classes
  it('applies custom className alongside default classes', () => {
    const { container } = render(<GameCover gameName="V" className="my-custom-class" />)
    expect(container.firstChild).toHaveClass('my-custom-class')
    expect(container.firstChild).toHaveClass('rounded-lg')
    expect(container.firstChild).toHaveClass('overflow-hidden')
  })

  // STRICT: image onLoad sets opacity to 100, initially opacity-0
  it('transitions image opacity from 0 to 100 on load', () => {
    render(<GameCover gameName="Valorant" />)

    const img = screen.getByAltText('Valorant cover')
    // Initially not loaded, should have opacity-0
    expect(img).toHaveClass('opacity-0')

    // Simulate load
    fireEvent.load(img)

    // After load, should have opacity-100
    expect(img).toHaveClass('opacity-100')
  })
})
