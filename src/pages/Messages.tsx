import { motion } from 'framer-motion'
import { MessageCircle, Users, Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { theme } from '../lib/theme'

const containerVariants = theme.animation.container
const itemVariants = theme.animation.item

export function Messages() {
  return (
    <div className="min-h-screen bg-[#08090a] pb-8">
      <div className="px-4 md:px-6 py-6 max-w-2xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-2xl font-bold text-[#f7f8f8] mb-2">Messages</h1>
            <p className="text-[14px] text-[#8b8d90]">
              Discute avec ta squad, coordonnez-vous en temps réel
            </p>
          </motion.div>

          {/* Coming soon state with value proposition */}
          <motion.div variants={itemVariants}>
            <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-[#18191b] to-[#101012] border border-[rgba(255,255,255,0.06)] text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[rgba(94,109,210,0.2)] to-[rgba(139,147,255,0.1)] flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-8 h-8 text-[#5e6dd2]" strokeWidth={1.5} />
              </div>
              
              <h2 className="text-xl font-bold text-[#f7f8f8] mb-3">
                Chat intégré bientôt disponible
              </h2>
              
              <p className="text-[14px] text-[#8b8d90] mb-6 max-w-md mx-auto">
                Plus besoin de jongler entre Discord et Squad Planner.
                Tout sera au même endroit.
              </p>

              {/* Features preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: Users, title: 'Chat squad', desc: 'Discussion de groupe' },
                  { icon: MessageCircle, title: 'Chat session', desc: 'Avant et après la game' },
                  { icon: Sparkles, title: 'IA résumé', desc: 'Synthèse automatique' },
                ].map(feature => (
                  <Card key={feature.title} className="p-4 text-center">
                    <feature.icon className="w-6 h-6 mx-auto mb-2 text-[#5e6dd2]" />
                    <h3 className="text-[14px] font-medium text-[#f7f8f8]">{feature.title}</h3>
                    <p className="text-[12px] text-[#5e6063]">{feature.desc}</p>
                  </Card>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-col items-center gap-4">
                <p className="text-[13px] text-[#5e6063]">
                  En attendant, utilise Discord ou le chat en jeu
                </p>
                <Link to="/squads">
                  <Button variant="secondary">
                    <ArrowRight className="w-4 h-4" />
                    Retour aux Squads
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Explanation card */}
          <motion.div variants={itemVariants} className="mt-6">
            <Card className="p-6">
              <h3 className="text-[14px] font-semibold text-[#f7f8f8] mb-4">
                📖 Pourquoi un chat intégré ?
              </h3>
              <div className="space-y-3 text-[13px] text-[#8b8d90]">
                <p>
                  <span className="text-[#f7f8f8] font-medium">Le problème</span> : Tu dois ouvrir Discord pour organiser, 
                  puis revenir ici pour planifier. C'est trop de friction.
                </p>
                <p>
                  <span className="text-[#f7f8f8] font-medium">La solution</span> : Un chat directement lié à chaque session.
                  L'IA résume les discussions. Tu ne rates rien.
                </p>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
