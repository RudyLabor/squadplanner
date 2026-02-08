import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import {
  Users, Calendar, ArrowRight, Check, X as XIcon,
  Target, MessageCircle, Headphones, TrendingUp, Sparkles,
  HelpCircle, FileText, Shield
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { SquadPlannerLogo } from '../components/SquadPlannerLogo'
import { useAuthStore } from '../hooks'
import { scrollReveal, springTap, scrollRevealLight, scaleReveal } from '../utils/animations'

// Stagger animations for lists
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

// Les 3 PILIERS principaux (grandes cartes)
const pillars = [
  {
    icon: Headphones,
    title: 'Party vocale 24/7',
    description: 'Ta squad a son salon vocal toujours ouvert. Rejoins en 1 clic, reste aussi longtemps que tu veux.',
    color: '#34d399'
  },
  {
    icon: Calendar,
    title: 'Planning avec décision',
    description: 'Propose un créneau. Chacun répond OUI ou NON. Fini les "on verra" — on sait qui vient.',
    color: '#f5a623'
  },
  {
    icon: Target,
    title: 'Fiabilité mesurée',
    description: 'Check-in à chaque session. Ton score montre si tu tiens parole. Tes potes comptent sur toi.',
    color: '#f87171'
  }
]

const stats = [
  { value: '100%', label: 'gratuit pour commencer' },
  { value: '30s', label: 'pour créer ta squad' },
  { value: '0', label: 'excuse pour ne pas jouer' },
]

const steps = [
  {
    step: '1',
    title: 'Crée ta Squad',
    description: 'Donne un nom, choisis ton jeu. Ta squad a direct sa party vocale et son chat.',
    icon: Users
  },
  {
    step: '2',
    title: 'Invite tes potes',
    description: 'Partage le code. Ils rejoignent en 10 secondes. Tout le monde au même endroit.',
    icon: MessageCircle
  },
  {
    step: '3',
    title: 'Planifie, décide, confirme',
    description: 'Propose un créneau. Chacun répond OUI ou NON. Plus de "on verra".',
    icon: Calendar
  },
  {
    step: '4',
    title: 'Jouez chaque semaine',
    description: 'Check-in, jouez, répétez. Semaine après semaine, votre squad devient fiable.',
    icon: Target
  }
]

// Comparaison vs Discord - données
const comparisons = [
  { feature: 'Planning de sessions avec RSVP', discord: false, squad: true },
  { feature: 'Score de fiabilité par joueur', discord: false, squad: true },
  { feature: 'Check-in présence réelle', discord: false, squad: true },
  { feature: 'Coach IA personnalisé', discord: false, squad: true },
  { feature: 'Party vocale dédiée', discord: true, squad: true },
  { feature: 'Chat de squad', discord: true, squad: true },
  { feature: 'Gamification (XP, challenges)', discord: 'partial', squad: true },
]

export default function Landing() {
  const heroRef = useRef(null)
  useInView(heroRef, { once: true })
  const { user } = useAuthStore()
  const { scrollYProgress } = useScroll()
  const heroRotateX = useTransform(scrollYProgress, [0, 0.15], [0, 8])
  const heroRotateY = useTransform(scrollYProgress, [0, 0.1, 0.2], [-2, 0, 2])

  // Determine if user is logged in for different header buttons
  const isLoggedIn = !!user

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Scroll Progress */}
      <motion.div
        className="scroll-progress"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Header Sticky */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 bg-bg-base/80 backdrop-blur-lg border-b border-border-subtle">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <SquadPlannerLogo size={24} />
            <span className="text-[15px] font-semibold text-text-primary">Squad Planner</span>
          </Link>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link to="/home">
                <button className="px-4 py-2 rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary-hover transition-colors duration-300">
                  Aller à l'app
                </button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <button className="px-4 py-2 text-[14px] text-text-tertiary hover:text-text-primary transition-colors">
                    Se connecter
                  </button>
                </Link>
                <Link to="/auth?mode=register&redirect=onboarding">
                  <button className="px-4 py-2 rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-primary-hover transition-colors duration-300">
                    Créer ma squad
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden pt-20 noise-overlay">
        {/* Background mesh gradient */}
        <div className="absolute inset-0 mesh-gradient-hero" />

        <div className="relative px-4 md:px-6 py-12 md:py-20 max-w-5xl mx-auto">
          <div className="text-center">
            {/* Badge with sparkle */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/6 border border-primary/12 mb-8">
              <Sparkles className="w-4 h-4 text-purple" />
              <span className="text-[13px] text-purple font-medium">Rassemble ta squad et jouez ensemble</span>
            </div>

            {/* Headline - improved wording */}
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Transforme<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6366f1] via-[#a78bfa] to-[#34d399]">
                "on verra"
              </span><br />
              en "on y est"
            </h1>

            {/* Subtitle - improved */}
            <p className="text-lg md:text-xl text-text-tertiary mb-10 max-w-2xl mx-auto">
              Squad Planner fait que vos sessions ont vraiment lieu.
              <span className="text-text-primary font-medium"> Ta squad t'attend.</span>
            </p>

            {/* CTA */}
            <div className="flex flex-col items-center gap-4 mb-16">
              {isLoggedIn ? (
                <Link to="/home">
                  <motion.button
                    className="flex items-center gap-2 h-14 px-8 rounded-xl bg-[#6366f1] text-white text-[16px] font-semibold shadow-lg shadow-[#6366f1]/10"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    Accéder à mes squads
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              ) : (
                <>
                  <Link to="/auth?mode=register&redirect=onboarding">
                    <motion.button
                      className="flex items-center gap-2 h-14 px-8 rounded-xl bg-[#6366f1] text-white text-[16px] font-semibold shadow-lg shadow-[#6366f1]/10"
                      whileHover={{ scale: 1.02, y: -2 }}
                      {...springTap}
                    >
                      Créer ma squad gratuitement
                      <ArrowRight className="w-5 h-5" />
                    </motion.button>
                  </Link>
                  <Link to="/auth" className="text-[14px] text-text-quaternary hover:text-text-tertiary transition-colors">
                    Déjà un compte ? Se connecter
                  </Link>
                </>
              )}
            </div>

            {/* Social proof stats */}
            <div className="flex items-center justify-center gap-8 md:gap-16 mb-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-text-primary">{stat.value}</div>
                  <div className="text-[12px] md:text-[13px] text-text-quaternary">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Social proof badge */}
            <div className="flex items-center justify-center gap-2 text-[13px] text-text-quaternary">
              <span className="inline-block w-2 h-2 rounded-full bg-[#34d399] animate-pulse" />
              <span>Beta ouverte — Rejoins les premiers gamers</span>
            </div>
          </div>

          {/* App Preview Mockup with subtle animation */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 mx-auto max-w-lg"
          >
            <motion.div
              className="relative"
              style={{ rotateX: heroRotateX, rotateY: heroRotateY, perspective: 1000 }}
            >
              {/* Phone frame */}
              <div className="bg-[#101012] rounded-[2.5rem] p-3 border border-[rgba(255,255,255,0.08)] shadow-2xl shadow-[#6366f1]/10">
                {/* Screen */}
                <div className="bg-[#050506] rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 py-2 text-xs text-text-quaternary">
                    <span>21:00</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 rounded-sm border border-[#5e6063]">
                        <div className="w-3 h-1.5 bg-[#34d399] rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* App content */}
                  <div className="px-4 pb-6">
                    {/* Session card */}
                    <div className="bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.12)] rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#6366f1] flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-text-primary">Session Valorant</div>
                            <div className="text-xs text-text-quaternary">Ce soir, 21h00</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-[#34d399]/20 text-xs text-[#34d399] font-medium">
                          Confirmée
                        </span>
                      </div>

                      {/* Members */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {['#6366f1', '#34d399', '#f5a623', '#f87171'].map((color, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full border-2 border-[#050506] flex items-center justify-center text-xs font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {['M', 'L', 'K', 'J'][i]}
                            </div>
                          ))}
                        </div>
                        <span className="text-[12px] text-text-tertiary">4/5 présents</span>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Fiabilité', value: '94%', color: '#34d399' },
                        { label: 'Sessions', value: '12', color: '#6366f1' },
                        { label: 'Squad', value: '5', color: '#f5a623' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-surface-card rounded-xl p-3 text-center">
                          <div className="text-[16px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                          <div className="text-xs text-text-quaternary">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)] -z-10" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 md:px-6 py-16 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={scrollRevealLight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Le problème que tu connais trop bien
            </h2>
            <p className="text-text-tertiary text-lg">
              T'as des amis. T'as Discord. T'as des jeux. Mais vous jouez jamais ensemble.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-4"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              { emoji: '💬', text: '"On joue ce soir ?" → Personne ne répond' },
              { emoji: '🤷', text: '"Je sais pas, on verra" → Rien ne se passe' },
              { emoji: '👻', text: 'Session prévue → 2 mecs sur 5 se connectent' },
              { emoji: '😤', text: 'Résultat → Plus personne n\'organise rien' },
            ].map((item) => (
              <motion.div
                key={item.text}
                variants={staggerItemVariants}
                className="flex items-center gap-4 p-4 rounded-xl bg-surface-card border border-border-subtle"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-text-secondary">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works - REMONTÉ pour montrer que c'est simple */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(99,102,241,0.015)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Comment ça marche
            </h2>
            <p className="text-text-tertiary text-lg">
              En 4 étapes, ta squad joue régulièrement
            </p>
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step) => (
              <motion.div
                key={step.step}
                variants={staggerItemVariants}
                className="flex items-start gap-4 p-6 rounded-2xl bg-surface-card border border-border-default"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(99,102,241,0.1)] flex items-center justify-center shrink-0">
                  <span className="text-[18px] font-bold text-[#6366f1]">{step.step}</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-text-primary mb-1">{step.title}</h3>
                  <p className="text-[14px] text-text-tertiary">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution - Les 3 Piliers */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(99,102,241,0.015)]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Les 3 piliers de Squad Planner
            </h2>
            <p className="text-text-tertiary text-lg">
              Chacun résout un problème précis. Ensemble, ils font la différence.
            </p>
          </motion.div>

          {/* Les 3 PILIERS - Grandes cartes avec glow */}
          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-16"
            variants={staggerContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {pillars.map((pillar) => (
              <motion.div
                key={pillar.title}
                variants={staggerItemVariants}
                className="relative p-8 rounded-3xl border transition-interactive group"
                style={{
                  backgroundColor: `${pillar.color}08`,
                  borderColor: `${pillar.color}25`
                }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {/* Glow effect on hover */}
                <div
                  className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                  style={{ boxShadow: `0 0 30px ${pillar.color}15, 0 0 60px ${pillar.color}08` }}
                />
                <motion.div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${pillar.color}20` }}
                  whileHover={{ rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <pillar.icon className="w-7 h-7" style={{ color: pillar.color }} />
                </motion.div>
                <h3 className="text-xl font-bold text-text-primary mb-3">{pillar.title}</h3>
                <p className="text-[15px] text-text-tertiary leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Voice & Chat Highlight - Détails avec mockup */}
      <section className="px-4 md:px-6 py-16 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Voice Card */}
            <motion.div
              className="p-8 rounded-3xl bg-gradient-to-br from-[rgba(52,211,153,0.08)] to-[rgba(52,211,153,0.01)] border border-[rgba(52,211,153,0.15)] group"
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[rgba(52,211,153,0.12)] flex items-center justify-center mb-6 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.15)] transition-shadow duration-500">
                <Headphones className="w-8 h-8 text-[#34d399]" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Party vocale toujours ouverte
              </h3>
              <p className="text-text-tertiary mb-4">
                Ta squad a son salon vocal 24/7. Pas besoin de planifier.
                <span className="text-[#34d399] font-medium"> Rejoins quand tu veux, reste aussi longtemps que tu veux.</span>
              </p>
              <ul className="space-y-2">
                {[
                  '1 squad = 1 party vocale dédiée',
                  'Rejoindre en 1 clic',
                  'Qualité HD, latence ultra-faible',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[14px] text-text-secondary">
                    <Check className="w-4 h-4 text-[#34d399]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Chat Card */}
            <motion.div
              className="p-8 rounded-3xl bg-gradient-to-br from-[rgba(96,165,250,0.08)] to-[rgba(96,165,250,0.01)] border border-[rgba(96,165,250,0.15)] group"
              whileHover={{ scale: 1.01, y: -2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <div className="w-16 h-16 rounded-2xl bg-[rgba(96,165,250,0.12)] flex items-center justify-center mb-6 group-hover:shadow-[0_0_20px_rgba(96,165,250,0.15)] transition-shadow duration-500">
                <MessageCircle className="w-8 h-8 text-[#60a5fa]" />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                Chat live avec ta squad
              </h3>
              <p className="text-text-tertiary mb-4">
                Discutez avant la session pour vous organiser. Pendant pour rigoler. Après pour le debrief.
                <span className="text-[#60a5fa] font-medium"> Tout est au même endroit.</span>
              </p>
              <ul className="space-y-2">
                {[
                  'Chat de squad permanent',
                  'Chat par session',
                  'Résumés IA automatiques',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[14px] text-text-secondary">
                    <Check className="w-4 h-4 text-[#60a5fa]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>

          {/* Party Vocale Mockup - Illustration visuelle */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative max-w-sm mx-auto mt-12"
          >
            {/* Glow background */}
            <div className="absolute -inset-8 bg-[radial-gradient(ellipse_at_center,rgba(52,211,153,0.08)_0%,transparent_70%)]" />

            {/* Phone frame */}
            <div className="relative bg-[#101012] rounded-[2rem] p-3 border border-[rgba(52,211,153,0.15)] shadow-2xl shadow-[#34d399]/5">
              <div className="bg-[#050506] rounded-[1.5rem] overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <motion.div
                        className="w-2.5 h-2.5 rounded-full bg-[#34d399]"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: 3, ease: "easeInOut" }}
                      />
                      <span className="text-[13px] font-semibold text-text-primary">Party vocale</span>
                    </div>
                    <span className="text-xs text-[#34d399]">En ligne</span>
                  </div>
                  <p className="text-xs text-text-quaternary mt-1">Les Ranked du Soir</p>
                </div>

                {/* Participants */}
                <div className="p-5">
                  <div className="flex items-center justify-center gap-3 mb-5">
                    {/* Avatar 1 - Speaking */}
                    <motion.div className="flex flex-col items-center">
                      <motion.div
                        className="relative"
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.2, repeat: 3, ease: "easeInOut" }}
                      >
                        <motion.div
                          className="absolute inset-0 w-12 h-12 rounded-full bg-[#34d399]"
                          animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
                          transition={{ duration: 1.5, repeat: 3, ease: "easeOut" }}
                        />
                        <div className="relative w-12 h-12 rounded-full bg-[#34d399] flex items-center justify-center text-base font-bold text-[#050506] ring-2 ring-[#34d399]/50">
                          M
                        </div>
                      </motion.div>
                      <span className="text-[10px] text-[#34d399] mt-1.5 font-medium">Max</span>
                    </motion.div>

                    {/* Avatar 2 */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-12 h-12 rounded-full bg-[#6366f1] flex items-center justify-center text-base font-bold text-white">
                        L
                      </div>
                      <span className="text-[10px] text-text-tertiary mt-1.5">Luna</span>
                    </div>

                    {/* Avatar 3 */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-12 h-12 rounded-full bg-[#f5a623] flex items-center justify-center text-base font-bold text-[#050506]">
                        K
                      </div>
                      <span className="text-[10px] text-text-tertiary mt-1.5">Kira</span>
                    </div>

                    {/* Avatar 4 */}
                    <div className="flex flex-col items-center">
                      <div className="relative w-12 h-12 rounded-full bg-[#a78bfa] flex items-center justify-center text-base font-bold text-white">
                        J
                      </div>
                      <span className="text-[10px] text-text-tertiary mt-1.5">Jay</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-3">
                    <motion.div
                      className="w-10 h-10 rounded-full bg-[#34d399] flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                      <Headphones className="w-4 h-4 text-[#050506]" />
                    </motion.div>
                    <div className="w-10 h-10 rounded-full bg-[#f87171] flex items-center justify-center">
                      <span className="text-sm">📞</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Discord comparison */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[14px] text-text-quaternary mt-8"
          >
            Plus qu'un simple Discord — Squad Planner crée des <span className="text-[#fafafa]">habitudes de jeu régulières</span> pour ta communauté
          </motion.p>
        </div>
      </section>

      {/* Reliability Score Section */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(248,113,113,0.02)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={scaleReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-surface-card border border-[rgba(248,113,113,0.2)]"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-2xl bg-[rgba(248,113,113,0.1)] flex items-center justify-center shrink-0">
                <TrendingUp className="w-12 h-12 text-[#f87171]" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-text-primary mb-3">
                  Score de fiabilité : tes potes comptent sur toi
                </h3>
                <p className="text-text-tertiary mb-4">
                  Chaque membre a un score basé sur sa présence réelle. Tu dis que tu viens ? On vérifie.
                  <span className="text-[#f87171] font-medium"> Les no-shows chroniques, ça se voit.</span>
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  {[
                    { label: 'Check-in obligatoire', icon: '✅' },
                    { label: 'Historique visible', icon: '📊' },
                    { label: 'Score par joueur', icon: '🏆' },
                  ].map(item => (
                    <span key={item.label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[rgba(248,113,113,0.1)] text-[13px] text-[#f87171]">
                      {item.icon} {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Comparison vs Discord */}
      <section className="px-4 md:px-6 py-16 border-t border-border-subtle">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              Plus qu'un Discord pour gamers
            </h2>
            <p className="text-text-tertiary text-lg">
              Discord est fait pour discuter. Squad Planner est fait pour <span className="text-text-primary font-medium">jouer ensemble</span>.
            </p>
          </motion.div>

          <motion.div
            className="overflow-hidden rounded-2xl border border-border-default"
            variants={scrollReveal}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Table header */}
            <div className="grid grid-cols-3 bg-bg-surface px-6 py-3 border-b border-border-subtle">
              <span className="text-[13px] font-medium text-text-secondary">Fonctionnalité</span>
              <span className="text-[13px] font-medium text-text-secondary text-center">Discord</span>
              <span className="text-[13px] font-medium text-primary text-center">Squad Planner</span>
            </div>

            {/* Table rows */}
            {comparisons.map((item, i) => (
              <motion.div
                key={item.feature}
                className={`grid grid-cols-3 items-center px-6 py-4 ${i < comparisons.length - 1 ? 'border-b border-border-subtle' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-[14px] text-text-primary">{item.feature}</span>
                <span className="flex justify-center">
                  {item.discord === true ? (
                    <Check className="w-5 h-5 text-success" />
                  ) : item.discord === 'partial' ? (
                    <span className="text-[12px] text-warning px-2 py-0.5 rounded-full bg-warning/10">Limité</span>
                  ) : (
                    <XIcon className="w-5 h-5 text-text-quaternary" />
                  )}
                </span>
                <span className="flex justify-center">
                  <Check className="w-5 h-5 text-success" />
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Final - Enhanced */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[rgba(99,102,241,0.08)] to-[rgba(99,102,241,0.01)] border border-[rgba(99,102,241,0.15)] text-center overflow-hidden"
          >
            {/* Animated glow background - limited repeats */}
            <motion.div
              className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_60%)]"
              animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
              transition={{ duration: 4, repeat: 2, ease: "easeInOut" }}
            />
            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: 2, ease: "easeInOut" }}
              >
                <Sparkles className="w-12 h-12 mx-auto mb-6 text-[#6366f1]" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                Ta squad t'attend
              </h2>
              <p className="text-text-tertiary mb-8">
                Gratuit, sans engagement. Lance ta première session en 30 secondes.
              </p>
              <Link to="/auth?mode=register&redirect=onboarding">
                <motion.button
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#a78bfa] text-white text-[16px] font-semibold mx-auto shadow-lg shadow-[#6366f1]/10"
                  whileHover={{ scale: 1.02, y: -2 }}
                  {...springTap}
                >
                  Rejoindre l'aventure
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer - Complete */}
      <footer className="px-4 md:px-6 py-16 border-t border-border-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Produit */}
            <div>
              <h4 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Produit</h4>
              <ul className="space-y-3">
                <li><Link to="/auth?mode=register&redirect=onboarding" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors">Créer ma squad</Link></li>
                <li><Link to="/premium" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors">Premium</Link></li>
                <li><a href="#features" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors">Fonctionnalités</a></li>
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Ressources</h4>
              <ul className="space-y-3">
                <li><Link to="/help" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5" />FAQ</Link></li>
                <li><a href="mailto:contact@squadplanner.fr" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors">Contact</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Légal</h4>
              <ul className="space-y-3">
                <li><Link to="/legal" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" />CGU</Link></li>
                <li><Link to="/legal?tab=privacy" className="text-[14px] text-text-tertiary hover:text-text-primary transition-colors flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" />Confidentialité</Link></li>
              </ul>
            </div>

            {/* Communauté */}
            <div>
              <h4 className="text-[13px] font-semibold text-text-primary mb-4 uppercase tracking-wider">Communauté</h4>
              <ul className="space-y-3">
                <li><span className="text-[14px] text-text-tertiary flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-success animate-pulse" />Beta ouverte</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-border-subtle pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <SquadPlannerLogo size={20} />
              <span className="text-[14px] font-semibold text-text-primary">Squad Planner</span>
            </div>
            <p className="text-[13px] text-text-quaternary">
              © 2026 Squad Planner. Jouez ensemble, pour de vrai.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
