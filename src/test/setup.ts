import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Mock IntersectionObserver (not available in jsdom)
class MockIntersectionObserver {
  root = null
  rootMargin = ''
  thresholds: number[] = []
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])
}
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

// Mock ResizeObserver (not available in jsdom)
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
vi.stubGlobal('ResizeObserver', MockResizeObserver)

afterEach(() => {
  cleanup()
})
