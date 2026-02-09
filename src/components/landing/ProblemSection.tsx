import { motion } from 'framer-motion'
import { scrollRevealLight } from '../../utils/animations'

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
}
const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const problems = [
  { emoji: '💬', text: '"On joue ce soir ?" → Personne ne répond' },
  { emoji: '🤷', text: '"Je sais pas, on verra" → Rien ne se passe' },
  { emoji: '👻', text: 'Session prévue → 2 mecs sur 5 se connectent' },
  { emoji: '😤', text: 'Tout le monde attend que quelqu\'un organise' },
]

export function ProblemSection() {
  return (
    <section aria-label="Le problème" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={scrollRevealLight} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Le problème que tu connais trop bien
          </h2>
          <p className="text-text-tertiary text-lg">
            T'as des amis. T'as Discord. T'as des jeux. Mais vous jouez jamais ensemble.
          </p>
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-4 mb-4" variants={staggerContainerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}>
          {problems.map((item) => (
            <motion.div
              key={item.text}
              variants={staggerItemVariants}
              className="flex items-center gap-4 p-4 rounded-xl bg-surface-card border border-border-subtle hover:border-border-hover hover:scale-[1.02] transition-all cursor-default"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-text-secondary">{item.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={scrollRevealLight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="p-5 rounded-xl bg-gradient-to-r from-error/[0.08] to-warning/[0.05] border border-error/20 text-center"
        >
          <span className="text-xl mr-2">💥</span>
          <span className="text-text-primary font-semibold">Résultat → Plus personne n'organise rien. Ta squad meurt à petit feu.</span>
        </motion.div>
      </div>
    </section>
  )
}
