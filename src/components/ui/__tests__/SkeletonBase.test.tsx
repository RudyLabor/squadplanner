import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard,
  SkeletonWrapper,
} from '../skeleton/SkeletonBase'

describe('SkeletonBase', () => {
  describe('Skeleton', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<Skeleton />)
      expect(container.firstChild).toBeTruthy()
      expect((container.firstChild as HTMLElement).getAttribute('aria-hidden')).toBe('true')
    })

    it('applies className', () => {
      const { container } = render(<Skeleton className="h-4 w-32" />)
      expect((container.firstChild as HTMLElement).classList.contains('h-4')).toBe(true)
    })

    it('applies numeric width and height as px', () => {
      const { container } = render(<Skeleton width={100} height={20} />)
      const el = container.firstChild as HTMLElement
      expect(el.style.width).toBe('100px')
      expect(el.style.height).toBe('20px')
    })

    it('applies rounded classes', () => {
      const { container } = render(<Skeleton rounded="full" />)
      expect((container.firstChild as HTMLElement).classList.contains('rounded-full')).toBe(true)
    })

    it('defaults to rounded-md', () => {
      const { container } = render(<Skeleton />)
      expect((container.firstChild as HTMLElement).classList.contains('rounded-md')).toBe(true)
    })
  })

  describe('SkeletonText', () => {
    it('renders default 3 lines', () => {
      const { container } = render(<SkeletonText />)
      const skeletons = container.querySelectorAll('[aria-hidden="true"]')
      expect(skeletons.length).toBe(3)
    })

    it('renders specified number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />)
      const skeletons = container.querySelectorAll('[aria-hidden="true"]')
      expect(skeletons.length).toBe(5)
    })
  })

  describe('SkeletonAvatar', () => {
    it('renders as rounded-full', () => {
      const { container } = render(<SkeletonAvatar />)
      const el = container.querySelector('.rounded-full')
      expect(el).toBeTruthy()
    })

    it('applies size classes', () => {
      const { container } = render(<SkeletonAvatar size="lg" />)
      const el = container.querySelector('.w-12')
      expect(el).toBeTruthy()
    })
  })

  describe('SkeletonButton', () => {
    it('renders with default height', () => {
      const { container } = render(<SkeletonButton />)
      const el = container.querySelector('.h-10')
      expect(el).toBeTruthy()
    })

    it('renders with full width', () => {
      const { container } = render(<SkeletonButton width="full" />)
      const el = container.querySelector('.w-full')
      expect(el).toBeTruthy()
    })
  })

  describe('SkeletonCard', () => {
    it('renders with aria-hidden', () => {
      const { container } = render(<SkeletonCard />)
      const el = container.firstChild as HTMLElement
      expect(el.getAttribute('aria-hidden')).toBe('true')
    })

    it('renders default content when no children', () => {
      const { container } = render(<SkeletonCard />)
      const skeletons = container.querySelectorAll('[aria-hidden="true"]')
      expect(skeletons.length).toBeGreaterThan(1)
    })

    it('renders custom children', () => {
      const { container } = render(
        <SkeletonCard>
          <div data-testid="custom">Custom</div>
        </SkeletonCard>
      )
      expect(container.querySelector('[data-testid="custom"]')).toBeTruthy()
    })
  })

  describe('SkeletonWrapper', () => {
    it('shows skeleton when isLoading is true', () => {
      const { container } = render(
        <SkeletonWrapper isLoading={true} skeleton={<div data-testid="skel">Loading</div>}>
          <div data-testid="content">Content</div>
        </SkeletonWrapper>
      )
      expect(container.querySelector('[data-testid="skel"]')).toBeTruthy()
      expect(container.querySelector('[data-testid="content"]')).toBeNull()
    })

    it('shows children when isLoading is false', () => {
      const { container } = render(
        <SkeletonWrapper isLoading={false} skeleton={<div data-testid="skel">Loading</div>}>
          <div data-testid="content">Content</div>
        </SkeletonWrapper>
      )
      expect(container.querySelector('[data-testid="skel"]')).toBeNull()
      expect(container.querySelector('[data-testid="content"]')).toBeTruthy()
    })
  })
})
