
import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Bell,
  Volume2,
  Palette,
  Shield,
  Globe,
  Languages,
  Database,
  ChevronRight,
  Mic,
  Speaker,
  Trash2,
  Download,
  LogOut,
  ArrowLeft,
  Loader2,
  FileText,
  ExternalLink,
  Gift,
  Plug,
} from '../components/icons'
import { useNavigate, Link } from 'react-router'
import { Card, SegmentedControl, Select } from '../components/ui'
import { MobilePageHeader } from '../components/layout/MobilePageHeader'
import { useAuthStore } from '../hooks'
import { useHashNavigation } from '../hooks/useHashNavigation'
import { supabaseMinimal as supabase } from '../lib/supabaseMinimal'
import { showSuccess, showError } from '../lib/toast'
import { Toggle, SectionHeader, SettingRow, ThemeSelector } from './settings/SettingsComponents'
import { SettingsDeleteModal } from './settings/SettingsDeleteModal'
import { useLocale, useSetLocale } from '../lib/i18n'
import { useDiscordLink } from '../hooks/useDiscordLink'

interface NotificationSettings {
  sessions: boolean
  messages: boolean
  party: boolean
  reminders: boolean
}
interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private'
  showOnlineStatus: boolean
}

const TIMEZONES = [
  { value: 'Europe/Paris', label: 'Paris (UTC+1)' },
  { value: 'Europe/London', label: 'Londres (UTC)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
  { value: 'Australia/Sydney', label: 'Sydney (UTC+11)' },
]

export function Settings() {
  const navigate = useNavigate()
  const { signOut } = useAuthStore()
  useHashNavigation()

  // i18n
  const locale = useLocale()
  const setLocale = useSetLocale()

  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('sq-notification-settings')
      return saved
        ? JSON.parse(saved)
        : { sessions: true, messages: true, party: true, reminders: true }
    } catch {
      return { sessions: true, messages: true, party: true, reminders: true }
    }
  })
  const [audioInput, setAudioInput] = useState<string>(
    () => localStorage.getItem('sq-audio-input') || 'default'
  )
  const [audioOutput, setAudioOutput] = useState<string>(
    () => localStorage.getItem('sq-audio-output') || 'default'
  )
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [privacy, setPrivacy] = useState<PrivacySettings>(() => {
    try {
      const saved = localStorage.getItem('sq-privacy-settings')
      return saved ? JSON.parse(saved) : { profileVisibility: 'friends', showOnlineStatus: true }
    } catch {
      return { profileVisibility: 'friends', showOnlineStatus: true }
    }
  })
  const [timezone, setTimezone] = useState<string>(
    () => localStorage.getItem('sq-timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Persist settings to localStorage on change
  useEffect(() => {
    localStorage.setItem('sq-notification-settings', JSON.stringify(notifications))
  }, [notifications])
  useEffect(() => {
    localStorage.setItem('sq-privacy-settings', JSON.stringify(privacy))
  }, [privacy])
  useEffect(() => {
    localStorage.setItem('sq-timezone', timezone)
  }, [timezone])
  useEffect(() => {
    localStorage.setItem('sq-audio-input', audioInput)
  }, [audioInput])
  useEffect(() => {
    localStorage.setItem('sq-audio-output', audioOutput)
  }, [audioOutput])

  const hasMounted = useRef(false)
  const saveToastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showSaveToast = useCallback(() => {
    if (!hasMounted.current) return
    clearTimeout(saveToastTimeout.current)
    saveToastTimeout.current = setTimeout(() => showSuccess('Paramètres sauvegardés'), 400)
  }, [])
  useEffect(() => {
    hasMounted.current = true
  }, [])

  useEffect(() => {
    const getDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        setAudioDevices(devices.filter((d) => d.kind === 'audioinput' || d.kind === 'audiooutput'))
      } catch {
        if (!import.meta.env.PROD) console.log('Audio permission not granted')
      }
    }
    getDevices()
  }, [])

  const inputDevices = audioDevices.filter((d) => d.kind === 'audioinput')
  const outputDevices = audioDevices.filter((d) => d.kind === 'audiooutput')
  const handleSignOut = async () => {
    await signOut()
    // signOut() already redirects via window.location.replace('/')
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const userId = user.id
      const [profile, squads, rsvps, checkins, messages, dms, calls] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('squad_members').select('*, squads(*)').eq('user_id', userId),
        supabase.from('session_rsvps').select('*, sessions(*)').eq('user_id', userId),
        supabase.from('session_checkins').select('*').eq('user_id', userId),
        supabase.from('messages').select('*').eq('user_id', userId),
        supabase.from('direct_messages').select('*').eq('sender_id', userId),
        supabase.from('calls').select('*').or(`caller_id.eq.${userId},callee_id.eq.${userId}`),
      ])
      const exportData = {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        squads: squads.data,
        rsvps: rsvps.data,
        checkins: checkins.data,
        messages: messages.data,
        direct_messages: dms.data,
        calls: calls.data,
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `squad-planner-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showSuccess('Données exportées avec succès !')
    } catch {
      showError("Erreur lors de l'export des données")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6 page-enter" aria-label="Paramètres">
      <MobilePageHeader title="Paramètres" />
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        <header className="hidden lg:flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-hover transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-text-primary">Paramètres</h1>
            <p className="text-md text-text-tertiary">Personnalise ton expérience</p>
          </div>
        </header>

        <Card id="notifications" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Bell} title="Notifications" />
          <div className="space-y-1">
            <SettingRow label="Sessions" description="Rappels et confirmations de sessions">
              <Toggle
                label="Notifications sessions"
                enabled={notifications.sessions}
                onChange={(v) => {
                  setNotifications({ ...notifications, sessions: v })
                  showSaveToast()
                }}
              />
            </SettingRow>
            <SettingRow label="Messages" description="Nouveaux messages de ta squad">
              <Toggle
                label="Notifications messages"
                enabled={notifications.messages}
                onChange={(v) => {
                  setNotifications({ ...notifications, messages: v })
                  showSaveToast()
                }}
              />
            </SettingRow>
            <SettingRow label="Party vocale" description="Quand quelqu'un rejoint la party">
              <Toggle
                label="Notifications party vocale"
                enabled={notifications.party}
                onChange={(v) => {
                  setNotifications({ ...notifications, party: v })
                  showSaveToast()
                }}
              />
            </SettingRow>
            <SettingRow label="Rappels automatiques" description="30 min avant chaque session">
              <Toggle
                label="Rappels automatiques"
                enabled={notifications.reminders}
                onChange={(v) => {
                  setNotifications({ ...notifications, reminders: v })
                  showSaveToast()
                }}
              />
            </SettingRow>
          </div>
        </Card>

        <Card id="audio" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Volume2} title="Audio" />
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
                <Mic className="w-4 h-4" />
                Microphone
              </label>
              <Select
                value={audioInput}
                onChange={(v) => {
                  setAudioInput(v as string)
                  showSaveToast()
                }}
                options={[
                  { value: 'default', label: 'Microphone par défaut' },
                  ...inputDevices.map((d) => ({
                    value: d.deviceId,
                    label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
                  })),
                ]}
                placeholder="Microphone par défaut"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
                <Speaker className="w-4 h-4" />
                Sortie audio
              </label>
              <Select
                value={audioOutput}
                onChange={(v) => {
                  setAudioOutput(v as string)
                  showSaveToast()
                }}
                options={[
                  { value: 'default', label: 'Haut-parleur par défaut' },
                  ...outputDevices.map((d) => ({
                    value: d.deviceId,
                    label: d.label || `Sortie ${d.deviceId.slice(0, 8)}`,
                  })),
                ]}
                placeholder="Haut-parleur par défaut"
              />
            </div>
          </div>
        </Card>

        <Card id="sounds" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Volume2} title="Sons & Vibrations" />
          <div className="space-y-1">
            <SettingRow label="Sons de l'interface" description="Jouer des sons pour les actions (messages, RSVP, etc.)">
              <SoundToggle />
            </SettingRow>
            <SettingRow label="Mode silencieux" description="Pas de sons entre 23h et 8h">
              <QuietHoursToggle />
            </SettingRow>
            <SettingRow label="Vibrations haptiques" description="Retour vibratoire sur les boutons et actions">
              <HapticToggle />
            </SettingRow>
          </div>
        </Card>

        <Card id="theme" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Palette} title="Apparence" />
          <SettingRow label="Thème" description="Adapte l'apparence de l'app">
            <ThemeSelector onSaved={showSaveToast} />
          </SettingRow>
        </Card>

        <Card id="privacy" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Shield} title="Confidentialité" />
          <div className="space-y-1">
            <SettingRow label="Visibilité du profil" description="Qui peut voir tes stats">
              <Select
                value={privacy.profileVisibility}
                onChange={(v) => {
                  setPrivacy({
                    ...privacy,
                    profileVisibility: v as 'public' | 'friends' | 'private',
                  })
                  showSaveToast()
                }}
                options={[
                  { value: 'public', label: 'Tout le monde' },
                  { value: 'friends', label: 'Membres de mes squads' },
                  { value: 'private', label: 'Personne' },
                ]}
                placeholder="Visibilité du profil"
                size="sm"
              />
            </SettingRow>
            <SettingRow label="Statut en ligne" description="Montre quand tu es connecté">
              <Toggle
                label="Statut en ligne"
                enabled={privacy.showOnlineStatus}
                onChange={(v) => {
                  setPrivacy({ ...privacy, showOnlineStatus: v })
                  showSaveToast()
                }}
              />
            </SettingRow>
          </div>
        </Card>

        <Card id="region" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Globe} title="Région" />
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
                <Globe className="w-4 h-4" />
                Fuseau horaire
              </label>
              <Select
                value={timezone}
                onChange={(v) => {
                  setTimezone(v as string)
                  showSaveToast()
                }}
                options={TIMEZONES.map((tz) => ({ value: tz.value, label: tz.label }))}
                searchable
                placeholder="Choisis un fuseau horaire"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-base text-text-tertiary mb-2">
                <Languages className="w-4 h-4" />
                Langue
              </label>
              <SegmentedControl
                options={[
                  { value: 'fr' as const, label: 'FR' },
                  { value: 'en' as const, label: 'EN' },
                  { value: 'es' as const, label: 'ES' },
                  { value: 'de' as const, label: 'DE' },
                ]}
                value={locale}
                onChange={(v: 'fr' | 'en' | 'es' | 'de') => {
                  setLocale(v)
                  showSaveToast()
                }}
                layoutId="language-selector"
              />
            </div>
          </div>
        </Card>

        <Card id="data" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Database} title="Données" />
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isExporting ? (
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-primary" />
                )}
                <div className="text-left">
                  <p className="text-md text-text-primary">
                    {isExporting ? 'Export en cours...' : 'Exporter mes données'}
                  </p>
                  <p className="text-sm text-text-quaternary">Télécharge toutes tes infos (RGPD)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-quaternary" />
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-error-5 hover:bg-error-10 transition-colors border border-error/10"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-error" />
                <div className="text-left">
                  <p className="text-md text-error">Supprimer mon compte</p>
                  <p className="text-sm text-error">Action irréversible</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-error/50" />
            </button>
          </div>
        </Card>

        <Card id="referral" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Gift} title="Parrainage" />
          <div className="space-y-3">
            <Link
              to="/referrals"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-md text-text-primary">Inviter des amis</p>
                  <p className="text-sm text-text-quaternary">Gagne du Premium gratuit en parrainant</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-text-quaternary" />
            </Link>
          </div>
        </Card>

        <DiscordSection />

        <Card id="legal" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={FileText} title="Légal" />
          <div className="space-y-3">
            <Link
              to="/legal"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-md text-text-primary">Conditions d'utilisation</p>
                  <p className="text-sm text-text-quaternary">CGU de Squad Planner</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-text-quaternary" />
            </Link>
            <Link
              to="/legal?tab=privacy"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-md text-text-primary">Politique de confidentialité</p>
                  <p className="text-sm text-text-quaternary">RGPD & protection des données</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-text-quaternary" />
            </Link>
            <Link
              to="/?public=true"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-primary" />
                <div className="text-left">
                  <p className="text-md text-text-primary">Page d'accueil publique</p>
                  <p className="text-sm text-text-quaternary">Voir la landing page</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-text-quaternary" />
            </Link>
          </div>
        </Card>

        <button
          onClick={handleSignOut}
          className="w-full py-4 text-md text-error hover:text-error-hover transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
        <p className="text-center text-sm text-text-quaternary mt-6">Squad Planner v1.0.0</p>
      </div>
      <SettingsDeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} />
    </main>
  )
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  )
}

function DiscordSection() {
  const profile = useAuthStore((s) => s.profile)
  const { linkDiscord, unlinkDiscord, isUnlinking } = useDiscordLink()
  const isConnected = !!profile?.discord_user_id

  return (
    <Card id="connected" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
      <SectionHeader icon={Plug} title="Comptes connectés" />
      <div className="space-y-3">
        {isConnected ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5865F2' }}>
                <DiscordIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-md text-text-primary">{profile?.discord_username}</p>
                <p className="text-sm text-text-quaternary">Discord connecté</p>
              </div>
            </div>
            <button
              onClick={unlinkDiscord}
              disabled={isUnlinking}
              className="px-3 py-1.5 text-sm text-error hover:text-error-hover transition-colors rounded-lg hover:bg-error-5 disabled:opacity-50"
            >
              {isUnlinking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Déconnecter'
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={linkDiscord}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-card hover:bg-surface-card-hover transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#5865F2' }}>
                <DiscordIcon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-md text-text-primary">Connecter Discord</p>
                <p className="text-sm text-text-quaternary">Lie ton compte pour utiliser le bot</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-text-quaternary" />
          </button>
        )}
      </div>
    </Card>
  )
}

// Sound toggle — syncs with useSoundStore
function SoundToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('squadplanner-sounds') || '{}')
      return stored?.state?.enabled !== false
    } catch { return true }
  })

  const handleToggle = useCallback((v: boolean) => {
    setEnabled(v)
    import('../hooks/useSound').then(({ useSoundStore }) => {
      useSoundStore.getState().setEnabled(v)
    })
  }, [])

  return <Toggle enabled={enabled} onChange={handleToggle} />
}

// Haptic toggle — syncs with haptic utils
function HapticToggle() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem('hapticEnabled') !== 'false' }
    catch { return true }
  })

  const handleToggle = useCallback((v: boolean) => {
    setEnabled(v)
    localStorage.setItem('hapticEnabled', String(v))
  }, [])

  return <Toggle enabled={enabled} onChange={handleToggle} />
}

// Quiet hours toggle — syncs with useQuietHoursStore
function QuietHoursToggle() {
  const [enabled, setEnabled] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('squadplanner-quiet-hours') || '{}')
      return stored?.state?.enabled !== false
    } catch { return true }
  })

  const handleToggle = useCallback((v: boolean) => {
    setEnabled(v)
    import('../lib/quietHours').then(({ useQuietHoursStore }) => {
      useQuietHoursStore.getState().setEnabled(v)
    })
  }, [])

  return <Toggle enabled={enabled} onChange={handleToggle} />
}

export default Settings
