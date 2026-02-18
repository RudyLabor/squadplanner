import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { m } from 'framer-motion'
import { useAuthStore, useReferralStore, useAnalytics } from '../hooks'
import { Card, CardContent } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Gift, UserPlus, Trophy, Crown, Award, Zap, Users, TrendingUp } from '../components/icons'
import { Copy, Share2, Check } from '../components/icons'

const ease = [0.16, 1, 0.3, 1] as const

const MILESTONES = [
  { key: 'recruiter3' as const, count: 3, label: 'Recruteur', reward: 'Badge "Recruteur"', Icon: Award },
  { key: 'recruiter10' as const, count: 10, label: 'Recruteur Pro', reward: '1 mois Squad Leader gratuit', Icon: Trophy },
  { key: 'recruiter25' as const, count: 25, label: 'Recruteur Legendaire', reward: 'Squad Leader a vie', Icon: Crown },
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

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
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Parrainage">
      <div className="mx-auto max-w-2xl md:max-w-3xl px-4 md:px-6 lg:px-8 py-6">
        {/* Header */}
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease }}
          className="mb-6 text-center"
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-text-primary">Parrainage</h1>
          <p className="mt-1.5 text-sm text-text-tertiary">
            Invite tes amis et gagnez tous les deux 7 jours Premium gratuit !
          </p>
        </m.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12" aria-busy="true">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Referral Code Card */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.4, ease }}
            >
              <Card variant="elevated" className="mb-5 p-5">
                <SectionHeader icon={UserPlus} title="Ton code de parrainage" />
                <div className="flex items-center gap-3">
                  <div className="flex-1 rounded-xl bg-bg-base px-4 py-3 text-center font-mono text-lg font-bold text-primary border border-border-subtle">
                    {stats?.referralCode || '\u2014'}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCopyLink}
                    showSuccess={copied}
                    leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  >
                    {copied ? 'Copie !' : 'Copier'}
                  </Button>
                </div>

                {/* Share buttons */}
                <div className="mt-4 flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={handleShareWhatsApp}
                    leftIcon={<Share2 className="h-4 w-4" />}
                  >
                    WhatsApp
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={handleShareTwitter}
                    leftIcon={<Share2 className="h-4 w-4" />}
                  >
                    Twitter / X
                  </Button>
                </div>
              </Card>
            </m.div>

            {/* Stats Grid */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease }}
              className="mb-5 grid grid-cols-2 gap-3"
            >
              <StatCard icon={UserPlus} label="Filleuls inscrits" value={stats?.signedUp || 0} />
              <StatCard icon={TrendingUp} label="Convertis Premium" value={stats?.converted || 0} />
              <StatCard icon={Zap} label="XP gagnes" value={stats?.totalXpEarned || 0} />
              <StatCard icon={Users} label="Total parrainages" value={stats?.totalReferrals || 0} />
            </m.div>

            {/* How it works */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease }}
            >
              <Card variant="default" className="mb-5 p-5">
                <SectionHeader icon={Gift} title="Comment ca marche" />
                <div className="space-y-3">
                  <Step number={1} text="Partage ton lien de parrainage avec tes amis" />
                  <Step number={2} text="Ton ami s'inscrit via ton lien" />
                  <Step number={3} text="Vous gagnez tous les deux 7 jours Premium + toi +500 XP" />
                  <Step number={4} text="Si ton ami passe Premium, tu gagnes 1 mois gratuit" />
                </div>
              </Card>
            </m.div>

            {/* Milestones */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
            >
              <Card variant="default" className="mb-5 p-5">
                <SectionHeader icon={Trophy} title="Paliers de recompense" />
                <div className="space-y-3">
                  {MILESTONES.map((ms) => {
                    const achieved = stats?.milestones[ms.key] || false
                    const current = stats?.totalReferrals || 0
                    const progress = Math.min(current / ms.count, 1)
                    return (
                      <div
                        key={ms.key}
                        className={`rounded-xl p-4 transition-interactive ${
                          achieved
                            ? 'bg-primary/8 border border-primary/20'
                            : 'bg-bg-base border border-border-subtle'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            achieved ? 'bg-primary/15' : 'bg-bg-active'
                          }`}>
                            <ms.Icon className={`h-5 w-5 ${achieved ? 'text-primary' : 'text-text-quaternary'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-sm font-semibold ${achieved ? 'text-primary' : 'text-text-primary'}`}>
                                {ms.label} — {ms.count} filleuls
                              </span>
                              {achieved && (
                                <Badge variant="success" size="sm">Debloque</Badge>
                              )}
                            </div>
                            <p className="text-xs text-text-tertiary mt-0.5">{ms.reward}</p>
                            {!achieved && (
                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border-subtle">
                                <m.div
                                  className="h-full rounded-full bg-primary"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress * 100}%` }}
                                  transition={{ duration: 0.6, ease }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            </m.div>

            {/* Referral History */}
            {history.length > 0 && (
              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.4, ease }}
              >
                <Card variant="default" className="p-5">
                  <SectionHeader icon={Users} title={`Historique (${history.length})`} />
                  <div className="space-y-2">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-bg-base px-4 py-3 border border-border-subtle"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Filleul {item.status === 'signed_up' ? 'inscrit' : item.status === 'converted' ? 'converti' : 'en attente'}
                          </p>
                          <p className="text-xs text-text-quaternary mt-0.5">
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
                </Card>
              </m.div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <h2 className="text-md font-semibold text-text-primary">{title}</h2>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <Card variant="default" className="p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-text-primary tracking-tight leading-none">
            {value.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-text-tertiary mt-1">{label}</p>
        </div>
      </div>
    </Card>
  )
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {number}
      </div>
      <p className="text-sm text-text-primary pt-0.5">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: 'pending' | 'signed_up' | 'converted' }) {
  const config = {
    pending: { label: 'En attente', variant: 'warning' as const },
    signed_up: { label: 'Inscrit', variant: 'info' as const },
    converted: { label: 'Premium', variant: 'success' as const },
  }
  const c = config[status]
  return <Badge variant={c.variant} size="sm">{c.label}</Badge>
}

export default Referrals
