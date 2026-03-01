import { Link } from 'react-router'
import { m } from 'framer-motion'
import { Home, Gamepad2, ArrowLeft, Search, Compass, HelpCircle } from '../components/icons'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <main className="min-h-0 bg-bg-base mesh-bg pb-6" aria-label="Page introuvable">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          {/* Animated 404 icon — visible by default, animation is progressive enhancement */}
          <m.div
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-15 to-purple/[0.08] flex items-center justify-center mx-auto mb-6 opacity-100"
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <m.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Gamepad2 className="w-12 h-12 text-primary" />
            </m.div>
          </m.div>

          {/* Title — always visible */}
          <h1 className="text-4xl font-bold text-text-primary mb-3">404</h1>

          {/* Message — always visible */}
          <p className="text-lg font-semibold text-text-primary mb-2">
            Oups, cette page n'existe pas !
          </p>

          <p className="text-base text-text-secondary mb-8">
            Elle a peut-être été déplacée ou supprimée.
          </p>

          {/* Action buttons — always visible */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            <Link to="/">
              <Button type="button" className="w-full sm:w-auto">
                <Home className="w-4 h-4" />
                Retour à l'accueil
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Page précédente
            </Button>
          </div>

          {/* Page suggestions */}
          <div className="border-t border-border-subtle pt-6">
            <p className="text-sm text-text-tertiary mb-4">Pages populaires</p>
            <div className="flex flex-wrap justify-center gap-3">
              {[
                { to: '/discover', icon: Compass, label: 'Découvrir' },
                { to: '/premium', icon: Search, label: 'Premium' },
                { to: '/help', icon: HelpCircle, label: 'Aide' },
              ].map(({ to, icon: Icon, label }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-card border border-border-subtle text-sm text-text-secondary hover:text-text-primary hover:border-border-hover transition-interactive"
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default NotFound
