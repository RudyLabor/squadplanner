import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Gamepad2, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <div className="min-h-0 bg-[#050506] pb-6">
      <div className="px-4 md:px-6 lg:px-8 py-6 max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
        {/* Animated 404 icon */}
        <motion.div
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[rgba(99,102,241,0.15)] to-[rgba(167,139,250,0.08)] flex items-center justify-center mx-auto mb-6"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Gamepad2 className="w-12 h-12 text-[#6366f1]" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-6xl font-bold text-[#f7f8f8] mb-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          404
        </motion.h1>

        {/* Message */}
        <motion.p
          className="text-[18px] font-semibold text-[#f7f8f8] mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Oups, cette page n'existe pas !
        </motion.p>

        <motion.p
          className="text-[14px] text-[#8b8d90] mb-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          La page que tu cherches a peut-être été déplacée ou n'existe plus.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Link to="/home">
            <Button className="w-full sm:w-auto">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Button>
          </Link>
          <Button
            variant="secondary"
            onClick={() => window.history.back()}
            className="w-full sm:w-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Page précédente
          </Button>
        </motion.div>
        </div>
      </div>
    </div>
  )
}

export default NotFound
