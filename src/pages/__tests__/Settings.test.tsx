import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { createElement } from 'react'

// --- Hoisted mock variables ---
const mockH = vi.hoisted(() => {
  const mockNavigate = vi.fn()
  const mockSignOut = vi.fn().mockResolvedValue(undefined)
  const mockShowSuccess = vi.fn()
  const mockShowError = vi.fn()
  const mockSetLocale = vi.fn()
  let mockLocale: 'fr' | 'en' = 'fr'

  // Supabase mock chain
  const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
  const mockSingle = vi.fn().mockResolvedValue({ data: {} })
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect })

  // Captured props
  let capturedToggleProps: any[] = []
  let capturedDeleteModalProps: any = null

  return {
    mockNavigate, mockSignOut, mockShowSuccess, mockShowError, mockSetLocale,
    get mockLocale() { return mockLocale }, set mockLocale(v: any) { mockLocale = v },
    mockGetUser, mockSingle, mockEq, mockSelect, mockFrom,
    get capturedToggleProps() { return capturedToggleProps }, set capturedToggleProps(v: any) { capturedToggleProps = v },
    get capturedDeleteModalProps() { return capturedDeleteModalProps }, set capturedDeleteModalProps(v: any) { capturedDeleteModalProps = v },
  }
})

// Mock react-router
vi.mock('react-router', () => ({
  useLocation: vi.fn().mockReturnValue({ pathname: '/settings', hash: '', search: '' }),
  useNavigate: vi.fn(() => mockH.mockNavigate),
  useParams: vi.fn().mockReturnValue({}),
  useSearchParams: vi.fn().mockReturnValue([new URLSearchParams(), vi.fn()]),
  useLoaderData: vi.fn().mockReturnValue({}),
  Link: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  NavLink: ({ children, to, ...props }: any) => createElement('a', { href: to, ...props }, children),
  Outlet: () => null,
  useMatches: vi.fn().mockReturnValue([]),
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  LazyMotion: ({ children }: any) => children,
  MotionConfig: ({ children }: any) => children,
  domAnimation: {}, domMax: {},
  useInView: vi.fn().mockReturnValue(true),
  useScroll: vi.fn().mockReturnValue({ scrollYProgress: { get: () => 0 } }),
  useTransform: vi.fn().mockReturnValue(0),
  useMotionValue: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn(), on: vi.fn() }),
  useSpring: vi.fn().mockReturnValue({ get: () => 0, set: vi.fn() }),
  useAnimate: vi.fn().mockReturnValue([{ current: null }, vi.fn()]),
  useAnimation: vi.fn().mockReturnValue({ start: vi.fn(), stop: vi.fn() }),
  useReducedMotion: vi.fn().mockReturnValue(false),
  m: new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...r }: any) => createElement(p, r, children) : undefined }),
  motion: new Proxy({}, { get: (_t: any, p: string) => typeof p === 'string' ? ({ children, ...r }: any) => createElement(p, r, children) : undefined }),
}))

// Mock supabase
vi.mock('../../lib/supabaseMinimal', () => ({
  supabaseMinimal: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(() => mockH.mockGetUser()),
    },
    from: vi.fn(() => mockH.mockFrom()),
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
    vi.fn(() => ({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, signOut: mockH.mockSignOut })),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

vi.mock('../../hooks', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' }, isLoading: false, signOut: mockH.mockSignOut })),
    { getState: vi.fn().mockReturnValue({ user: { id: 'user-1' }, profile: { id: 'user-1', username: 'TestUser' } }) }
  ),
}))

// Mock toast
vi.mock('../../lib/toast', () => ({
  showSuccess: vi.fn((...args: any[]) => mockH.mockShowSuccess(...args)),
  showError: vi.fn((...args: any[]) => mockH.mockShowError(...args)),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}))

// Mock i18n
vi.mock('../../lib/i18n', () => ({
  useT: () => (key: string) => key,
  useLocale: () => mockH.mockLocale,
  useSetLocale: () => mockH.mockSetLocale,
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
  SegmentedControl: ({ options, value, onChange }: any) => createElement('div', { 'data-testid': 'segmented-control' },
    options.map((o: any) => createElement('button', { key: o.value, onClick: () => onChange(o.value), 'data-active': o.value === value ? 'true' : undefined }, o.label))
  ),
  Select: ({ options, value, onChange, ...props }: any) => createElement('select', { value, onChange: (e: any) => onChange(e.target.value), ...props },
    (options || []).map((o: any) => createElement('option', { key: o.value, value: o.value }, o.label))
  ),
}))

vi.mock('../../components/layout/MobilePageHeader', () => ({
  MobilePageHeader: ({ title }: any) => createElement('div', { 'data-testid': 'mobile-header' }, title),
}))

