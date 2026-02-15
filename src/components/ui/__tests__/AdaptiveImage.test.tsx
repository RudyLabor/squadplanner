import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const useAdaptiveLoadingMock = vi.fn().mockReturnValue({ tier: 'high' })
vi.mock('../../../hooks/useAdaptiveLoading', () => ({
  useAdaptiveLoading: () => useAdaptiveLoadingMock(),
}))

import { AdaptiveImage } from '../AdaptiveImage'

describe('AdaptiveImage', () => {
  // STRICT: high tier loads full src, has lazy loading, async decoding, correct alt, width, height, transition classes
  it('renders high quality image with correct attributes on high tier', () => {
    const { container } = render(
      <AdaptiveImage
        src="/full.jpg"
        srcMedium="/med.jpg"
        srcLow="/low.jpg"
        alt="Hero image"
        width={800}
        height={600}
        className="hero-img"
      />
    )

    // Main image rendered with correct src
    const img = screen.getByAltText('Hero image')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/full.jpg')
    expect(img).toHaveAttribute('loading', 'lazy')
    expect(img).toHaveAttribute('decoding', 'async')
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '600')

    // Wrapper has className and dimensions
    expect(container.firstChild).toHaveClass('hero-img')
    expect(container.firstChild).toHaveClass('relative')
    expect(container.firstChild).toHaveClass('overflow-hidden')
    expect(container.firstChild).toHaveStyle({ width: '800px', height: '600px' })
  })

  // STRICT: medium tier uses srcMedium, low tier uses srcLow, high tier uses full src
  it('selects correct source based on network tier', () => {
    // Medium tier
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'medium' })
    const { unmount: u1 } = render(
      <AdaptiveImage src="/full.jpg" srcMedium="/med.jpg" srcLow="/low.jpg" alt="medium-test" />
    )
    expect(screen.getByAltText('medium-test')).toHaveAttribute('src', '/med.jpg')
    u1()

    // Low tier with srcLow
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'low' })
    const { unmount: u2 } = render(
      <AdaptiveImage src="/full.jpg" srcMedium="/med.jpg" srcLow="/low.jpg" alt="low-test" />
    )
    expect(screen.getByAltText('low-test')).toHaveAttribute('src', '/low.jpg')
    u2()

    // High tier
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'high' })
    render(
      <AdaptiveImage src="/full.jpg" srcMedium="/med.jpg" srcLow="/low.jpg" alt="high-test" />
    )
    expect(screen.getByAltText('high-test')).toHaveAttribute('src', '/full.jpg')
  })

  // STRICT: placeholder blur-up renders aria-hidden img with blur filter, disappears after load
  it('shows placeholder with blur-up effect and hides after load', () => {
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'high' })
    const { container } = render(
      <AdaptiveImage
        src="/full.jpg"
        alt="With placeholder"
        placeholder="data:image/svg+xml,tiny"
      />
    )

    // Placeholder image is present (aria-hidden, blurred)
    const placeholderImg = container.querySelector('img[aria-hidden="true"]')
    expect(placeholderImg).toBeInTheDocument()
    expect(placeholderImg).toHaveAttribute('src', 'data:image/svg+xml,tiny')
    expect(placeholderImg).toHaveStyle({ filter: 'blur(20px)' })

    // Main image starts with opacity-0
    const mainImg = screen.getByAltText('With placeholder')
    expect(mainImg).toHaveClass('opacity-0')

    // Simulate load
    fireEvent.load(mainImg)

    // After load, main image has opacity-100
    expect(mainImg).toHaveClass('opacity-100')
  })

  // STRICT: eager mode always loads full quality regardless of tier
  it('loads full quality when eager prop is true regardless of tier', () => {
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'low' })
    render(
      <AdaptiveImage
        src="/full.jpg"
        srcMedium="/med.jpg"
        srcLow="/low.jpg"
        alt="Eager image"
        eager={true}
      />
    )

    // Even on low tier, eager forces full src
    expect(screen.getByAltText('Eager image')).toHaveAttribute('src', '/full.jpg')
  })

  // STRICT: low tier with no srcLow but placeholder shows "Connexion lente" overlay
  it('shows slow connection overlay on low tier when only placeholder is available', () => {
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'low' })
    render(
      <AdaptiveImage
        src="/full.jpg"
        alt="Slow connection"
        placeholder="data:image/svg+xml,tiny"
      />
    )

    // "Connexion lente" text shown
    expect(screen.getByText('Connexion lente')).toBeInTheDocument()

    // Main image should NOT be rendered (showPlaceholderOnly)
    expect(screen.queryByAltText('Slow connection')).not.toBeInTheDocument()
  })

  // STRICT: error state falls back to placeholder
  it('falls back to placeholder on image error', () => {
    useAdaptiveLoadingMock.mockReturnValue({ tier: 'high' })
    render(
      <AdaptiveImage
        src="/broken.jpg"
        alt="Broken image"
        placeholder="data:image/svg+xml,fallback"
      />
    )

    const img = screen.getByAltText('Broken image')
    expect(img).toHaveAttribute('src', '/broken.jpg')

    // Simulate error
    fireEvent.error(img)

    // Should now use placeholder as fallback
    expect(img).toHaveAttribute('src', 'data:image/svg+xml,fallback')
  })
})
