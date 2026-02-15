
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
        console.log('Audio permission not granted')
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
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Paramètres">
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
                  { value: 'fr' as const, label: 'Français' },
                  { value: 'en' as const, label: 'English' },
                ]}
                value={locale}
                onChange={(v: 'fr' | 'en') => {
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

export default Settings
