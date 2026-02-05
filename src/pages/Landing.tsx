import { motion } from 'framer-motion'
import {
  Users, Calendar, ArrowRight,
  Target, Shield, MessageCircle, Headphones, TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { theme } from '../lib/theme'
import { SquadPlannerLogo, SquadPlannerIcon } from '../components/SquadPlannerLogo'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

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
    color: '#4ade80'
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

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#08090a]">
      {/* Header Sticky */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 bg-[#08090a]/80 backdrop-blur-lg border-b border-[rgba(255,255,255,0.04)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <SquadPlannerLogo size={24} />
            <span className="text-[15px] font-semibold text-[#f7f8f8]">Squad Planner</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <button className="px-4 py-2 text-[14px] text-[#8b8d90] hover:text-[#f7f8f8] transition-colors">
                Se connecter
              </button>
            </Link>
            <Link to="/auth?mode=register&redirect=onboarding">
              <button className="px-4 py-2 rounded-lg bg-[#5e6dd2] text-white text-[14px] font-medium hover:bg-[#6b7ae0] transition-colors">
                Créer ma squad
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(94,109,210,0.15)_0%,transparent_70%)]" />
        
        <div className="relative px-4 md:px-6 py-12 md:py-20 max-w-5xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(94,109,210,0.1)] border border-[rgba(94,109,210,0.2)] mb-8">
              <SquadPlannerIcon size={16} />
              <span className="text-[13px] text-[#8b93ff] font-medium">L'app qui fait que ça arrive vraiment</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold text-[#f7f8f8] mb-6 leading-tight"
            >
              Fini les<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5e6dd2] to-[#8b93ff]">
                "quand est-ce qu'on joue ?"
              </span><br />
              sans réponse
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-[#8b8d90] mb-10 max-w-2xl mx-auto"
            >
              Squad Planner transforme les "on verra" en sessions qui ont vraiment lieu.
              <span className="text-[#f7f8f8] font-medium"> Fini les plans qui tombent à l'eau.</span>
            </motion.p>

            {/* CTA */}
            <motion.div variants={itemVariants} className="flex flex-col items-center gap-4 mb-16">
              <Link to="/auth?mode=register&redirect=onboarding">
                <motion.button
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-[#5e6dd2] text-white text-[16px] font-semibold shadow-lg shadow-[#5e6dd2]/25"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Créer ma squad gratuitement
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/auth" className="text-[14px] text-[#5e6063] hover:text-[#8b8d90] transition-colors">
                Déjà un compte ? Se connecter
              </Link>
            </motion.div>

            {/* Social proof stats */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-8 md:gap-16 mb-8"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#f7f8f8]">{stat.value}</div>
                  <div className="text-[12px] md:text-[13px] text-[#5e6063]">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* Social proof badge */}
            <motion.div
              variants={itemVariants}
              className="flex items-center justify-center gap-2 text-[13px] text-[#5e6063]"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
              <span>Beta ouverte — Rejoins les premiers gamers</span>
            </motion.div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 mx-auto max-w-lg"
          >
            <div className="relative">
              {/* Phone frame */}
              <div className="bg-[#101012] rounded-[2.5rem] p-3 border border-[rgba(255,255,255,0.1)] shadow-2xl shadow-[#5e6dd2]/10">
                {/* Screen */}
                <div className="bg-[#08090a] rounded-[2rem] overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 py-2 text-[11px] text-[#5e6063]">
                    <span>21:00</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-2 rounded-sm border border-[#5e6063]">
                        <div className="w-3 h-1.5 bg-[#4ade80] rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* App content */}
                  <div className="px-4 pb-6">
                    {/* Session card */}
                    <div className="bg-[rgba(94,109,210,0.1)] border border-[rgba(94,109,210,0.2)] rounded-2xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#5e6dd2] flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[#f7f8f8]">Session Valorant</div>
                            <div className="text-[11px] text-[#5e6063]">Ce soir, 21h00</div>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full bg-[#4ade80]/20 text-[11px] text-[#4ade80] font-medium">
                          Confirmée
                        </span>
                      </div>

                      {/* Members */}
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {['#5e6dd2', '#4ade80', '#f5a623', '#f87171'].map((color, i) => (
                            <div
                              key={i}
                              className="w-7 h-7 rounded-full border-2 border-[#08090a] flex items-center justify-center text-[10px] font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {['M', 'L', 'K', 'J'][i]}
                            </div>
                          ))}
                        </div>
                        <span className="text-[12px] text-[#8b8d90]">4/5 présents</span>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Fiabilité', value: '94%', color: '#4ade80' },
                        { label: 'Sessions', value: '12', color: '#5e6dd2' },
                        { label: 'Squad', value: '5', color: '#f5a623' },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-[rgba(255,255,255,0.02)] rounded-xl p-3 text-center">
                          <div className="text-[16px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                          <div className="text-[10px] text-[#5e6063]">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-[radial-gradient(ellipse_at_center,rgba(94,109,210,0.15)_0%,transparent_70%)] -z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 md:px-6 py-16 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#f7f8f8] mb-4">
              Le problème que tu connais trop bien
            </h2>
            <p className="text-[#8b8d90] text-lg">
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
                className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[#c9cace]">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works - REMONTÉ pour montrer que c'est simple */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(94,109,210,0.02)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#f7f8f8] mb-4">
              Comment ça marche
            </h2>
            <p className="text-[#8b8d90] text-lg">
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
                className="flex items-start gap-4 p-6 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]"
              >
                <div className="w-12 h-12 rounded-xl bg-[rgba(94,109,210,0.15)] flex items-center justify-center shrink-0">
                  <span className="text-[18px] font-bold text-[#5e6dd2]">{step.step}</span>
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-1">{step.title}</h3>
                  <p className="text-[14px] text-[#8b8d90]">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution - Les 3 Piliers */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(94,109,210,0.02)]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#f7f8f8] mb-4">
              Les 3 piliers de Squad Planner
            </h2>
            <p className="text-[#8b8d90] text-lg">
              Chacun résout un problème précis. Ensemble, ils font la différence.
            </p>
          </motion.div>

          {/* Les 3 PILIERS - Grandes cartes */}
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
                className="p-8 rounded-3xl border transition-all duration-300 hover:scale-[1.02]"
                style={{
                  backgroundColor: `${pillar.color}08`,
                  borderColor: `${pillar.color}25`
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${pillar.color}20` }}
                >
                  <pillar.icon className="w-7 h-7" style={{ color: pillar.color }} />
                </div>
                <h3 className="text-xl font-bold text-[#f7f8f8] mb-3">{pillar.title}</h3>
                <p className="text-[15px] text-[#8b8d90] leading-relaxed">{pillar.description}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* Reliability Score Section */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(248,113,113,0.02)]">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-[rgba(255,255,255,0.02)] border border-[rgba(248,113,113,0.2)]"
          >
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-24 h-24 rounded-2xl bg-[rgba(248,113,113,0.1)] flex items-center justify-center shrink-0">
                <TrendingUp className="w-12 h-12 text-[#f87171]" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold text-[#f7f8f8] mb-3">
                  Score de fiabilité : tes potes comptent sur toi
                </h3>
                <p className="text-[#8b8d90] mb-4">
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

      {/* CTA Final */}
      <section className="px-4 md:px-6 py-16">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[rgba(94,109,210,0.1)] to-[rgba(94,109,210,0.02)] border border-[rgba(94,109,210,0.2)] text-center"
          >
            <Shield className="w-12 h-12 mx-auto mb-6 text-[#5e6dd2]" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#f7f8f8] mb-4">
              Prêt à jouer pour de vrai ?
            </h2>
            <p className="text-[#8b8d90] mb-8">
              Gratuit, sans engagement. Crée ta première squad en 30 secondes.
            </p>
            <Link to="/auth?mode=register&redirect=onboarding">
              <motion.button
                className="flex items-center gap-2 h-14 px-8 rounded-xl bg-[#5e6dd2] text-white text-[16px] font-semibold mx-auto shadow-lg shadow-[#5e6dd2]/25"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                Créer ma squad maintenant
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 md:px-6 py-8 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <SquadPlannerLogo size={20} />
            <span className="text-[14px] font-semibold text-[#f7f8f8]">Squad Planner</span>
          </div>
          <p className="text-[13px] text-[#5e6063]">
            © 2026 Squad Planner. Jouez ensemble, pour de vrai.
          </p>
        </div>
      </footer>
    </div>
  )
}
