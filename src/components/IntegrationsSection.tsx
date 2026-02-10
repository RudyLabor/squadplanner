import { memo, useState } from 'react'
import { Plug, Calendar, Tv, Gamepad2, MessageSquare, Download } from 'lucide-react'
import { useAuthStore } from '../hooks'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'

export const IntegrationsSection = memo(function IntegrationsSection() {
  const { user } = useAuthStore()
  const [twitchUsername, setTwitchUsername] = useState('')
  const [discordUsername, setDiscordUsername] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSaveSocial = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updates: Record<string, string | null> = {}
      if (twitchUsername) updates.twitch_username = twitchUsername
      if (discordUsername) updates.discord_username = discordUsername

      if (Object.keys(updates).length === 0) {
        toast.error('Aucune modification')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (error) throw error
      toast.success('Profil mis à jour !')
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Plug className="w-5 h-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-text-primary">Integrations</h2>
      </div>

      <div className="space-y-4">
        {/* Google Calendar */}
        <IntegrationRow
          icon={<Calendar className="w-4 h-4 text-blue-400" />}
          name="Google Calendar"
          description="Exporte tes sessions au format .ics compatible Google Calendar, Apple Calendar, Outlook"
          status="available"
          action={
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                toast.info('Utilise le bouton "Calendrier" sur chaque session pour l\'exporter')
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Exporter
            </a>
          }
        />

        {/* Twitch */}
        <IntegrationRow
          icon={<Tv className="w-4 h-4 text-purple-400" />}
          name="Twitch"
          description="Affiche ton pseudo Twitch sur ton profil public"
          status="partial"
          action={
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Pseudo Twitch"
                value={twitchUsername}
                onChange={(e) => setTwitchUsername(e.target.value)}
                className="w-32 px-2 py-1 rounded bg-overlay-subtle border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-purple-500/50"
              />
            </div>
          }
        />

        {/* Discord */}
        <IntegrationRow
          icon={<MessageSquare className="w-4 h-4 text-blue-500" />}
          name="Discord"
          description="Affiche ton pseudo Discord sur ton profil public"
          status="partial"
          action={
            <input
              type="text"
              placeholder="Pseudo#1234"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              className="w-32 px-2 py-1 rounded bg-overlay-subtle border border-border-subtle text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />
          }
        />

        {/* Steam / Xbox / PlayStation */}
        <IntegrationRow
          icon={<Gamepad2 className="w-4 h-4 text-text-tertiary" />}
          name="Steam / Xbox / PlayStation"
          description="Importe ta bibliotheque de jeux automatiquement"
          status="coming"
        />

        {/* Save button for social inputs */}
        {(twitchUsername || discordUsername) && (
          <button
            onClick={handleSaveSocial}
            disabled={saving}
            className="w-full py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-sm font-medium transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder les pseudos'}
          </button>
        )}
      </div>
    </div>
  )
})

function IntegrationRow({
  icon,
  name,
  description,
  status,
  action,
}: {
  icon: React.ReactNode
  name: string
  description: string
  status: 'available' | 'partial' | 'coming'
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-overlay-subtle flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{name}</span>
          {status === 'coming' && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-overlay-subtle text-text-tertiary font-medium">Bientot</span>
          )}
        </div>
        <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
      </div>
      {action && <div className="flex-shrink-0 mt-1">{action}</div>}
    </div>
  )
}
