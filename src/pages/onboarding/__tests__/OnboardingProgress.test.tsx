import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

import { OnboardingProgress } from '../OnboardingProgress'

describe('OnboardingProgress', () => {
  it('renders without crashing', () => {
    const { container } = render(<OnboardingProgress step="squad-choice" />)
    expect(container).toBeTruthy()
  })

  it('returns null for splash step', () => {
    const { container } = render(<OnboardingProgress step="splash" />)
    expect(container.innerHTML).toBe('')
  })

  it('returns null for complete step', () => {
    const { container } = render(<OnboardingProgress step="complete" />)
    expect(container.innerHTML).toBe('')
  })

  it('renders progress items for squad-choice', () => {
    render(<OnboardingProgress step="squad-choice" />)
    expect(screen.getByText('Squad')).toBeTruthy()
    expect(screen.getByText('Profil')).toBeTruthy()
    expect(screen.getByText('Permissions')).toBeTruthy()
  })

  it('renders progress items for profile step', () => {
    render(<OnboardingProgress step="profile" />)
    expect(screen.getByText('Profil')).toBeTruthy()
  })

  it('renders progress items for permissions step', () => {
    render(<OnboardingProgress step="permissions" />)
    expect(screen.getByText('Permissions')).toBeTruthy()
  })
})
