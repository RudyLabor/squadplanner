import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'

export function PricingSection() {
  return (
    <section id="pricing" aria-label="Tarifs" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Tarifs simples, sans surprise
          </h2>
          <p className="text-text-tertiary text-md max-w-md mx-auto">
            Commence gratuitement. Passe Premium quand tu veux débloquer tout le potentiel.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl border border-border-default bg-bg-elevated"
          >
            <h3 className="text-xl font-bold text-text-primary mb-1">Gratuit</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-text-primary">0€</span>
              <span className="text-text-quaternary text-sm">/mois</span>
            </div>
            <p className="text-base text-text-tertiary mb-5">Tout ce qu'il faut pour jouer avec ta squad.</p>
            <ul className="space-y-2.5 mb-6">
              {['Squads illimitées', 'Sessions avec RSVP', 'Chat de squad', 'Score de fiabilité', 'Party vocale', 'Notifications push'].map(f => (
                <li key={f} className="flex items-center gap-2 text-base text-text-secondary">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/auth">
              <motion.button
                className="w-full py-3 rounded-xl border border-border-default text-text-primary text-md font-medium hover:bg-bg-hover transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Commencer gratuitement
              </motion.button>
            </Link>
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/8 to-transparent relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-sm font-bold rounded-bl-xl">
              POPULAIRE
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-1">Premium</h3>
            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-3xl font-bold text-text-primary">4,99€</span>
              <span className="text-text-quaternary text-sm">/mois</span>
            </div>
            <p className="text-base text-text-tertiary mb-5">Pour les squads qui veulent aller plus loin.</p>
            <ul className="space-y-2.5 mb-6">
              {['Tout le plan Gratuit', 'Coach IA avancé', 'Qualité audio HD', 'Historique illimité', 'Stats avancées', 'Badges exclusifs'].map(f => (
                <li key={f} className="flex items-center gap-2 text-base text-text-secondary">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/auth">
              <motion.button
                className="w-full py-3 rounded-xl bg-primary text-white text-md font-semibold hover:bg-primary-hover transition-colors shadow-glow-primary-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Essayer Premium
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
