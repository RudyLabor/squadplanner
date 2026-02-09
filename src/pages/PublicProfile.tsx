import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Shield, Flame, Star, Calendar, Gamepad2, MapPin, ExternalLink } from 'lucide-react'
import { usePublicProfileQuery } from '../hooks/queries'

const TIERS = [
  { name: 'Debutant', color: 'var(--color-text-tertiary)', icon: '🎮', minScore: 0 },
  { name: 'Confirme', color: 'var(--color-primary)', icon: '✓', minScore: 50 },
  { name: 'Expert', color: 'var(--color-success)', icon: '⭐', minScore: 70 },
  { name: 'Master', color: 'var(--color-purple)', icon: '💎', minScore: 85 },
  { name: 'Legende', color: 'var(--color-warning)', icon: '👑', minScore: 95 },
]

function getTier(score: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) return TIERS[i]
  }
  return TIERS[0]
}

export function PublicProfile() {
  const { username } = useParams<{ username: string }>()
  const { data: profile, isLoading } = usePublicProfileQuery(username)

  const tier = useMemo(() => {
    if (!profile) return TIERS[0]
    return getTier(profile.reliability_score ?? 100)
  }, [profile])

  const attendanceRate = useMemo(() => {
    if (!profile || !profile.total_sessions || profile.total_sessions === 0) return 0
    const present = (profile.total_checkins ?? 0) - (profile.total_noshow ?? 0)
    return Math.round((present / profile.total_sessions) * 100)
  }, [profile])

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-24 bg-overlay-light rounded" />
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-overlay-light" />
            <div className="h-5 w-32 bg-overlay-light rounded" />
            <div className="h-4 w-48 bg-overlay-subtle rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-overlay-subtle rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 text-center">
        <p className="text-text-tertiary mt-12">Profil introuvable</p>
        <Link to="/discover" className="text-primary text-sm mt-2 inline-block hover:underline">
          Retour a la decouverte
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-lg mx-auto px-4 py-6 pb-24"
    >
      {/* Back button */}
      <Link to="/discover" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Decouvrir
      </Link>

      {/* Profile header */}
      <div className="flex flex-col items-center text-center mb-6">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full border-2 border-border-subtle" loading="lazy" decoding="async" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border-subtle">
            <span className="text-2xl font-bold text-primary">{profile.username?.charAt(0).toUpperCase()}</span>
          </div>
        )}

        <h1 className="text-lg font-bold text-text-primary mt-3">{profile.username}</h1>

        {/* Tier badge */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-sm">{tier.icon}</span>
          <span className="text-xs font-medium" style={{ color: tier.color }}>{tier.name}</span>
        </div>

        {profile.bio && (
          <p className="text-sm text-text-secondary mt-2 max-w-xs">{profile.bio}</p>
        )}

        {/* Region & playstyle */}
        <div className="flex items-center gap-3 mt-2">
          {profile.region && (
            <span className="inline-flex items-center gap-1 text-xs text-text-tertiary">
              <MapPin className="w-3 h-3" />
              {profile.region}
            </span>
          )}
          {profile.playstyle && (
            <span className="text-xs text-text-tertiary capitalize">{profile.playstyle}</span>
          )}
        </div>

        {/* Social links */}
        <div className="flex items-center gap-2 mt-3">
          {profile.twitch_username && (
            <a
              href={`https://twitch.tv/${profile.twitch_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-purple/10 text-purple hover:bg-purple/20 transition-colors"
            >
              Twitch
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {profile.discord_username && (
            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-info/10 text-info">
              Discord: {profile.discord_username}
            </span>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <StatCard
          icon={<Star className="w-4 h-4 text-primary" />}
          label="XP"
          value={(profile.xp ?? 0).toLocaleString()}
          sub={`Niveau ${profile.level ?? 1}`}
        />
        <StatCard
          icon={<Shield className="w-4 h-4 text-success" />}
          label="Fiabilite"
          value={`${Math.round(profile.reliability_score ?? 100)}%`}
          sub={tier.name}
        />
        <StatCard
          icon={<Calendar className="w-4 h-4 text-warning" />}
          label="Sessions"
          value={`${profile.total_sessions ?? 0}`}
          sub={`${attendanceRate}% de presence`}
        />
        <StatCard
          icon={<Flame className="w-4 h-4 text-warning" />}
          label="Streak"
          value={`${profile.streak_days ?? 0} jours`}
          sub="Connexion consecutive"
        />
      </div>

      {/* Preferred games */}
      {profile.preferred_games && profile.preferred_games.length > 0 && (
        <div className="rounded-xl border border-border-subtle bg-surface-card p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Jeux preferes</h3>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {profile.preferred_games.map((g: string) => (
              <span key={g} className="text-xs px-2 py-1 rounded-lg bg-overlay-subtle text-text-secondary">{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* Member since */}
      <div className="text-center">
        <p className="text-xs text-text-tertiary">
          Membre depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </motion.div>
  )
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-card p-3">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-sm text-text-tertiary">{label}</span>
      </div>
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-tertiary">{sub}</p>
    </div>
  )
}

export default PublicProfile
