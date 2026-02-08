import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Volume2, Palette, Shield, Globe, Languages, Database,
  ChevronRight, Moon, Sun, Monitor, Mic, Speaker, Trash2, Download, LogOut,
  ArrowLeft, Loader2, AlertTriangle, FileText, ExternalLink
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Card } from '../components/ui'
import { useAuthStore } from '../hooks'
import { useThemeStore, type ThemeMode } from '../hooks/useTheme'
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
        enabled ? 'bg-[#34d399]' : 'bg-[rgba(255,255,255,0.1)]'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
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
      <div className="w-8 h-8 rounded-lg bg-[rgba(99,102,241,0.08)] flex items-center justify-center">
        <Icon className="w-4 h-4 text-[#6366f1]" />
      </div>
      <h2 className="text-[15px] font-semibold text-[#f7f8f8]">{title}</h2>
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
    <div className="flex items-center justify-between py-3 border-b border-[rgba(255,255,255,0.05)] last:border-0">
      <div className="flex-1 mr-4">
        <p className="text-[14px] text-[#f7f8f8]">{label}</p>
        {description && <p className="text-[12px] text-[#5e6063] mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

// Theme Selector Component
function ThemeSelector() {
  const { mode, setMode } = useThemeStore()

  const themes: { value: ThemeMode; label: string; icon: React.ElementType }[] = [
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'system', label: 'Auto', icon: Monitor },
  ]

  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[rgba(255,255,255,0.05)]">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => setMode(value)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium transition-interactive ${
            mode === value
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)]'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
          {label}
        </button>
      ))}
    </div>
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
    <div className="min-h-0 bg-[#050506] pb-6">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-[rgba(255,255,255,0.05)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#8b8d90]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#f7f8f8]">Paramètres</h1>
            <p className="text-[14px] text-[#8b8d90]">Personnalise ton expérience</p>
          </div>
        </div>

        {/* Notifications Section */}
        <Card className="mb-5 p-5 bg-[#101012]">
          <SectionHeader icon={Bell} title="Notifications" />
          <div className="space-y-1">
            <SettingRow
              label="Sessions"
              description="Rappels et confirmations de sessions"
            >
              <Toggle
                enabled={notifications.sessions}
                onChange={(v) => setNotifications({ ...notifications, sessions: v })}
              />
            </SettingRow>
            <SettingRow
              label="Messages"
              description="Nouveaux messages de ta squad"
            >
              <Toggle
                enabled={notifications.messages}
                onChange={(v) => setNotifications({ ...notifications, messages: v })}
              />
            </SettingRow>
            <SettingRow
              label="Party vocale"
              description="Quand quelqu'un rejoint la party"
            >
              <Toggle
                enabled={notifications.party}
                onChange={(v) => setNotifications({ ...notifications, party: v })}
              />
            </SettingRow>
            <SettingRow
              label="Rappels automatiques"
              description="30 min avant chaque session"
            >
              <Toggle
                enabled={notifications.reminders}
                onChange={(v) => setNotifications({ ...notifications, reminders: v })}
              />
            </SettingRow>
          </div>
        </Card>

        {/* Audio Section */}
        <Card className="mb-5 p-5 bg-[#101012]">
          <SectionHeader icon={Volume2} title="Audio" />
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-[13px] text-[#8b8d90] mb-2">
                <Mic className="w-4 h-4" />
                Microphone
              </label>
              <select
                value={audioInput}
                onChange={(e) => setAudioInput(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#f7f8f8] focus:outline-none focus:border-[#6366f1]"
              >
                <option value="default">Microphone par défaut</option>
                {inputDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[13px] text-[#8b8d90] mb-2">
                <Speaker className="w-4 h-4" />
                Sortie audio
              </label>
              <select
                value={audioOutput}
                onChange={(e) => setAudioOutput(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#f7f8f8] focus:outline-none focus:border-[#6366f1]"
              >
                <option value="default">Haut-parleur par défaut</option>
                {outputDevices.map(device => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Sortie ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Appearance Section */}
        <Card className="mb-5 p-5 bg-bg-surface">
          <SectionHeader icon={Palette} title="Apparence" />
          <SettingRow
            label="Thème"
            description="Adapte l'apparence de l'app"
          >
            <ThemeSelector />
          </SettingRow>
        </Card>

        {/* Privacy Section */}
        <Card className="mb-5 p-5 bg-[#101012]">
          <SectionHeader icon={Shield} title="Confidentialité" />
          <div className="space-y-1">
            <SettingRow
              label="Visibilité du profil"
              description="Qui peut voir tes stats"
            >
              <select
                value={privacy.profileVisibility}
                onChange={(e) => setPrivacy({ ...privacy, profileVisibility: e.target.value as 'public' | 'friends' | 'private' })}
                className="h-9 px-3 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[13px] text-[#f7f8f8] focus:outline-none focus:border-[#6366f1]"
              >
                <option value="public">Tout le monde</option>
                <option value="friends">Membres de mes squads</option>
                <option value="private">Personne</option>
              </select>
            </SettingRow>
            <SettingRow
              label="Statut en ligne"
              description="Montre quand tu es connecté"
            >
              <Toggle
                enabled={privacy.showOnlineStatus}
                onChange={(v) => setPrivacy({ ...privacy, showOnlineStatus: v })}
              />
            </SettingRow>
          </div>
        </Card>

        {/* Timezone & Language Section */}
        <Card className="mb-5 p-5 bg-[#101012]">
          <SectionHeader icon={Globe} title="Région" />
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-[13px] text-[#8b8d90] mb-2">
                <Globe className="w-4 h-4" />
                Fuseau horaire
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-11 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] text-[14px] text-[#f7f8f8] focus:outline-none focus:border-[#6366f1]"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[13px] text-[#8b8d90] mb-2">
                <Languages className="w-4 h-4" />
                Langue
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('fr')}
                  className={`flex-1 h-11 rounded-xl text-[14px] font-medium transition-interactive ${
                    language === 'fr'
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  Français
                </button>
                <button
                  onClick={() => setLanguage('en')}
                  className={`flex-1 h-11 rounded-xl text-[14px] font-medium transition-interactive ${
                    language === 'en'
                      ? 'bg-[#6366f1] text-white'
                      : 'bg-[rgba(255,255,255,0.05)] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.1)]'
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Section */}
        <Card className="mb-5 p-5 bg-[#101012]">
          <SectionHeader icon={Database} title="Données" />
          <div className="space-y-3">
            <button
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                {isExporting ? (
                  <Loader2 className="w-5 h-5 text-[#6366f1] animate-spin" />
                ) : (
                  <Download className="w-5 h-5 text-[#6366f1]" />
                )}
                <div className="text-left">
                  <p className="text-[14px] text-[#f7f8f8]">{isExporting ? 'Export en cours...' : 'Exporter mes données'}</p>
                  <p className="text-[12px] text-[#5e6063]">Télécharge toutes tes infos (RGPD)</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5e6063]" />
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(251,113,133,0.03)] hover:bg-[rgba(251,113,133,0.05)] transition-colors border border-[rgba(251,113,133,0.05)]"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-[#fb7185]" />
                <div className="text-left">
                  <p className="text-[14px] text-[#fb7185]">Supprimer mon compte</p>
                  <p className="text-[12px] text-[#fb7185]/60">Action irréversible</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#fb7185]/50" />
            </button>
          </div>
        </Card>

        {/* Legal Section */}
        <Card className="mb-5 p-5 bg-[#101012]">
          <SectionHeader icon={FileText} title="Légal" />
          <div className="space-y-3">
            <Link
              to="/legal"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#6366f1]" />
                <div className="text-left">
                  <p className="text-[14px] text-[#f7f8f8]">Conditions d'utilisation</p>
                  <p className="text-[12px] text-[#5e6063]">CGU de Squad Planner</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#5e6063]" />
            </Link>
            <Link
              to="/legal?tab=privacy"
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#6366f1]" />
                <div className="text-left">
                  <p className="text-[14px] text-[#f7f8f8]">Politique de confidentialité</p>
                  <p className="text-[12px] text-[#5e6063]">RGPD & protection des données</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#5e6063]" />
            </Link>
          </div>
        </Card>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-4 text-[14px] text-[#fb7185] hover:text-[#fda4af] transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>

        {/* Version */}
        <p className="text-center text-[12px] text-[#5e6063] mt-6">
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#101012] rounded-2xl border border-[rgba(251,113,133,0.1)] p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[rgba(251,113,133,0.08)] flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-[#fb7185]" />
                </div>
                <h3 className="text-lg font-bold text-[#f7f8f8]">Supprimer ton compte</h3>
              </div>

              <p className="text-[14px] text-[#8b8d90] mb-4">
                Cette action est <span className="text-[#fb7185] font-semibold">définitive et irréversible</span>.
                Toutes tes données seront supprimées : profil, messages, squads, statistiques.
              </p>

              <p className="text-[13px] text-[#8b8d90] mb-3">
                Tape <span className="font-mono text-[#fb7185] font-bold">SUPPRIMER</span> pour confirmer :
              </p>

              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="SUPPRIMER"
                disabled={isDeleting}
                className="w-full h-11 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(251,113,133,0.15)] text-[14px] text-[#f7f8f8] placeholder:text-[#5e6063] focus:outline-none focus:border-[#fb7185] mb-4"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl bg-[rgba(255,255,255,0.05)] text-[14px] text-[#8b8d90] hover:bg-[rgba(255,255,255,0.1)] transition-colors disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'SUPPRIMER' || isDeleting}
                  className="flex-1 h-11 rounded-xl bg-[#fb7185] text-white text-[14px] font-semibold hover:bg-[#f43f5e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </div>
  )
}

export default Settings
