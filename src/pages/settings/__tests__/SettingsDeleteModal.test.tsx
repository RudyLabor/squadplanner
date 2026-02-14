import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {},
  domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
  motion: new Proxy({}, {
    get: (_t: any, p: string) =>
      typeof p === 'string'
        ? ({ children, ...r }: any) => createElement(p, r, children)
        : undefined,
  }),
}))

vi.mock('../../../components/icons', () => new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...props }: any) => createElement('span', props, children) : undefined }))

vi.mock('../../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }), signOut: vi.fn() },
    from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({}) }) }),
  },
}))

vi.mock('../../../lib/toast', () => ({
  showError: vi.fn(),
}))

import { SettingsDeleteModal } from '../SettingsDeleteModal'

describe('SettingsDeleteModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(<SettingsDeleteModal isOpen={false} onClose={vi.fn()} />)
    expect(container.querySelector('h3')).toBeNull()
  })

  it('renders modal when open', () => {
    render(<SettingsDeleteModal isOpen={true} onClose={vi.fn()} />)
    expect(screen.getByText('Supprimer ton compte')).toBeTruthy()
  })

  it('has disabled delete button by default', () => {
    render(<SettingsDeleteModal isOpen={true} onClose={vi.fn()} />)
    const deleteBtn = screen.getByText('Supprimer définitivement')
    expect(deleteBtn.closest('button')?.disabled).toBe(true)
  })
})
