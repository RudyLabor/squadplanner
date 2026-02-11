import { m } from 'framer-motion'
import { Check } from '../icons'
import { Link } from 'react-router-dom'

export function PricingSection() {
  return (
    <section id="pricing" aria-label="Tarifs" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Tarifs simples, sans surprise
          </h2>
          <p className="text-text-tertiary text-md max-w-md mx-auto">
            Commence gratuitement. Passe Premium quand tu veux débloquer tout le potentiel.
          </p>
        </m.div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free Plan */}
          <m.div
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
              {['2 squads gratuites', 'Sessions avec RSVP', 'Chat de squad', 'Score de fiabilité', 'Party vocale', 'Notifications push'].map(f => (
                <li key={f} className="flex items-center gap-2 text-base text-text-secondary">
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/auth">
              <m.button
                className="w-full py-3 rounded-xl border border-border-default text-text-primary text-md font-medium hover:bg-bg-hover transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                C'est parti — Gratuit
              </m.button>
            </Link>
          </m.div>

          {/* Premium Plan */}
          <m.div
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
              {['Tout le plan Gratuit', 'Squads illimitées', 'Coach IA avancé', 'Qualité audio HD', 'Historique illimité', 'Stats avancées', 'Badges exclusifs'].map(f => (
                <li key={f} className="flex items-center gap-2 text-base text-text-secondary">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link to="/auth">
              <m.button
                className="w-full py-3 rounded-xl bg-primary text-white text-md font-semibold hover:bg-primary-hover transition-colors shadow-glow-primary-sm"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Débloquer Premium
              </m.button>
            </Link>
          </m.div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-text-quaternary">
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            Données hébergées en France
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Chiffrement SSL
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Conforme RGPD
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            Paiement sécurisé Stripe
          </span>
        </div>
      </div>
    </section>
  )
}
