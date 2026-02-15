import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('react-router', () => {
  const navigateFn = vi.fn()
  return {
    useNavigate: vi.fn().mockReturnValue(navigateFn),
    __mockNavigate: navigateFn,
  }
})

vi.mock('../../icons', () => ({
  ChevronLeft: (props: any) => createElement('span', props, 'back'),
}))

import { MobilePageHeader } from '../MobilePageHeader'

describe('MobilePageHeader', () => {
  // STRICT: verifies title renders as p[role=heading] with correct text and styling classes, mobile-only wrapper class
  it('renders title with correct semantic heading and styling', () => {
    const { container } = render(<MobilePageHeader title="Test Title" />)
    const heading = screen.getByText('Test Title')
    expect(heading.tagName).toBe('P')
    expect(heading.getAttribute('role')).toBe('heading')
    expect(heading.getAttribute('aria-level')).toBe('2')
    expect(heading.classList.contains('text-base')).toBe(true)
    expect(heading.classList.contains('font-semibold')).toBe(true)
    expect(heading.classList.contains('truncate')).toBe(true)

    // Wrapper has mobile-only class
    const wrapper = container.firstElementChild
    expect(wrapper?.classList.contains('mobile-only')).toBe(true)
    expect(wrapper?.classList.contains('items-center')).toBe(true)
  })

  // STRICT: verifies back button renders with correct aria-label, ChevronLeft icon, and touch-target class
  it('renders back button with correct accessibility', () => {
    render(<MobilePageHeader title="Page" />)
    const backBtn = screen.getByLabelText('Retour')
    expect(backBtn).toBeInTheDocument()
    expect(backBtn.tagName).toBe('BUTTON')
    expect(backBtn.classList.contains('touch-target')).toBe(true)
    expect(backBtn.classList.contains('rounded-xl')).toBe(true)

    // ChevronLeft icon inside button
    expect(screen.getByText('back')).toBeInTheDocument()
    expect(screen.getByText('back').closest('button')).toBe(backBtn)
  })

  // STRICT: verifies custom onBack callback is called when back button is clicked, and default navigate(-1) is NOT called
  it('calls custom onBack when provided', async () => {
    const onBack = vi.fn()
    const routerMod = await import('react-router') as any
    routerMod.__mockNavigate.mockClear()

    render(<MobilePageHeader title="Page" onBack={onBack} />)
    fireEvent.click(screen.getByLabelText('Retour'))

    expect(onBack).toHaveBeenCalledOnce()
    expect(routerMod.__mockNavigate).not.toHaveBeenCalled()
  })

  // STRICT: verifies navigate(-1) is called when no onBack prop, and custom onBack is not involved
  it('navigates back via router when no onBack prop', async () => {
    const routerMod = await import('react-router') as any
    routerMod.__mockNavigate.mockClear()

    render(<MobilePageHeader title="Page" />)
    fireEvent.click(screen.getByLabelText('Retour'))

    expect(routerMod.__mockNavigate).toHaveBeenCalledWith(-1)
    expect(routerMod.__mockNavigate).toHaveBeenCalledOnce()
  })
})
