import { motion } from 'framer-motion'
import { 
  Users, Calendar, Zap, Check, ArrowRight, 
  Target, Shield, Sparkles, MessageCircle, Mic, Headphones
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

const features = [
  {
    icon: Users,
    title: 'Squads organisées',
    description: 'Crée ta squad, invite tes amis avec un simple code. Fini les groupes Discord désorganisés.',
    color: '#5e6dd2'
  },
  {
    icon: Calendar,
    title: 'Sessions confirmées',
    description: 'Chacun répond : présent, absent ou peut-être. Plus de "on verra".',
    color: '#f5a623'
  },
  {
    icon: Mic,
    title: 'Vocal in-app',
    description: 'Rejoins le vocal directement depuis l\'app. Qualité HD, zéro friction.',
    color: '#4ade80'
  },
  {
    icon: MessageCircle,
    title: 'Chat live',
    description: 'Discute avec ta squad en temps réel. Avant, pendant et après la session.',
    color: '#60a5fa'
  },
  {
    icon: Check,
    title: 'Check-in réel',
    description: 'À l\'heure de la session, confirme ta présence. On sait qui est fiable.',
    color: '#f87171'
  },
  {
    icon: Sparkles,
    title: 'IA Native',
    description: 'L\'IA suggère les meilleurs créneaux et détecte les risques de no-show.',
    color: '#8b93ff'
  }
]

const stats = [
  { value: '+92%', label: 'taux de présence' },
  { value: '-70%', label: 'de no-shows' },
  { value: '2min', label: 'pour planifier' },
]

const steps = [
  {
    step: '1',
    title: 'Crée ta Squad',
    description: 'Donne un nom, choisis ton jeu principal, et génère un code d\'invitation unique.',
    icon: Users
  },
  {
    step: '2',
    title: 'Invite tes potes',
    description: 'Partage le code. Ils rejoignent en 10 secondes, sans inscription complexe.',
    icon: MessageCircle
  },
  {
    step: '3',
    title: 'Planifie une session',
    description: 'Propose un créneau. Chacun répond. L\'IA te dit si c\'est risqué.',
    icon: Calendar
  },
  {
    step: '4',
    title: 'Jouez ensemble',
    description: 'Check-in à l\'heure, jouez, et construisez votre historique de fiabilité.',
    icon: Target
  }
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#08090a]">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
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
              <Zap className="w-4 h-4 text-[#f5a623]" />
              <span className="text-[13px] text-[#8b93ff] font-medium">IA Native • Le futur du gaming social</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl md:text-6xl font-bold text-[#f7f8f8] mb-6 leading-tight"
            >
              Transforme tes<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5e6dd2] to-[#8b93ff]">
                "on joue un jour"
              </span><br />
              en sessions réelles
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-lg md:text-xl text-[#8b8d90] mb-10 max-w-2xl mx-auto"
            >
              Squad Planner tue le "on verra". Crée ta squad, planifie, confirme, joue. 
              <span className="text-[#f7f8f8] font-medium"> Zéro friction, zéro excuse.</span>
            </motion.p>

            {/* CTA */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/auth?mode=register">
                <motion.button
                  className="flex items-center gap-2 h-14 px-8 rounded-xl bg-[#5e6dd2] text-white text-[16px] font-semibold shadow-lg shadow-[#5e6dd2]/25"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Créer ma squad gratuitement
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <Link to="/auth">
                <Button variant="secondary" size="lg">
                  J'ai déjà un compte
                </Button>
              </Link>
            </motion.div>

            {/* Social proof stats */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center justify-center gap-8 md:gap-16"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-[#f7f8f8]">{stat.value}</div>
                  <div className="text-[12px] md:text-[13px] text-[#5e6063]">{stat.label}</div>
                </div>
              ))}
            </motion.div>
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

          <div className="grid md:grid-cols-2 gap-4">
            {[
              { emoji: '💬', text: '"On joue ce soir ?" → Personne ne répond' },
              { emoji: '🤷', text: '"Je sais pas, on verra" → Rien ne se passe' },
              { emoji: '👻', text: 'Session prévue → 2 mecs sur 5 se connectent' },
              { emoji: '😤', text: 'Résultat → Plus personne n\'organise rien' },
            ].map((item) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]"
              >
                <span className="text-2xl">{item.emoji}</span>
                <span className="text-[#c9cace]">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution - Features */}
      <section className="px-4 md:px-6 py-16 bg-gradient-to-b from-transparent to-[rgba(94,109,210,0.02)]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-[#f7f8f8] mb-4">
              La solution : Squad Planner
            </h2>
            <p className="text-[#8b8d90] text-lg">
              Un système qui force l'engagement et récompense la fiabilité
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] transition-colors"
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${feature.color}15` }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3 className="text-[16px] font-semibold text-[#f7f8f8] mb-2">{feature.title}</h3>
                <p className="text-[14px] text-[#8b8d90] leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Voice & Chat Highlight */}
      <section className="px-4 md:px-6 py-16 border-t border-[rgba(255,255,255,0.04)]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6"
          >
            {/* Voice Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[rgba(74,222,128,0.1)] to-[rgba(74,222,128,0.02)] border border-[rgba(74,222,128,0.2)]">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(74,222,128,0.15)] flex items-center justify-center mb-6">
                <Headphones className="w-8 h-8 text-[#4ade80]" />
              </div>
              <h3 className="text-xl font-bold text-[#f7f8f8] mb-3">
                🎙️ Chat vocal intégré
              </h3>
              <p className="text-[#8b8d90] mb-4">
                Plus besoin de Discord. Rejoins le vocal de la session en un clic. 
                <span className="text-[#4ade80] font-medium"> Qualité HD, latence ultra-faible.</span>
              </p>
              <ul className="space-y-2">
                {[
                  'Vocal par session ou squad',
                  'Rejoindre en 1 clic',
                  'Push-to-talk ou voix continue',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[14px] text-[#c9cace]">
                    <Check className="w-4 h-4 text-[#4ade80]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[rgba(96,165,250,0.1)] to-[rgba(96,165,250,0.02)] border border-[rgba(96,165,250,0.2)]">
              <div className="w-16 h-16 rounded-2xl bg-[rgba(96,165,250,0.15)] flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-[#60a5fa]" />
              </div>
              <h3 className="text-xl font-bold text-[#f7f8f8] mb-3">
                💬 Chat live avec ta squad
              </h3>
              <p className="text-[#8b8d90] mb-4">
                Discutez avant la session pour vous organiser. Pendant pour rigoler. Après pour le debrief.
                <span className="text-[#60a5fa] font-medium"> Tout est au même endroit.</span>
              </p>
              <ul className="space-y-2">
                {[
                  'Chat de squad permanent',
                  'Chat par session',
                  'Résumés IA automatiques',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-[14px] text-[#c9cace]">
                    <Check className="w-4 h-4 text-[#60a5fa]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Discord comparison */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-[14px] text-[#5e6063] mt-8"
          >
            💡 Discord optionnel — Squad Planner est <span className="text-[#f7f8f8]">100% autonome</span>
          </motion.p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 md:px-6 py-16">
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

          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
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
          </div>
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
              Gratuit pour commencer. Premium quand ta squad devient sérieuse.
            </p>
            <Link to="/auth?mode=register">
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
            <Zap className="w-5 h-5 text-[#5e6dd2]" />
            <span className="text-[14px] font-semibold text-[#f7f8f8]">Squad Planner</span>
          </div>
          <p className="text-[13px] text-[#5e6063]">
            © 2026 Squad Planner. Le Calendly du gaming.
          </p>
        </div>
      </footer>
    </div>
  )
}
