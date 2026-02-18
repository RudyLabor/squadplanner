import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuthStore, useReferralStore, useAnalytics } from '../hooks'
import { motion } from 'framer-motion'

// Milestone config
const MILESTONES = [
  { key: 'recruiter3' as const, count: 3, label: 'Recruteur', reward: 'Badge "Recruteur"', icon: '🎖️' },
  { key: 'recruiter10' as const, count: 10, label: 'Recruteur Pro', reward: '1 mois Squad Leader gratuit', icon: '🏅' },
  { key: 'recruiter25' as const, count: 25, label: 'Recruteur Légendaire', reward: 'Squad Leader à vie', icon: '👑' },
] as const

export function Referrals() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { stats, history, isLoading, fetchReferralStats, fetchReferralHistory, copyShareUrl, generateShareUrl } = useReferralStore()
  const analytics = useAnalytics()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (user) {
      fetchReferralStats()
      fetchReferralHistory()
      analytics.track('referral_page_viewed' as any)
    }
  }, [user, fetchReferralStats, fetchReferralHistory, analytics])

  const handleCopyLink = async () => {
    const success = await copyShareUrl()
    if (success) {
      setCopied(true)
      analytics.track('referral_link_copied' as any)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShareWhatsApp = () => {
    const url = generateShareUrl()
    if (!url) return
    const text = `Rejoins Squad Planner et gagne 7 jours Premium gratuit ! ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    analytics.track('referral_shared' as any, { platform: 'whatsapp' })
  }

  const handleShareTwitter = () => {
    const url = generateShareUrl()
    if (!url) return
    const text = `Je planifie mes sessions gaming avec @SquadPlanner ! Rejoins-nous et gagne 7 jours Premium gratuit`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    analytics.track('referral_shared' as any, { platform: 'twitter' })
  }

  if (!user) {
    navigate('/auth')
    return null
  }

  return (
    <main className="min-h-0 bg-bg-base pb-6">
      <div className="mx-auto max-w-2xl px-4 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl font-bold text-text-primary">Parrainage</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Invite tes amis et gagnez tous les deux 7 jours Premium gratuit !
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Referral Code Card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 rounded-2xl bg-bg-card p-6 shadow-sm ring-1 ring-border"
            >
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Ton code de parrainage
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl bg-bg-base px-4 py-3 text-center font-mono text-lg font-bold text-primary">
                  {stats?.referralCode || '—'}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="shrink-0 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-95"
                >
                  {copied ? 'Copié !' : 'Copier le lien'}
                </button>
              </div>

              {/* Share buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={handleShareWhatsApp}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-4 py-2.5 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
                >
                  <span>WhatsApp</span>
                </button>
                <button
                  onClick={handleShareTwitter}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1DA1F2]/10 px-4 py-2.5 text-sm font-medium text-[#1DA1F2] transition-colors hover:bg-[#1DA1F2]/20"
                >
                  <span>Twitter / X</span>
                </button>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 grid grid-cols-2 gap-3"
            >
              <StatCard label="Filleuls inscrits" value={stats?.signedUp || 0} />
              <StatCard label="Convertis Premium" value={stats?.converted || 0} />
              <StatCard label="XP gagnés" value={stats?.totalXpEarned || 0} />
              <StatCard label="Total parrainages" value={stats?.totalReferrals || 0} />
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6 rounded-2xl bg-bg-card p-6 shadow-sm ring-1 ring-border"
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Comment ça marche
              </h2>
              <div className="space-y-4">
                <Step number={1} text="Partage ton lien de parrainage avec tes amis" />
                <Step number={2} text="Ton ami s'inscrit via ton lien" />
                <Step number={3} text="Vous gagnez tous les deux 7 jours Premium + toi +500 XP" />
                <Step number={4} text="Si ton ami passe Premium, tu gagnes 1 mois gratuit" />
              </div>
            </motion.div>

            {/* Milestones */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6 rounded-2xl bg-bg-card p-6 shadow-sm ring-1 ring-border"
            >
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                Paliers de récompense
              </h2>
              <div className="space-y-3">
                {MILESTONES.map((m) => {
                  const achieved = stats?.milestones[m.key] || false
                  const current = stats?.totalReferrals || 0
                  const progress = Math.min(current / m.count, 1)
                  return (
                    <div key={m.key} className={`rounded-xl p-4 ${achieved ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-bg-base'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{m.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-semibold ${achieved ? 'text-primary' : 'text-text-primary'}`}>
                              {m.label} — {m.count} filleuls
                            </span>
                            {achieved && (
                              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                                Débloqué
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{m.reward}</p>
                          {!achieved && (
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${progress * 100}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* Referral History */}
            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl bg-bg-card p-6 shadow-sm ring-1 ring-border"
              >
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-text-secondary">
                  Historique ({history.length})
                </h2>
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-bg-base px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          Filleul {item.status === 'signed_up' ? 'inscrit' : item.status === 'converted' ? 'converti' : 'en attente'}
                        </p>
                        <p className="text-xs text-text-secondary">
                          {new Date(item.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-bg-card p-4 shadow-sm ring-1 ring-border">
      <p className="text-2xl font-bold text-text-primary">{value.toLocaleString('fr-FR')}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  )
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {number}
      </div>
      <p className="text-sm text-text-primary">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'signed_up' | 'converted' }) {
  const config = {
    pending: { label: 'En attente', className: 'bg-amber-500/10 text-amber-500' },
    signed_up: { label: 'Inscrit', className: 'bg-blue-500/10 text-blue-500' },
    converted: { label: 'Premium', className: 'bg-green-500/10 text-green-500' },
  }
  const c = config[status]
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  )
}

export default Referrals
