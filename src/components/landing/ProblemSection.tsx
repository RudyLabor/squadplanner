import { m } from 'framer-motion'
import { scrollRevealLight } from '../../utils/animations'

const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.3 } },
}
const staggerItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}
const chevronVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
}

const problems = [
  { emoji: '💬', text: '« On joue ce soir ? » → Personne ne répond' },
  { emoji: '🤷', text: '« Je sais pas, on verra » → Rien ne se passe' },
  { emoji: '👻', text: 'Session prévue → 2 mecs sur 5 se connectent' },
  { emoji: '😤', text: "Tout le monde attend que quelqu'un organise" },
]

const arrowOpacities = [0.25, 0.4, 0.6]

export function ProblemSection() {
  return (
    <section aria-label="Le problème" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <m.div
          variants={scrollRevealLight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Le problème que tu connais trop bien
          </h2>
          <p className="text-text-tertiary text-lg">
            T'as des amis. T'as Discord. T'as des jeux. Mais vous jouez jamais ensemble.
          </p>
        </m.div>

        <m.div
          className="max-w-lg mx-auto mb-6"
          variants={staggerContainerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {problems.map((item, i) => (
            <m.div key={item.text} variants={staggerItemVariants}>
              <div className="flex items-center justify-center gap-4 py-3">
                <m.span
                  className="text-2xl shrink-0 w-9 text-center"
                  initial={{ scale: 0.6, rotate: -10 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: i * 0.3 + 0.15,
                    type: 'spring',
                    stiffness: 200,
                  }}
                >
                  {item.emoji}
                </m.span>
                <p className="text-text-secondary text-base leading-relaxed">{item.text}</p>
              </div>
              {i < problems.length - 1 && (
                <m.div className="flex justify-center py-1" variants={chevronVariants}>
                  <m.svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-error"
                    style={{ opacity: arrowOpacities[i] }}
                    aria-hidden="true"
                    animate={{ y: [0, 3, 0] }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: 'easeInOut',
                    }}
                  >
                    <path
                      d="M4 6L8 10L12 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </m.svg>
                </m.div>
              )}
            </m.div>
          ))}
        </m.div>

        <m.div
          variants={scrollRevealLight}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-lg mx-auto p-5 rounded-xl bg-gradient-to-r from-error/[0.08] to-warning/[0.05] border border-error/20 text-center"
        >
          <span className="text-xl mr-2">💥</span>
          <span className="text-text-primary font-semibold">
            Résultat → Plus personne n'organise rien. Ta squad meurt à petit feu.
          </span>
        </m.div>
      </div>
    </section>
  )
}
