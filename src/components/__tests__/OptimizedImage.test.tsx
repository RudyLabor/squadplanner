import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

// Mock imageUtils
vi.mock('../imageUtils', () => ({
  getPlaceholderUrl: vi.fn().mockReturnValue(undefined),
  getOptimizedSrc: vi.fn().mockImplementation((src: string) => src),
}))

import { OptimizedImage, Avatar } from '../OptimizedImage'

describe('OptimizedImage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock IntersectionObserver
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }
    vi.stubGlobal('IntersectionObserver', vi.fn().mockImplementation(() => mockObserver))
  })

  it('renders fallback when src is null', () => {
    render(createElement(OptimizedImage, {
      src: null,
      alt: 'test image',
      fallback: createElement('div', { 'data-testid': 'fallback' }, 'No image'),
    }))
    expect(screen.getByTestId('fallback')).toBeDefined()
  })

  it('renders with skeleton placeholder by default', () => {
    render(createElement(OptimizedImage, {
      src: 'https://example.com/image.jpg',
      alt: 'test image',
      priority: true,
    }))
    // Priority images show immediately
    const img = screen.getByAltText('test image')
    expect(img).toBeDefined()
  })

  it('sets loading to eager for priority images', () => {
    render(createElement(OptimizedImage, {
      src: 'https://example.com/image.jpg',
      alt: 'test priority',
      priority: true,
    }))
    const img = screen.getByAltText('test priority')
    expect(img.getAttribute('loading')).toBe('eager')
  })
})

describe('Avatar', () => {
  it('renders fallback initial when no src', () => {
    render(createElement(Avatar, { src: null, alt: 'John' }))
    expect(screen.getByText('J')).toBeDefined()
  })

  it('renders image when src is provided', () => {
    render(createElement(Avatar, { src: 'https://example.com/avatar.jpg', alt: 'Jane' }))
    const img = screen.getByAltText('Jane')
    expect(img).toBeDefined()
  })

  it('applies size classes correctly', () => {
    const { container } = render(createElement(Avatar, { src: null, alt: 'Test', size: 'lg' }))
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('w-12')
    expect(wrapper.className).toContain('h-12')
  })
})
