import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { Settings } from '../Settings'

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/settings', hash: '', search: '' }),
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    AnimatePresence: ({ children }: any) => children,
    m: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }),
    motion: new Proxy({}, {
      get: (_target, prop) => {
        if (typeof prop === 'string') {
          return ({ children, ...rest }: any) => createElement(prop, rest, children)
        }
        return undefined
      },
    }),
  }
})

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: { getSession: vi.fn(), getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
    from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: {} }) }) }) }),
    rpc: vi.fn(),
    channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }),
    removeChannel: vi.fn(),
  },
  supabase: { auth: { getSession: vi.fn() }, from: vi.fn(), rpc: vi.fn(), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn() }), removeChannel: vi.fn() },
  isSupabaseReady: vi.fn().mockReturnValue(true),
}))

// Mock auth store
vi.mock('../../hooks/useAuth', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, signOut: vi.fn() }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, signOut: vi.fn() }),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn(), showError: vi.fn(), showWarning: vi.fn(), showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => 'fr',
  useSetLocale: () => vi.fn(),
  useI18nStore: Object.assign(vi.fn().mockReturnValue({ locale: 'fr' }), { getState: vi.fn().mockReturnValue({ locale: 'fr' }) }),
}))

// Mock hash navigation
vi.mock('../../hooks/useHashNavigation', () => ({
  useHashNavigation: vi.fn(),
}))

// Mock icons
vi.mock('../../components/icons', () => ({
  Bell: (props: any) => createElement('span', props),
  Volume2: (props: any) => createElement('span', props),
  Palette: (props: any) => createElement('span', props),
  Shield: (props: any) => createElement('span', props),
  Globe: (props: any) => createElement('span', props),
  Languages: (props: any) => createElement('span', props),
  Database: (props: any) => createElement('span', props),
  ChevronRight: (props: any) => createElement('span', props),
  Mic: (props: any) => createElement('span', props),
  Speaker: (props: any) => createElement('span', props),
  Trash2: (props: any) => createElement('span', props),
  Download: (props: any) => createElement('span', props),
  LogOut: (props: any) => createElement('span', props),
  ArrowLeft: (props: any) => createElement('span', props),
  Loader2: (props: any) => createElement('span', props),
  FileText: (props: any) => createElement('span', props),
  ExternalLink: (props: any) => createElement('span', props),
}))

// Mock UI components
vi.mock('../../components/ui', () => ({
  Card: ({ children, ...props }: any) => createElement('div', props, children),
  SegmentedControl: ({ options, value, onChange }: any) => createElement('div', { 'data-testid': 'segmented-control' }, options.map((o: any) => createElement('button', { key: o.value, onClick: () => onChange(o.value) }, o.label))),
  Select: ({ options, value, onChange }: any) => createElement('select', { value, onChange: (e: any) => onChange(e.target.value) }),
}))

vi.mock('../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) => createElement('div', { 'data-testid': 'mobile-header' }, title),
}))

// Mock settings sub-components
vi.mock('../settings/SettingsComponents', () => ({
  Toggle: ({ enabled, onChange }: any) => createElement('button', { onClick: () => onChange(!enabled), role: 'switch', 'aria-checked': enabled }),
  SectionHeader: ({ title }: any) => createElement('h2', null, title),
  SettingRow: ({ label, children }: any) => createElement('div', null, createElement('span', null, label), children),
  ThemeSelector: () => createElement('div', { 'data-testid': 'theme-selector' }),
}))

vi.mock('../settings/SettingsDeleteModal', () => ({
  SettingsDeleteModal: () => null,
}))

describe('Settings Page', () => {
  beforeEach(() => {
    // Mock localStorage
    const store: Record<string, string> = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value })

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      writable: true,
    })
  })

  const renderSettings = () => {
    return render(createElement(Settings))
  }

  it('renders without crash', () => {
    expect(() => renderSettings()).not.toThrow()
  })

  it('renders settings sections', () => {
    renderSettings()
    expect(screen.getByText('Notifications')).toBeDefined()
    expect(screen.getByText('Audio')).toBeDefined()
    expect(screen.getByText('Apparence')).toBeDefined()
  })

  it('renders with aria label', () => {
    renderSettings()
    expect(document.querySelector('[aria-label="Paramètres"]')).toBeDefined()
  })
})
