import { motion } from 'framer-motion'
import {
  Users, Calendar, Zap, Check, ArrowRight,
  Target, Shield, Sparkles, MessageCircle, Headphones, TrendingUp
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

const features = [
  {
    icon: Headphones,
    title: 'Party vocale 24/7',
    description: 'Ta squad a son salon vocal toujours ouvert. Rejoins en 1 clic, reste aussi longtemps que tu veux.',
    color: '#4ade80'
  },
  {
    icon: Calendar,
    title: 'Planning avec décision',
    description: 'Propose un créneau. Chacun répond. Fini les "on verra" — on sait qui vient.',
    color: '#f5a623'
  },
  {
    icon: Target,
    title: 'Score de fiabilité',
    description: 'Check-in à chaque session. Ton score montre si tu es fiable. Pression sociale douce, résultats concrets.',
    color: '#f87171'
  },
  {
    icon: MessageCircle,
    title: 'Chat live',
    description: 'Discute avec ta squad en temps réel. Avant, pendant et après la session.',
    color: '#60a5fa'
  },
  {
    icon: Users,
    title: 'Squads organisées',
    description: 'Crée ta squad, invite tes amis avec un simple code. Tout le monde au même endroit.',
    color: '#5e6dd2'
  },
  {
    icon: Sparkles,
    title: 'IA Coach',
    description: 'L\'IA suggère les meilleurs créneaux et détecte les risques de no-show.',
    color: '#8b93ff'
  }
]

const stats = [
  { value: '+92%', label: 'de présence réelle' },
  { value: '3x', label: 'plus de sessions jouées' },
  { value: '-70%', label: 'de no-shows' },
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
    title: 'Crée l\'habitude',
    description: 'Check-in, jouez, répétez. Semaine après semaine, votre squad devient fiable.',
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
              <span className="text-[13px] text-[#8b93ff] font-medium">Crée l'habitude de jouer ensemble</span>
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
              Squad Planner transforme les intentions molles en habitudes concrètes.
              <span className="text-[#f7f8f8] font-medium"> Ta squad joue vraiment, chaque semaine.</span>
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
              Les 3 piliers de Squad Planner
            </h2>
            <p className="text-[#8b8d90] text-lg">
              Party vocale + Planning clair + Fiabilité mesurée = Habitude de jeu
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
                🎙️ Party vocale toujours ouverte
              </h3>
              <p className="text-[#8b8d90] mb-4">
                Ta squad a son salon vocal 24/7. Pas besoin de planifier.
                <span className="text-[#4ade80] font-medium"> Rejoins quand tu veux, reste aussi longtemps que tu veux.</span>
              </p>
              <ul className="space-y-2">
                {[
                  '1 squad = 1 party vocale dédiée',
                  'Rejoindre en 1 clic',
                  'Qualité HD, latence ultra-faible',
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
            💡 Pas un Discord alternatif — Squad Planner crée des <span className="text-[#f7f8f8]">habitudes de jeu</span>, pas des communautés
          </motion.p>
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
                  Score de fiabilité : la pression sociale qui marche
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
              Prêt à créer l'habitude ?
            </h2>
            <p className="text-[#8b8d90] mb-8">
              Gratuit pour commencer. Ta squad joue chaque semaine, pour de vrai.
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
