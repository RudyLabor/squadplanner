import { useState, useEffect } from 'react'
import { m, useInView } from 'framer-motion'
import { useRef } from 'react'
import { useAuthStore, useReferralStore, useAnalytics } from '../hooks'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import {
  Gift,
  UserPlus,
  Trophy,
  Crown,
  Award,
  Zap,
  Users,
  TrendingUp,
  Copy,
  Share2,
  Check,
  Sparkles,
} from '../components/icons'

const ease = [0.16, 1, 0.3, 1] as const

const MILESTONES = [
  {
    key: 'recruiter3' as const,
    count: 3,
    label: 'Recruteur',
    reward: 'Badge "Recruteur" + 5% de réduction à vie',
    Icon: Award,
  },
  {
    key: 'recruiter10' as const,
    count: 10,
    label: 'Recruteur Pro',
    reward: '10% de réduction à vie + 1 mois Squad Leader gratuit',
    Icon: Trophy,
  },
  {
    key: 'recruiter25' as const,
    count: 25,
    label: 'Recruteur Légendaire',
    reward: '20% de réduction à vie + Squad Leader à vie',
    Icon: Crown,
  },
] as const

export function Referrals() {
  const { user } = useAuthStore()
  const {
    stats,
    history,
    isLoading,
    fetchReferralStats,
    fetchReferralHistory,
    copyShareUrl,
    generateShareUrl,
  } = useReferralStore()
  const analytics = useAnalytics()
  const [copied, setCopied] = useState(false)
  const heroRef = useRef(null)
  const isHeroInView = useInView(heroRef, { once: true })

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
    const text = `Rejoins Squad Planner et gagne 7 jours Premium gratuit ! Moi j'économise sur mon abo grâce au parrainage. ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
    analytics.track('referral_shared' as any, { platform: 'whatsapp' })
  }

  const handleShareTwitter = () => {
    const url = generateShareUrl()
    if (!url) return
    const text = `Je planifie mes sessions gaming avec @SquadPlanner ! Rejoins-nous et gagne 7 jours Premium gratuit`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      '_blank'
    )
    analytics.track('referral_shared' as any, { platform: 'twitter' })
  }

  // Auth is already handled by the _protected layout — no need for a redundant check
  // that would race with Zustand store hydration and cause a redirect loop.

  return (
    <main className="min-h-0 bg-bg-base mesh-bg" aria-label="Parrainage">
      {/* ─── HERO SECTION (like Premium) ─── */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-success/15 via-primary/8 to-bg-base pt-8 pb-20"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <m.div
            className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-success/10 to-primary/5 blur-3xl"
            animate={isHeroInView ? { x: [0, 80, 0], y: [0, 40, 0] } : {}}
            transition={{ duration: 3, repeat: 2, ease: 'easeInOut' }}
          />
          <m.div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-primary/10 to-success/5 blur-3xl"
            animate={isHeroInView ? { x: [0, -80, 0], y: [0, -40, 0] } : {}}
            transition={{ duration: 3, repeat: 2, ease: 'easeInOut', delay: 0.5 }}
          />
        </div>

        {/* Bottom fade — eliminates the hard edge between hero gradient and bg-bg-base */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-bg-base pointer-events-none" />

        <div className="relative px-4 md:px-6 max-w-4xl mx-auto">
          <div className="text-center">
            {/* Pill badge */}
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease }}
              className="flex justify-center mb-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-success/10 to-success/025 border border-success/15">
                <Sparkles className="w-4 h-4 text-success" />
                <span className="text-base font-medium text-success">Réductions permanentes à débloquer</span>
              </div>
            </m.div>

            {/* Icon */}
            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease }}
              className="mb-4"
            >
              <div
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-success to-success/60 mb-6"
                style={{ boxShadow: 'var(--shadow-glow-success-strong)' }}
              >
                <Gift className="w-10 h-10 text-white" />
              </div>
            </m.div>

            {/* Title with gradient word */}
            <m.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease }}
              className="text-lg md:text-xl font-bold text-text-primary mb-4"
            >
              Tes potes galèrent aussi ?{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-success to-primary">
                Invite-les.
              </span>
            </m.h1>

            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
              className="text-md md:text-lg text-text-secondary max-w-xl mx-auto"
            >
              3 inscrits et ta squad grandit — plus les réductions en bonus.
              Ton pote gagne 7 jours Premium. Toi, tu déverrouilles des réductions permanentes sur ton abo + 500 XP.
            </m.p>
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─── */}
      <div className="mx-auto max-w-2xl md:max-w-3xl px-4 md:px-6 lg:px-8 -mt-14 pb-8 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-16" aria-busy="true">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-success border-t-transparent" />
          </div>
        ) : (
          <>
            {/* ─── REFERRAL CODE CARD ─── */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease }}
            >
              <Card variant="elevated" className="mb-5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
                    <UserPlus className="h-4 w-4 text-success" />
                  </div>
                  <h2 className="text-md font-semibold text-text-primary">
                    Ton code de parrainage
                  </h2>
                </div>

                {/* Code display */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex-1 rounded-xl px-4 py-3.5 text-center font-mono text-lg font-bold text-success border border-success/20"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-success-5), transparent)',
                    }}
                  >
                    {stats?.referralCode || '—'}
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCopyLink}
                    showSuccess={copied}
                    leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  >
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                </div>

                {/* Share buttons */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/10 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(37,211,102,0.05), transparent)',
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={handleShareTwitter}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all border border-[#1DA1F2]/20 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(29,161,242,0.05), transparent)',
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Twitter / X</span>
                  </button>
                </div>
              </Card>
            </m.div>

            {/* ─── STATS GRID ─── */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease }}
              className="mb-5 grid grid-cols-2 gap-3"
            >
              <StatCard
                icon={UserPlus}
                label="Filleuls inscrits"
                value={stats?.signedUp || 0}
                color="success"
              />
              <StatCard
                icon={TrendingUp}
                label="Convertis Premium"
                value={stats?.converted || 0}
                color="primary"
              />
              <StatCard
                icon={Zap}
                label="XP gagnés"
                value={stats?.totalXpEarned || 0}
                color="warning"
              />
              <StatCard
                icon={Users}
                label="Total parrainages"
                value={stats?.totalReferrals || 0}
                color="purple"
              />
            </m.div>

            {/* ─── HOW IT WORKS ─── */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease }}
            >
              <Card variant="default" className="mb-5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-md font-semibold text-text-primary">Comment ça marche</h2>
                </div>
                <div className="space-y-4">
                  <Step
                    number={1}
                    text="Partage ton lien de parrainage avec tes amis"
                    color="success"
                  />
                  <Step number={2} text="Ton ami s'inscrit via ton lien" color="primary" />
                  <Step
                    number={3}
                    text="Ton pote reçoit 7 jours Premium gratuit. Toi tu gagnes 500 XP + réduction permanente."
                    color="warning"
                  />
                  <Step
                    number={4}
                    text="3 parrainages = 5% de réduction à vie, 10 = 10%, 25 = 20% sur ton abo"
                    color="success"
                  />
                </div>
              </Card>
            </m.div>

            {/* ─── MILESTONES ─── */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease }}
            >
              <Card variant="default" className="mb-5 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <Trophy className="h-4 w-4 text-warning" />
                  </div>
                  <h2 className="text-md font-semibold text-text-primary">Paliers de récompense</h2>
                </div>
                <div className="space-y-3">
                  {MILESTONES.map((ms, i) => {
                    const achieved = stats?.milestones[ms.key] || false
                    const current = stats?.totalReferrals || 0
                    const progress = Math.min(current / ms.count, 1)
                    const iconBgClasses = [
                      'bg-success/10',
                      'bg-primary/10',
                      'bg-warning/10',
                    ] as const
                    const iconTextClasses = [
                      'text-success',
                      'text-primary',
                      'text-warning',
                    ] as const
                    const barClasses = [
                      'bg-gradient-to-r from-success to-success/60',
                      'bg-gradient-to-r from-primary to-primary/60',
                      'bg-gradient-to-r from-warning to-warning/60',
                    ] as const
                    return (
                      <m.div
                        key={ms.key}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.08, duration: 0.4, ease }}
                        className={`rounded-xl p-4 transition-interactive ${
                          achieved
                            ? 'border border-success/20'
                            : 'bg-surface-card border border-border-subtle hover:border-border-hover'
                        }`}
                        style={
                          achieved
                            ? {
                                background:
                                  'linear-gradient(135deg, var(--color-success-5), transparent)',
                                boxShadow: 'var(--shadow-glow-success)',
                              }
                            : undefined
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              achieved
                                ? 'bg-gradient-to-br from-success to-success/60'
                                : iconBgClasses[i]
                            }`}
                            style={
                              achieved ? { boxShadow: 'var(--shadow-glow-success)' } : undefined
                            }
                          >
                            <ms.Icon
                              className={`h-5 w-5 ${achieved ? 'text-white' : iconTextClasses[i]}`}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-sm font-semibold ${achieved ? 'text-success' : 'text-text-primary'}`}
                              >
                                {ms.label}
                              </span>
                              {achieved ? (
                                <Badge variant="success" size="sm">
                                  Débloqué
                                </Badge>
                              ) : (
                                <span className="text-xs text-text-quaternary font-medium">
                                  {current}/{ms.count}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-text-tertiary mt-0.5">{ms.reward}</p>
                            {!achieved && (
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-border-subtle">
                                <m.div
                                  className={`h-full rounded-full ${barClasses[i]}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress * 100}%` }}
                                  transition={{ duration: 0.8, ease, delay: 0.5 + i * 0.1 }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </m.div>
                    )
                  })}
                </div>
              </Card>
            </m.div>

            {/* ─── REFERRAL HISTORY ─── */}
            {history.length > 0 && (
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease }}
              >
                <Card variant="default" className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-md font-semibold text-text-primary">
                      Historique ({history.length})
                    </h2>
                  </div>
                  <div className="space-y-2">
                    {history.map((item, i) => (
                      <m.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + i * 0.05, duration: 0.3, ease }}
                        className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3 border border-border-subtle hover:border-border-hover transition-interactive"
                      >
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            Filleul{' '}
                            {item.status === 'signed_up'
                              ? 'inscrit'
                              : item.status === 'converted'
                                ? 'converti'
                                : 'en attente'}
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
                      </m.div>
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

/* ─── STAT CARD ─── */
function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: 'success' | 'primary' | 'warning' | 'purple'
}) {
  const colorMap = {
    success: { bg: 'bg-success/10', text: 'text-success', glow: 'var(--shadow-glow-success)' },
    primary: { bg: 'bg-primary/10', text: 'text-primary', glow: 'var(--shadow-glow-primary-sm)' },
    warning: { bg: 'bg-warning/10', text: 'text-warning', glow: 'var(--shadow-glow-warning)' },
    purple: { bg: 'bg-purple/10', text: 'text-purple', glow: 'var(--shadow-glow-purple)' },
  }
  const c = colorMap[color]

  return (
    <m.div whileHover={{ y: -2, boxShadow: c.glow }} transition={{ duration: 0.2 }}>
      <Card variant="default" className="p-4 h-full" hoverable>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.bg}`}>
            <Icon className={`h-5 w-5 ${c.text}`} />
          </div>
          <div className="min-w-0">
            <p className={`text-2xl font-bold tracking-tight leading-none ${c.text}`}>
              {value.toLocaleString('fr-FR')}
            </p>
            <p className="text-xs text-text-tertiary mt-1">{label}</p>
          </div>
        </div>
      </Card>
    </m.div>
  )
}

/* ─── STEP ─── */
const stepStyles = {
  success: 'bg-success/10 text-success',
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-warning/10 text-warning',
} as const

function Step({
  number,
  text,
  color,
}: {
  number: number
  text: string
  color: keyof typeof stepStyles
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${stepStyles[color]}`}
      >
        {number}
      </div>
      <p className="text-sm text-text-primary pt-1">{text}</p>
    </div>
  )
}

/* ─── STATUS BADGE ─── */
function StatusBadge({ status }: { status: 'pending' | 'signed_up' | 'converted' }) {
  const config = {
    pending: { label: 'En attente', variant: 'warning' as const },
    signed_up: { label: 'Inscrit', variant: 'info' as const },
    converted: { label: 'Premium', variant: 'success' as const },
  }
  const c = config[status]
  return (
    <Badge variant={c.variant} size="sm">
      {c.label}
    </Badge>
  )
}

export default Referrals
