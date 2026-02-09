import { motion } from 'framer-motion'

interface TypingIndicatorProps {
  /** Texte à afficher (ex: "Pierre écrit..." ou null si personne n'écrit) */
  text: string | null
  /** Afficher une version compacte (juste les dots) */
  compact?: boolean
}

/**
 * Composant pour afficher l'indicateur de saisie (typing indicator)
 * Affiche "Pierre écrit..." avec une animation pulse
 */
export function TypingIndicator({ text, compact = false }: TypingIndicatorProps) {
  if (!text) return null

  // Animation des trois points
  const dotVariants = {
    initial: { opacity: 0.4 },
    animate: { opacity: 1 },
  }

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  if (compact) {
    // Version compacte: juste les trois points animés
    return (
      <motion.div
        className="flex items-center gap-1 px-3 py-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <motion.div
          className="flex items-center gap-0.5"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-text-tertiary"
              variants={dotVariants}
              animate={{
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    )
  }

  // Version complète avec le texte
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
    >
      {/* Bulle avec les trois points animés */}
      <div className="flex items-center gap-2 px-3 py-2 bg-bg-hover rounded-2xl rounded-bl-lg">
        <motion.div
          className="flex items-center gap-0.5"
          variants={containerVariants}
          initial="initial"
          animate="animate"
        >
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#8b8d90]"
              variants={dotVariants}
              animate={{
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>

      {/* Texte avec animation pulse subtile */}
      <motion.span
        className="text-[12px] text-[#8b8d90] italic"
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {text}
      </motion.span>
    </motion.div>
  )
}

export default TypingIndicator
