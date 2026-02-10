import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Volume2, Palette, Shield, Globe, Languages, Database,
  ChevronRight, Moon, Sun, Monitor, Mic, Speaker, Trash2, Download, LogOut,
  ArrowLeft, Loader2, AlertTriangle, FileText, ExternalLink
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Card, SegmentedControl, Select } from '../components/ui'
import { useAuthStore } from '../hooks'
import { useThemeStore, type ThemeMode } from '../hooks/useTheme'
import { useHashNavigation } from '../hooks/useHashNavigation'
import { supabase } from '../lib/supabase'
import { showSuccess, showError } from '../lib/toast'

// Types
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

// Toggle Switch Component
function Toggle({ enabled, onChange, disabled = false }: {
  enabled: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? 'bg-success' : 'bg-border-hover'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-bg-base rounded-full shadow-sm"
        animate={{ left: enabled ? 24 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

// Section Header
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary-10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <h2 className="text-md font-semibold text-text-primary">{title}</h2>
    </div>
  )
}

// Setting Row
function SettingRow({ label, description, children }: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border-default last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-md text-text-primary">{label}</p>
        {description && <p className="text-sm text-text-quaternary mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// Theme Selector Component - Uses SegmentedControl
function ThemeSelector({ onSaved }: { onSaved?: () => void }) {
  const { mode, setMode } = useThemeStore()

  const themeOptions: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'system', label: 'Auto', icon: Monitor },
  ]

  return (
    <SegmentedControl
      options={themeOptions}
      value={mode}
      onChange={(v: ThemeMode) => { setMode(v); onSaved?.() }}
      size="sm"
      layoutId="theme-selector"
    />
  )
}

// Timezone options
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

  // Notification settings
  const [notifications, setNotifications] = useState<NotificationSettings>({
    sessions: true,
    messages: true,
    party: true,
    reminders: true,
  })

  // Audio settings
  const [audioInput, setAudioInput] = useState<string>('default')
  const [audioOutput, setAudioOutput] = useState<string>('default')
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])

  // Privacy settings
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    profileVisibility: 'friends',
    showOnlineStatus: true,
  })

  // Other settings
  const [timezone, setTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  )
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')

  // Debounced "Paramètres sauvegardés" toast
  const hasMounted = useRef(false)
  const saveToastTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)
  const showSaveToast = useCallback(() => {
    if (!hasMounted.current) return
    clearTimeout(saveToastTimeout.current)
    saveToastTimeout.current = setTimeout(() => showSuccess('Paramètres sauvegardés'), 400)
  }, [])
  useEffect(() => { hasMounted.current = true }, [])

  // Fetch audio devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // Request permission first
        await navigator.mediaDevices.getUserMedia({ audio: true })
        const devices = await navigator.mediaDevices.enumerateDevices()
        setAudioDevices(devices.filter(d => d.kind === 'audioinput' || d.kind === 'audiooutput'))
      } catch (error) {
        console.log('Audio permission not granted')
      }
    }
    getDevices()
  }, [])

  const inputDevices = audioDevices.filter(d => d.kind === 'audioinput')
  const outputDevices = audioDevices.filter(d => d.kind === 'audiooutput')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return

    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      // Delete user data in order (respecting foreign keys)
      const userId = user.id
      await supabase.from('session_checkins').delete().eq('user_id', userId)
      await supabase.from('session_rsvps').delete().eq('user_id', userId)
      await supabase.from('messages').delete().eq('user_id', userId)
      await supabase.from('direct_messages').delete().eq('sender_id', userId)
      await supabase.from('party_participants').delete().eq('user_id', userId)
      await supabase.from('push_subscriptions').delete().eq('user_id', userId)
      await supabase.from('squad_members').delete().eq('user_id', userId)
      await supabase.from('ai_insights').delete().eq('user_id', userId)
      await supabase.from('profiles').delete().eq('id', userId)

      // Sign out and redirect
      await supabase.auth.signOut()
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
    } catch (err) {
      showError('Erreur lors de la suppression. Contacte le support.')
      setIsDeleting(false)
    }
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')

      const userId = user.id

      // Fetch all user data
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

      // Download as JSON file
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
    } catch (err) {
      showError('Erreur lors de l\'export des données')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Paramètres">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-surface-card flex items-center justify-center hover:bg-border-hover transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5 text-text-tertiary" aria-hidden="true" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Paramètres</h1>
            <p className="text-md text-text-tertiary">Personnalise ton expérience</p>
          </div>
        </header>

        {/* Notifications Section */}
        <Card id="notifications" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Bell} title="Notifications" />
          <div className="space-y-1">
            <SettingRow
              label="Sessions"
              description="Rappels et confirmations de sessions"
            >
              <Toggle
                enabled={notifications.sessions}
                onChange={(v) => { setNotifications({ ...notifications, sessions: v }); showSaveToast() }}
              />
            </SettingRow>
            <SettingRow
              label="Messages"
              description="Nouveaux messages de ta squad"
            >
              <Toggle
                enabled={notifications.messages}
                onChange={(v) => { setNotifications({ ...notifications, messages: v }); showSaveToast() }}
              />
            </SettingRow>
            <SettingRow
              label="Party vocale"
              description="Quand quelqu'un rejoint la party"
            >
              <Toggle
                enabled={notifications.party}
                onChange={(v) => { setNotifications({ ...notifications, party: v }); showSaveToast() }}
              />
            </SettingRow>
            <SettingRow
              label="Rappels automatiques"
              description="30 min avant chaque session"
            >
              <Toggle
                enabled={notifications.reminders}
                onChange={(v) => { setNotifications({ ...notifications, reminders: v }); showSaveToast() }}
              />
            </SettingRow>
          </div>
        </Card>

        {/* Audio Section */}
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
                onChange={(v) => { setAudioInput(v as string); showSaveToast() }}
                options={[
                  { value: 'default', label: 'Microphone par défaut' },
                  ...inputDevices.map(device => ({
                    value: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
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
                onChange={(v) => { setAudioOutput(v as string); showSaveToast() }}
                options={[
                  { value: 'default', label: 'Haut-parleur par défaut' },
                  ...outputDevices.map(device => ({
                    value: device.deviceId,
                    label: device.label || `Sortie ${device.deviceId.slice(0, 8)}`,
                  })),
                ]}
                placeholder="Haut-parleur par défaut"
              />
            </div>
          </div>
        </Card>

        {/* Appearance Section */}
        <Card id="theme" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Palette} title="Apparence" />
          <SettingRow
            label="Thème"
            description="Adapte l'apparence de l'app"
          >
            <ThemeSelector onSaved={showSaveToast} />
          </SettingRow>
        </Card>

        {/* Privacy Section */}
        <Card id="privacy" className="mb-5 p-5 bg-bg-elevated scroll-mt-6">
          <SectionHeader icon={Shield} title="Confidentialité" />
          <div className="space-y-1">
            <SettingRow
              label="Visibilité du profil"
              description="Qui peut voir tes stats"
            >
              <Select
                value={privacy.profileVisibility}
                onChange={(v) => { setPrivacy({ ...privacy, profileVisibility: v as 'public' | 'friends' | 'private' }); showSaveToast() }}
                options={[
                  { value: 'public', label: 'Tout le monde' },
                  { value: 'friends', label: 'Membres de mes squads' },
                  { value: 'private', label: 'Personne' },
                ]}
                size="sm"
              />
            </SettingRow>
            <SettingRow
              label="Statut en ligne"
              description="Montre quand tu es connecté"
            >
              <Toggle
                enabled={privacy.showOnlineStatus}
                onChange={(v) => { setPrivacy({ ...privacy, showOnlineStatus: v }); showSaveToast() }}
              />
            </SettingRow>
          </div>
        </Card>

        {/* Timezone & Language Section */}
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
                onChange={(v) => { setTimezone(v as string); showSaveToast() }}
                options={TIMEZONES.map(tz => ({
                  value: tz.value,
                  label: tz.label,
                }))}
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
                value={language}
                onChange={(v: 'fr' | 'en') => { setLanguage(v); showSaveToast() }}
                layoutId="language-selector"
              />
            </div>
          </div>
        </Card>

        {/* Data Section */}
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
                  <p className="text-md text-text-primary">{isExporting ? 'Export en cours...' : 'Exporter mes données'}</p>
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
                  <p className="text-sm text-error/60">Action irréversible</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-error/50" />
            </button>
          </div>
        </Card>

        {/* Legal Section */}
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

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 text-md text-error hover:text-error-hover transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>

        {/* Version */}
        <p className="text-center text-sm text-text-quaternary mt-6">
          Squad Planner v1.0.0
        </p>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-overlay backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-bg-elevated rounded-2xl border border-error/10 p-6 shadow-modal"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-error-10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-error" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">Supprimer ton compte</h3>
              </div>

              <p className="text-md text-text-tertiary mb-4">
                Cette action est <span className="text-error font-semibold">définitive et irréversible</span>.
                Toutes tes données seront supprimées : profil, messages, squads, statistiques.
              </p>

              <p className="text-base text-text-tertiary mb-3">
                Tape <span className="font-mono text-error font-bold">SUPPRIMER</span> pour confirmer :
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                disabled={isDeleting}
                className="w-full h-11 px-4 rounded-xl bg-surface-card border border-error/15 text-md text-text-primary placeholder:text-text-quaternary focus:outline-none focus:border-error mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl bg-surface-card text-md text-text-tertiary hover:bg-border-hover transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                  className="flex-1 h-11 rounded-xl bg-error text-white text-md font-semibold hover:bg-error-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    'Supprimer définitivement'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

export default Settings
