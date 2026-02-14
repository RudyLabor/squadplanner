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
  it('renders without crash', () => {
    render(<MobilePageHeader title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders back button', () => {
    render(<MobilePageHeader title="Page" />)
    expect(screen.getByLabelText('Retour')).toBeInTheDocument()
  })

  it('calls onBack when provided', () => {
    const onBack = vi.fn()
    render(<MobilePageHeader title="Page" onBack={onBack} />)
    fireEvent.click(screen.getByLabelText('Retour'))
    expect(onBack).toHaveBeenCalledOnce()
  })

  it('navigates back when no onBack', async () => {
    const routerMod = await import('react-router') as any
    render(<MobilePageHeader title="Page" />)
    fireEvent.click(screen.getByLabelText('Retour'))
    expect(routerMod.__mockNavigate).toHaveBeenCalledWith(-1)
  })
})
