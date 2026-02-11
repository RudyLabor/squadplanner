import { m } from 'framer-motion'
import { ArrowRight, Sparkles } from '../icons'
import { Link } from 'react-router-dom'
import { springTap } from '../../utils/animations'

export function CtaSection() {
  return (
    <section aria-label="Appel à l'action" className="px-4 md:px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <m.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-b from-primary/10 to-cyan-500/[0.04] border border-primary/15 text-center overflow-hidden"
        >
          <m.div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-10)_0%,transparent_60%)]"
            animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative z-10">
            <m.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Sparkles className="w-12 h-12 mx-auto mb-6 text-primary" aria-hidden="true" />
            </m.div>
            <h2 className="text-xl md:text-3xl font-bold text-text-primary mb-4">
              Prêt à jouer vraiment ?
            </h2>
            <p className="text-text-tertiary mb-8 text-lg">
              Gratuit, sans engagement. Lance ta première session en 30 secondes.
            </p>
            <m.div whileHover={{ scale: 1.03, y: -3 }} {...springTap} className="inline-flex">
              <Link to="/auth?mode=register&redirect=onboarding" className="flex items-center gap-2 h-16 px-10 rounded-xl bg-gradient-to-r from-primary to-purple text-white text-xl font-bold mx-auto shadow-lg shadow-primary/20 cta-glow-idle" data-track="bottom_cta_click">
                Créer ma squad maintenant
                <ArrowRight className="w-5 h-5" />
              </Link>
            </m.div>
            <p className="text-base text-text-quaternary mt-4">
              Gratuit · Pas de carte bancaire · 30 secondes
            </p>
            <a
              href="mailto:contact@squadplanner.fr"
              className="inline-block mt-4 py-2 text-base text-text-quaternary hover:text-text-tertiary transition-colors underline underline-offset-2 min-h-[44px]"
            >
              Une question ? Contacte-nous
            </a>
          </div>
        </m.div>
      </div>
    </section>
  )
}
