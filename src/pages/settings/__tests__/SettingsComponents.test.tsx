import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
  m: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
  motion: new Proxy(
    {},
    {
      get: (_t: any, p: string) =>
        typeof p === 'string'
          ? ({ children, ...r }: any) => createElement(p, r, children)
          : undefined,
    }
  ),
}))

vi.mock(
  '../../../components/icons',
  () =>
    new Proxy(
      {},
      {
        get: (_t: any, p: string) =>
          typeof p === 'string'
            ? ({ children, ...props }: any) => createElement('span', props, children)
            : undefined,
      }
    )
)

vi.mock('../../../components/ui', () => ({
  SegmentedControl: ({ options, value, onChange }: any) =>
    createElement(
      'div',
      { 'data-testid': 'segmented' },
      options?.map((o: any) =>
        createElement('button', { key: o.value, onClick: () => onChange(o.value) }, o.label)
      )
    ),
}))

vi.mock('../../../hooks/useTheme', () => ({
  useThemeStore: vi.fn().mockReturnValue({ mode: 'dark', setMode: vi.fn() }),
}))

import { Toggle, SectionHeader, SettingRow, ThemeSelector } from '../SettingsComponents'

describe('Toggle', () => {
  it('renders without crashing', () => {
    const { container } = render(<Toggle enabled={false} onChange={vi.fn()} />)
    expect(container).toBeTruthy()
  })

  it('calls onChange when clicked', () => {
    const onChange = vi.fn()
    render(<Toggle enabled={false} onChange={onChange} />)
    fireEvent.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('shows correct aria-checked', () => {
    render(<Toggle enabled={true} onChange={vi.fn()} />)
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
  })
})

describe('SectionHeader', () => {
  it('renders title', () => {
    const MockIcon = (props: any) => createElement('span', props)
    render(<SectionHeader icon={MockIcon} title="General" />)
    expect(screen.getByText('General')).toBeTruthy()
  })
})

describe('SettingRow', () => {
  it('renders label and children', () => {
    render(
      <SettingRow label="Dark mode">
        <span>toggle</span>
      </SettingRow>
    )
    expect(screen.getByText('Dark mode')).toBeTruthy()
    expect(screen.getByText('toggle')).toBeTruthy()
  })

  it('renders description when provided', () => {
    render(
      <SettingRow label="Test" description="A description">
        <span>child</span>
      </SettingRow>
    )
    expect(screen.getByText('A description')).toBeTruthy()
  })
})

describe('ThemeSelector', () => {
  it('renders without crashing', () => {
    const { container } = render(<ThemeSelector />)
    expect(container).toBeTruthy()
  })
})
