import { motion } from 'framer-motion'
import { scaleReveal } from '../../utils/animations'

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
}
const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

export function ReliabilitySection() {
  return (
    <section aria-label="Score de fiabilité" className="px-4 md:px-6 py-10 md:py-14 bg-gradient-to-b from-transparent to-error/[0.02]">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={scaleReveal} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="p-8 md:p-12 rounded-3xl bg-surface-card border border-error/20"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="shrink-0 flex flex-col items-center">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-error-10)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="45" fill="none" stroke="var(--color-error)" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    whileInView={{ strokeDashoffset: 283 * (1 - 0.94) }}
                    viewport={{ once: true }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-error">94%</span>
                  <span className="text-xs text-text-tertiary">fiabilité</span>
                </div>
              </div>
              <div className="flex gap-1 mt-3">
                {['✅', '✅', '✅', '❌', '✅', '✅'].map((s, j) => (
                  <motion.span
                    key={j}
                    className="text-xs"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + j * 0.1 }}
                  >
                    {s}
                  </motion.span>
                ))}
              </div>
              <span className="text-xs text-text-quaternary mt-1">MaxGamer_94</span>
            </div>

            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-text-primary mb-3">
                Score de fiabilité : tes potes comptent sur toi
              </h3>
              <p className="text-text-tertiary mb-4">
                Chaque membre a un score basé sur sa présence réelle. Tu dis que tu viens ? On vérifie.
                <span className="text-error font-medium"> Les no-shows chroniques, ça se voit.</span>
              </p>
              <motion.div
                className="flex flex-wrap justify-center md:justify-start gap-3"
                variants={staggerContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[
                  { label: 'Check-in obligatoire', icon: '✅' },
                  { label: 'Historique visible', icon: '📊' },
                  { label: 'Score par joueur', icon: '🏆' },
                ].map(item => (
                  <motion.span key={item.label} variants={staggerItemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 text-base text-error">
                    {item.icon} {item.label}
                  </motion.span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