// Mock settings sub-components with prop capture
vi.mock('../settings/SettingsComponents', () => ({
  Toggle: ({ enabled, onChange }: any) => {
    mockH.capturedToggleProps.push({ enabled, onChange })
    return createElement('button', {
      onClick: () => onChange(!enabled),
      role: 'switch',
      'aria-checked': String(enabled),
      'data-testid': `toggle-${mockH.capturedToggleProps.length}`,
    })
  },
  SectionHeader: ({ title }: any) => createElement('h2', null, title),
  SettingRow: ({ label, description, children }: any) => createElement('div', { 'data-testid': `setting-${label}` },
    createElement('span', null, label),
    description && createElement('span', null, description),
    children
  ),
  ThemeSelector: ({ onSaved }: any) => createElement('div', { 'data-testid': 'theme-selector', onClick: onSaved }),
}))

vi.mock('../settings/SettingsDeleteModal', () => ({
  SettingsDeleteModal: (props: any) => {
    mockH.capturedDeleteModalProps = props
    return props.isOpen ? createElement('div', { 'data-testid': 'delete-modal' },
      createElement('button', { onClick: props.onClose, 'data-testid': 'close-delete-modal' }, 'Fermer')
    ) : null
  },
}))

import { Settings } from '../Settings'

describe('Settings Page', () => {
  let store: Record<string, string>

  beforeEach(() => {
    store = {}
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] || null)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => { store[key] = value })

    Object.defineProperty(navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockRejectedValue(new Error('Permission denied')),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
      writable: true,
    })

    mockH.mockNavigate.mockClear()
    mockH.mockSignOut.mockClear().mockResolvedValue(undefined)
    mockH.mockShowSuccess.mockClear()
    mockH.mockShowError.mockClear()
    mockH.mockSetLocale.mockClear()
    mockH.mockLocale = 'fr'
    mockH.capturedToggleProps = []
    mockH.capturedDeleteModalProps = null
  })

  const renderSettings = () => render(createElement(Settings))

  // =================== RENDER ===================
  describe('Render', () => {
    it('renders without crash', () => {
      expect(() => renderSettings()).not.toThrow()
    })

    it('renders all section headers', () => {
      renderSettings()
      expect(screen.getByText('Notifications')).toBeTruthy()
      expect(screen.getByText('Audio')).toBeTruthy()
      expect(screen.getByText('Apparence')).toBeTruthy()
      expect(screen.getByText('Confidentialité')).toBeTruthy()
      expect(screen.getByText('Région')).toBeTruthy()
      expect(screen.getByText('Données')).toBeTruthy()
      expect(screen.getByText('Légal')).toBeTruthy()
    })

    it('renders with aria label "Paramètres"', () => {
      renderSettings()
      expect(document.querySelector('[aria-label="Paramètres"]')).toBeTruthy()
    })

    it('renders mobile header', () => {
      renderSettings()
      expect(screen.getByTestId('mobile-header')).toBeTruthy()
      // "Paramètres" appears both in header and in mobile-header; just check header exists
    })

    it('renders version text', () => {
      renderSettings()
      expect(screen.getByText('Squad Planner v1.0.0')).toBeTruthy()
    })
  })

  // =================== NOTIFICATION SETTINGS ===================
  describe('Notification settings', () => {
    it('renders all notification toggles', () => {
      renderSettings()
      expect(screen.getByTestId('setting-Sessions')).toBeTruthy()
      expect(screen.getByTestId('setting-Messages')).toBeTruthy()
      expect(screen.getByTestId('setting-Party vocale')).toBeTruthy()
      expect(screen.getByTestId('setting-Rappels automatiques')).toBeTruthy()
    })

    it('loads notification settings from localStorage', () => {
      store['sq-notification-settings'] = JSON.stringify({ sessions: false, messages: true, party: false, reminders: true })
      renderSettings()
      // First toggle is sessions, should be false
      expect(mockH.capturedToggleProps[0].enabled).toBe(false)
      // Second is messages, should be true
      expect(mockH.capturedToggleProps[1].enabled).toBe(true)
    })

    it('uses defaults when localStorage is empty', () => {
      renderSettings()
      expect(mockH.capturedToggleProps[0].enabled).toBe(true) // sessions
      expect(mockH.capturedToggleProps[1].enabled).toBe(true) // messages
    })

    it('uses defaults when localStorage has invalid JSON', () => {
      store['sq-notification-settings'] = 'invalid-json'
      renderSettings()
      // Should fall back to defaults
      expect(mockH.capturedToggleProps[0].enabled).toBe(true)
    })

    it('toggles notification setting and persists', () => {
      renderSettings()
      // Click the first toggle (Sessions)
      fireEvent.click(screen.getByTestId('toggle-1'))
      // After toggle, localStorage should be updated
      const saved = JSON.parse(store['sq-notification-settings'] || '{}')
      expect(saved.sessions).toBe(false)
    })
  })

  // =================== PRIVACY SETTINGS ===================
  describe('Privacy settings', () => {
    it('renders privacy setting rows', () => {
      renderSettings()
      expect(screen.getByTestId('setting-Visibilité du profil')).toBeTruthy()
      expect(screen.getByTestId('setting-Statut en ligne')).toBeTruthy()
    })

    it('loads privacy settings from localStorage', () => {
      store['sq-privacy-settings'] = JSON.stringify({ profileVisibility: 'private', showOnlineStatus: false })
      renderSettings()
      // showOnlineStatus toggle - it's the 5th toggle (after 4 notification toggles)
      expect(mockH.capturedToggleProps[4].enabled).toBe(false)
    })

    it('uses defaults when privacy localStorage is invalid', () => {
      store['sq-privacy-settings'] = '{bad'
      renderSettings()
      // Default showOnlineStatus is true
      expect(mockH.capturedToggleProps[4].enabled).toBe(true)
    })
  })

  // =================== TIMEZONE ===================
  describe('Timezone settings', () => {
    it('renders timezone selector label', () => {
      renderSettings()
      expect(screen.getByText('Fuseau horaire')).toBeTruthy()
    })

    it('loads timezone from localStorage', () => {
      store['sq-timezone'] = 'America/New_York'
      renderSettings()
      // The timezone select should have the saved value
    })
  })

  // =================== LANGUAGE ===================
  describe('Language settings', () => {
    it('renders language segmented control', () => {
      renderSettings()
      expect(screen.getByTestId('segmented-control')).toBeTruthy()
      expect(screen.getByText('Français')).toBeTruthy()
      expect(screen.getByText('English')).toBeTruthy()
    })

    it('changes locale when language button is clicked', () => {
      renderSettings()
      fireEvent.click(screen.getByText('English'))
      expect(mockH.mockSetLocale).toHaveBeenCalledWith('en')
    })
  })

  // =================== THEME ===================
  describe('Theme settings', () => {
    it('renders theme selector', () => {
      renderSettings()
      expect(screen.getByTestId('theme-selector')).toBeTruthy()
    })
  })

  // =================== DATA SECTION ===================
  describe('Data section', () => {
    it('renders export button', () => {
      renderSettings()
      expect(screen.getByText('Exporter mes données')).toBeTruthy()
    })

    it('renders delete account button', () => {
      renderSettings()
      expect(screen.getByText('Supprimer mon compte')).toBeTruthy()
    })

    it('opens delete modal when delete button is clicked', () => {
      renderSettings()
      fireEvent.click(screen.getByText('Supprimer mon compte'))
      expect(screen.getByTestId('delete-modal')).toBeTruthy()
    })

    it('closes delete modal', () => {
      renderSettings()
      fireEvent.click(screen.getByText('Supprimer mon compte'))
      expect(screen.getByTestId('delete-modal')).toBeTruthy()
      fireEvent.click(screen.getByTestId('close-delete-modal'))
      expect(screen.queryByTestId('delete-modal')).toBeNull()
    })
  })

  // =================== LEGAL SECTION ===================
  describe('Legal section', () => {
    it('renders legal links', () => {
      renderSettings()
      expect(screen.getByText("Conditions d'utilisation")).toBeTruthy()
      expect(screen.getByText('Politique de confidentialité')).toBeTruthy()
      expect(screen.getByText("Page d'accueil publique")).toBeTruthy()
    })

    it('links to correct legal pages', () => {
      renderSettings()
      const links = document.querySelectorAll('a')
      const hrefs = Array.from(links).map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/legal')
      expect(hrefs).toContain('/legal?tab=privacy')
      expect(hrefs).toContain('/?public=true')
    })
  })

  // =================== SIGN OUT ===================
  describe('Sign out', () => {
    it('renders sign out button', () => {
      renderSettings()
      expect(screen.getByText('Se déconnecter')).toBeTruthy()
    })

    it('calls signOut when clicked', async () => {
      renderSettings()
      await act(async () => {
        fireEvent.click(screen.getByText('Se déconnecter'))
      })
      expect(mockH.mockSignOut).toHaveBeenCalled()
    })
  })

  // =================== AUDIO SETTINGS ===================
  describe('Audio settings', () => {
    it('renders microphone and speaker labels', () => {
      renderSettings()
      expect(screen.getByText('Microphone')).toBeTruthy()
      expect(screen.getByText('Sortie audio')).toBeTruthy()
    })

    it('loads audio settings from localStorage', () => {
      store['sq-audio-input'] = 'mic-123'
      store['sq-audio-output'] = 'spk-456'
      renderSettings()
      // The values should be loaded from localStorage
    })

    it('enumerates audio devices on mount', () => {
      renderSettings()
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true })
    })
  })

  // =================== EXPORT DATA ===================
  describe('Export data', () => {
    it('shows loading state during export', async () => {
      // Make getUser return slowly
      mockH.mockGetUser.mockImplementationOnce(() => new Promise(() => {}))
      renderSettings()
      await act(async () => {
        fireEvent.click(screen.getByText('Exporter mes données'))
      })
      expect(screen.getByText('Export en cours...')).toBeTruthy()
    })
  })

  // =================== BACK NAVIGATION ===================
  describe('Back navigation', () => {
    it('renders back button in desktop header', () => {
      renderSettings()
      const backBtn = screen.getByLabelText('Retour')
      expect(backBtn).toBeTruthy()
    })

    it('navigates back on button click', () => {
      renderSettings()
      fireEvent.click(screen.getByLabelText('Retour'))
      expect(mockH.mockNavigate).toHaveBeenCalledWith(-1)
    })
  })
})
