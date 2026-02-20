import { useState, useRef, type RefObject } from 'react'
import { m, useInView } from 'framer-motion'
import { useAnalytics } from '../hooks'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PublicPageShell } from '../components/PublicPageShell'
import {
  Star, Gift, Users, TrendingUp, Trophy, Zap, Crown, ChevronRight, Copy, Check,
  ExternalLink, Mic, Shield, Gamepad2, Award,
} from '../components/icons'

const ease = [0.16, 1, 0.3, 1] as const

interface FormData {
  pseudo: string
  platform: string
  link: string
  followers: string
  message: string
}

export function Ambassador() {
  const analytics = useAnalytics()
  const [formData, setFormData] = useState<FormData>({
    pseudo: '',
    platform: 'Twitch',
    link: '',
    followers: '',
    message: '',
  })
  const [copied, setCopied] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Refs for scroll reveal
  const heroRef = useRef(null)
  const advantagesRef = useRef(null)
  const stepsRef = useRef(null)
  const profilesRef = useRef(null)
  const formRef = useRef<HTMLDivElement>(null)
  const faqRef = useRef(null)

  const isHeroInView = useInView(heroRef, { once: true })
  const isAdvantagesInView = useInView(advantagesRef, { once: true })
  const isStepsInView = useInView(stepsRef, { once: true })
  const isProfilesInView = useInView(profilesRef, { once: true })
  const isFormInView = useInView(formRef, { once: true })
  const isFaqInView = useInView(faqRef, { once: true })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const subject = 'Candidature Programme Ambassadeur Squad Planner'
    const body = `
Pseudo/Nom: ${formData.pseudo}
Plateforme: ${formData.platform}
Lien: ${formData.link}
Followers/Viewers: ${formData.followers}

Pourquoi Squad Planner?
${formData.message}
    `.trim()

    const mailtoLink = `mailto:ambassadeur@squadplanner.fr?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoLink

    analytics.track('ambassador_form_submitted' as any, {
      platform: formData.platform,
    })

    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 2000)
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('ambassadeur@squadplanner.fr')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <PublicPageShell>
      {/* ─── HERO SECTION ─── */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-purple/15 via-primary/8 to-bg-base pt-8 pb-20"
      >
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <m.div
            className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-purple/10 to-primary/5 blur-3xl"
            animate={isHeroInView ? { x: [0, 80, 0], y: [0, 40, 0] } : {}}
            transition={{ duration: 3, repeat: 2, ease: 'easeInOut' }}
          />
          <m.div
            className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-primary/10 to-purple/5 blur-3xl"
            animate={isHeroInView ? { x: [0, -80, 0], y: [0, -40, 0] } : {}}
            transition={{ duration: 3, repeat: 2, ease: 'easeInOut', delay: 0.5 }}
          />
        </div>

        {/* Bottom fade */}
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple/10 to-purple/5 border border-purple/15">
                <Crown className="w-4 h-4 text-purple" />
                <span className="text-base font-medium text-purple">
                  Programme Ambassadeur
                </span>
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
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-purple to-purple/60 mb-6"
                style={{ boxShadow: 'var(--shadow-glow-purple)' }}
              >
                <Star className="w-10 h-10 text-white" />
              </div>
            </m.div>

            {/* Title */}
            <m.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4, ease }}
              className="text-lg md:text-xl font-bold text-text-primary mb-4"
            >
              Deviens{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple to-primary">
                Ambassadeur Squad Planner
              </span>
            </m.h1>

            {/* Subtitle */}
            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4, ease }}
              className="text-md md:text-lg text-text-secondary max-w-2xl mx-auto"
            >
              T'es streamer, créateur de contenu ou capitaine de communauté gaming ? On a une offre pour toi.
              Partage Squad Planner avec ta communauté et gagne des récompenses exclusives.
            </m.p>
          </div>
        </div>
      </div>

      {/* ─── AVANTAGES SECTION ─── */}
      <div className="mx-auto max-w-4xl px-4 md:px-6 lg:px-8 -mt-14 pb-8 relative z-10">
        <m.div
          ref={advantagesRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isAdvantagesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5, ease }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-8">
            Les avantages d'être ambassadeur
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Gamepad2,
                title: 'Squad Leader gratuit à vie',
                description: 'Accès complet au forfait premium Squad Leader sans fin',
                color: 'primary',
              },
              {
                icon: Gift,
                title: 'Commission 20% sur chaque abonné',
                description: 'Gagne 20% de commission sur tous les parrainages que tu génères',
                color: 'success',
              },
              {
                icon: Award,
                title: 'Badge Ambassadeur exclusif',
                description: 'Badge mis en avant sur ton profil et tes sessions',
                color: 'warning',
              },
              {
                icon: TrendingUp,
                title: 'Mise en avant Discover',
                description: 'Ton profil mis en avant sur la page Discover pour augmenter ta visibilité',
                color: 'purple',
              },
            ].map((item, i) => {
              const Icon = item.icon
              const colorMap = {
                primary: { bg: 'bg-primary/10', text: 'text-primary', glow: 'var(--shadow-glow-primary-sm)' },
                success: { bg: 'bg-success/10', text: 'text-success', glow: 'var(--shadow-glow-success)' },
                warning: { bg: 'bg-warning/10', text: 'text-warning', glow: 'var(--shadow-glow-warning)' },
                purple: { bg: 'bg-purple/10', text: 'text-purple', glow: 'var(--shadow-glow-purple)' },
              }
              const c = colorMap[item.color as keyof typeof colorMap]
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isAdvantagesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease }}
                  whileHover={{ y: -4, boxShadow: c.glow }}
                >
                  <Card variant="elevated" className="p-6 h-full">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${c.bg} mb-4`}>
                      <Icon className={`w-6 h-6 ${c.text}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </Card>
                </m.div>
              )
            })}
          </div>
        </m.div>

        {/* ─── HOW IT WORKS ─── */}
        <m.div
          ref={stepsRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isStepsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-12">
            Comment ça marche
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              {
                step: 1,
                title: 'Postule',
                description: 'Remplis le formulaire ci-dessous avec tes infos',
                icon: Users,
              },
              {
                step: 2,
                title: 'On te contacte',
                description: 'Appel de 15 min pour te présenter l\'app et répondre à tes questions',
                icon: Mic,
              },
              {
                step: 3,
                title: 'Tu partages',
                description: 'Ton code promo perso, tes assets marketing, c\'est parti !',
                icon: TrendingUp,
              },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <m.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  animate={isStepsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease }}
                  className="relative"
                >
                  {/* Arrow connector (hidden on mobile) */}
                  {i < 2 && (
                    <div className="hidden md:block absolute top-12 left-1/2 w-1/2 h-1 bg-gradient-to-r from-primary/30 to-transparent" />
                  )}
                  <Card variant="default" className="p-6 text-center h-full">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 mb-4">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                    <p className="text-sm text-text-secondary">{item.description}</p>
                  </Card>
                </m.div>
              )
            })}
          </div>
        </m.div>

        {/* ─── PROFILS RECHERCHÉS ─── */}
        <m.div
          ref={profilesRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isProfilesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          className="mb-16"
        >
          <Card variant="elevated" className="p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Les profils qu'on recherche</h2>
            <div className="space-y-4">
              {[
                'Streamers Twitch/YouTube FR avec 1K-50K viewers',
                'Créateurs de contenu gaming (TikTok, Instagram, YouTube)',
                'Capitaines de communauté Discord avec 100+ membres',
                'Joueurs compétitifs avec une audience active',
              ].map((profile, i) => (
                <m.div
                  key={i}
                  initial={{ opacity: 0, x: -15 }}
                  animate={isProfilesInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -15 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.3, ease }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 shrink-0">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-text-secondary">{profile}</span>
                </m.div>
              ))}
            </div>
          </Card>
        </m.div>

        {/* ─── APPLICATION FORM ─── */}
        <m.div
          ref={formRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isFormInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.4, duration: 0.5, ease }}
          className="mb-16"
        >
          <Card variant="elevated" className="p-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Candidature</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pseudo */}
              <div>
                <label htmlFor="pseudo" className="block text-sm font-medium text-text-primary mb-2">
                  Pseudo / Nom
                </label>
                <input
                  type="text"
                  id="pseudo"
                  name="pseudo"
                  value={formData.pseudo}
                  onChange={handleInputChange}
                  placeholder="Ex: TwitchStreameur"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
                />
              </div>

              {/* Platform */}
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-text-primary mb-2">
                  Plateforme
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary focus:outline-none focus:border-primary transition-interactive"
                >
                  <option value="Twitch">Twitch</option>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Discord">Discord</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              {/* Link */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-text-primary mb-2">
                  Lien vers ta chaîne / communauté
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://twitch.tv/..."
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
                />
              </div>

              {/* Followers */}
              <div>
                <label htmlFor="followers" className="block text-sm font-medium text-text-primary mb-2">
                  Nombre de followers / viewers moyens
                </label>
                <input
                  type="text"
                  id="followers"
                  name="followers"
                  value={formData.followers}
                  onChange={handleInputChange}
                  placeholder="Ex: 5000 followers, 500 viewers"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-text-primary mb-2">
                  Pourquoi Squad Planner ?
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Dis-nous pourquoi tu serais un super ambassadeur pour Squad Planner..."
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-surface-card border border-border-default text-text-primary placeholder-text-quaternary focus:outline-none focus:border-primary transition-interactive resize-none"
                />
              </div>

              {/* Submit Button */}
              <Button
                variant="primary"
                size="lg"
                type="submit"
                className="w-full"
                showSuccess={submitted}
              >
                {submitted ? (
                  <>
                    <Check className="h-4 w-4" />
                    Candidature envoyée !
                  </>
                ) : (
                  'Envoyer ma candidature'
                )}
              </Button>

              <p className="text-xs text-text-tertiary text-center">
                En soumettant ce formulaire, tu acceptes que nous te contactions à propos du programme.
              </p>
            </form>
          </Card>
        </m.div>

        {/* ─── FAQ SECTION ─── */}
        <m.div
          ref={faqRef}
          initial={{ opacity: 0, y: 20 }}
          animate={isFaqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.5, duration: 0.5, ease }}
          className="mb-16"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'C\'est quoi un ambassadeur Squad Planner ?',
                a: 'Un ambassadeur est une personne influente qui représente Squad Planner auprès de sa communauté. Tu reçois des outils marketing, un code promo unique et tu construis ton revenu passif en recommandant Squad Planner à tes followers.',
              },
              {
                q: 'Comment fonctionne la commission ?',
                a: 'Tu reçois une commission de 20% pour chaque nouvel utilisateur qui s\'inscrit via ton code promo unique. Si cet utilisateur passe Premium, tu reçois un mois Squad Leader gratuit en plus.',
              },
              {
                q: 'Je peux cumuler avec le parrainage normal ?',
                a: 'Oui ! En tant qu\'ambassadeur, tu gardes accès au programme de parrainage standard (7 jours Premium pour chaque ami). La commission ambassadeur s\'ajoute à cela.',
              },
              {
                q: 'C\'est obligatoire d\'être un gros streamer ?',
                a: 'Non ! On recherche aussi des créateurs de contenu plus petits ou des capitaines de communauté motivés. Ce qui compte, c\'est ta passion pour le gaming et ton engagement envers ta communauté.',
              },
              {
                q: 'Quels outils marketing allez-vous me donner ?',
                a: 'Tu recevras des assets visuels (bannières, clips), du texte marketing pré-écrit, des graphiques, et un support dédié de notre équipe pour maximiser ton succès.',
              },
              {
                q: 'Comment on reste en contact ?',
                a: 'Après ta candidature approuvée, on te contacte pour un appel de 15 minutes. Ensuite, tu rejoins notre communauté Discord ambassadeurs pour rester connecté et partager tes résultats.',
              },
            ].map((faq, i) => (
              <m.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={isFaqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ delay: 0.55 + i * 0.05, duration: 0.3, ease }}
              >
                <Card variant="default" className="p-5">
                  <h3 className="font-semibold text-text-primary mb-2 flex items-start gap-2">
                    <span className="text-primary mt-0.5">?</span>
                    {faq.q}
                  </h3>
                  <p className="text-sm text-text-secondary">{faq.a}</p>
                </Card>
              </m.div>
            ))}
          </div>
        </m.div>

        {/* ─── CONTACT EMAIL ─── */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={isFaqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.8, duration: 0.5, ease }}
          className="text-center p-8 bg-gradient-to-br from-primary/10 to-purple/5 rounded-2xl border border-primary/10"
        >
          <p className="text-text-secondary mb-4">D'autres questions ?</p>
          <p className="text-text-primary font-semibold mb-4">Contacte-nous directement :</p>
          <div className="flex items-center justify-center gap-2">
            <code className="px-4 py-2 rounded-lg bg-surface-card border border-border-default text-text-primary font-mono">
              ambassadeur@squadplanner.fr
            </code>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyEmail}
              leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            >
              {copied ? 'Copié !' : 'Copier'}
            </Button>
          </div>
        </m.div>

        {/* ─── FINAL CTA ─── */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={isFaqInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 0.9, duration: 0.5, ease }}
          className="text-center py-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Rejoins le programme et fais grandir ta communauté
          </h2>
          <p className="text-lg text-text-secondary max-w-xl mx-auto mb-6">
            Deviens ambassadeur Squad Planner et transforme ta passion gaming en opportunité de revenus.
          </p>
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ChevronRight className="h-5 w-5" />}
            onClick={() => {
              formRef.current?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            Candidater maintenant
          </Button>
        </m.div>
      </div>
    </PublicPageShell>
  )
}

export default Ambassador
