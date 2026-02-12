import { m } from 'framer-motion'
import {
  Check,
  Gift,
  ArrowRight,
  Loader2,
  Rocket,
  Sparkles,
  Shield,
  Clock,
  CheckCircle2,
  Crown,
  Zap,
} from '../../components/icons'
import { Button, Card } from '../../components/ui'
import { PREMIUM_PRICE_MONTHLY, PREMIUM_PRICE_YEARLY } from '../../hooks/usePremium'

interface PremiumPricingProps {
  selectedPlan: 'monthly' | 'yearly'
  setSelectedPlan: (plan: 'monthly' | 'yearly') => void
  isLoading: boolean
  error: string | null
  onUpgrade: () => void
  onStartTrial: () => void
}

export function PremiumPricing({ selectedPlan, setSelectedPlan, isLoading, error, onUpgrade, onStartTrial }: PremiumPricingProps) {
  const savings = Math.round((PREMIUM_PRICE_MONTHLY * 12 - PREMIUM_PRICE_YEARLY) / (PREMIUM_PRICE_MONTHLY * 12) * 100)

  return (
    <>
      {/* Free Trial Banner */}
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-success/10 to-transparent border border-success/20 p-6 md:p-8">
        <m.div className="absolute top-3 right-8 text-success/40" animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}><Sparkles className="w-6 h-6" /></m.div>
        <m.div className="absolute bottom-4 left-6 text-success/30" animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.15, 1] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}><Sparkles className="w-5 h-5" /></m.div>
        <div className="relative text-center">
          <m.div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-success to-success/60 mb-4 shadow-lg" animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
            <Gift className="w-7 h-7 text-white" />
          </m.div>
          <h2 className="text-lg md:text-xl font-bold text-text-primary mb-2">7 jours d'essai gratuit</h2>
          <p className="text-md text-text-secondary mb-1">Essaie Premium gratuitement pendant 7 jours</p>
          <p className="text-base text-text-tertiary mb-5">Pas de carte bancaire requise. Annule &agrave; tout moment.</p>
          <Button onClick={onStartTrial} className="h-12 px-8 text-md bg-gradient-to-r from-success to-success/80 text-white font-semibold hover:opacity-90 shadow-lg mb-5">
            <Gift className="w-5 h-5" /> Commencer l'essai gratuit <ArrowRight className="w-5 h-5" />
          </Button>
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
            <div className="flex items-center gap-2 text-base text-text-secondary"><Shield className="w-4 h-4 text-success" /><span>Aucun engagement</span></div>
            <div className="flex items-center gap-2 text-base text-text-secondary"><Clock className="w-4 h-4 text-success" /><span>7 jours complets</span></div>
            <div className="flex items-center gap-2 text-base text-text-secondary"><CheckCircle2 className="w-4 h-4 text-success" /><span>Pas de CB requise</span></div>
          </div>
        </div>
      </m.div>

      {/* Pricing Cards */}
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid md:grid-cols-2 gap-4 mb-16">
        <m.button onClick={() => setSelectedPlan('monthly')} className={`relative p-6 rounded-2xl border-2 text-left transition-interactive ${selectedPlan === 'monthly' ? 'border-primary bg-primary/5 shadow-glow-primary-sm' : 'border-border-hover bg-overlay-faint hover:border-border-hover'}`} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.99 }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md text-text-secondary">Mensuel</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success"><Gift className="w-3 h-3" />7j gratuits</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1"><span className="text-2xl font-bold text-text-primary">{PREMIUM_PRICE_MONTHLY.toFixed(2)}&euro;</span><span className="text-md text-text-tertiary">/mois</span></div>
          <p className="text-base text-success mb-1">Commence par 7 jours gratuits</p>
          <p className="text-base text-text-tertiary">Flexibilit&eacute; maximale, annule quand tu veux</p>
          {selectedPlan === 'monthly' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-primary flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
        </m.button>

        <m.button onClick={() => setSelectedPlan('yearly')} className={`relative p-6 rounded-2xl border-2 text-left transition-interactive ${selectedPlan === 'yearly' ? 'border-success bg-success/5 shadow-glow-success' : 'border-border-hover bg-overlay-faint hover:border-border-hover'}`} whileHover={{ y: -2, scale: 1.02 }} whileTap={{ scale: 0.99 }}>
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-success to-success text-xs font-bold text-bg-base">MEILLEURE OFFRE</div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-md text-text-secondary">Annuel</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs font-medium text-success"><Gift className="w-3 h-3" />7j gratuits</span>
          </div>
          <div className="flex items-baseline gap-1 mb-1"><span className="text-2xl font-bold text-text-primary">{(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}&euro;</span><span className="text-md text-text-tertiary">/mois</span></div>
          <div className="flex items-center gap-2 mb-1"><span className="text-base line-through text-text-tertiary">{(PREMIUM_PRICE_MONTHLY * 12).toFixed(2)}&euro;/an</span><span className="text-base font-semibold text-success">{PREMIUM_PRICE_YEARLY.toFixed(2)}&euro;/an</span></div>
          <p className="text-base text-success mb-1">Commence par 7 jours gratuits</p>
          <p className="text-base text-success">&Eacute;conomise {savings}% &mdash; 2 mois offerts !</p>
          {selectedPlan === 'yearly' && <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-success flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
        </m.button>
      </m.div>

      {/* CTA Button */}
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-center mb-16">
        {error && <div className="mb-4 p-3 rounded-lg bg-error/5 border border-error/10"><p className="text-error text-base">{error}</p></div>}
        <Button onClick={onUpgrade} disabled={isLoading} className="h-14 px-10 text-lg bg-gradient-to-r from-primary via-purple to-primary bg-[length:200%_100%] hover:bg-[position:100%_0] transition-interactive shadow-glow-primary-md animate-pulse-glow">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Rocket className="w-5 h-5" /> Passer Premium maintenant <ArrowRight className="w-5 h-5" /></>}
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-sm text-text-tertiary">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Paiement sécurisé
          </span>
          <span>·</span>
          <span>Annulation facile</span>
          <span>·</span>
          <span>Satisfait ou remboursé 30j</span>
        </div>
      </m.div>

      {/* Final CTA */}
      <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }} className="text-center">
        <Card className="p-8 bg-gradient-to-br from-primary/[0.075] to-warning/5 border-primary">
          <Crown className="w-12 h-12 text-warning mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-text-primary mb-2">Pr&ecirc;t &agrave; passer Premium ?</h3>
          <p className="text-md text-text-secondary mb-2 max-w-md mx-auto">Rejoins les squads qui ont choisi de jouer s&eacute;rieusement ensemble.</p>
          <p className="text-base text-success mb-6 font-medium">Commence par 7 jours d'essai gratuit &mdash; sans carte bancaire</p>
          <Button onClick={onUpgrade} disabled={isLoading} className="h-12 px-8 bg-gradient-to-r from-warning to-warning/70 text-bg-base font-semibold hover:opacity-90">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Commencer &mdash; {selectedPlan === 'monthly' ? `${PREMIUM_PRICE_MONTHLY.toFixed(2)}\u20AC/mois` : `${(PREMIUM_PRICE_YEARLY / 12).toFixed(2)}\u20AC/mois`}</>}
          </Button>
        </Card>
      </m.div>
    </>
  )
}
