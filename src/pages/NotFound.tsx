import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Gamepad2, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <main className="min-h-0 bg-bg-base pb-6" aria-label="Page introuvable">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
        {/* Animated 404 icon — visible by default, animation is progressive enhancement */}
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-15 to-purple/[0.08] flex items-center justify-center mx-auto mb-6 opacity-100"
          initial={false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Gamepad2 className="w-12 h-12 text-primary" />
          </motion.div>
        </motion.div>

        {/* Title — always visible */}
        <h1 className="text-6xl font-bold text-text-primary mb-3">
          404
        </h1>

        {/* Message — always visible */}
        <p className="text-xl font-semibold text-text-primary mb-2">
          Oups, cette page n'existe pas !
        </p>

        <p className="text-md text-text-secondary mb-8">
          La page que tu cherches a peut-être été déplacée ou n'existe plus.
        </p>

        {/* Action buttons — always visible */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/home">
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
        </div>
      </div>
    </main>
  )
}

export default NotFound
