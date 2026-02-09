import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const faqs = [
  { q: 'Squad Planner est-il gratuit ?', a: 'Oui, Squad Planner est 100% gratuit pour commencer. Crée ta squad, invite tes potes, planifie tes sessions — tout est inclus. Des fonctionnalités premium optionnelles seront disponibles pour les squads qui veulent aller plus loin.' },
  { q: 'Comment inviter mes amis ?', a: 'Une fois ta squad créée, tu reçois un code d\'invitation unique. Partage-le par message, Discord, ou n\'importe quel canal. Tes potes cliquent sur le lien et rejoignent en 10 secondes.' },
  { q: 'Quelle est la différence avec Discord ?', a: 'Discord est fait pour discuter. Squad Planner est fait pour jouer ensemble. On ajoute le planning avec RSVP, le score de fiabilité, et les check-ins pour que vos sessions aient vraiment lieu.' },
  { q: 'Combien de joueurs par squad ?', a: 'Une squad peut accueillir de 2 à 10 joueurs. C\'est la taille idéale pour une équipe de jeu régulière où chacun se sent impliqué.' },
  { q: 'Mes données sont-elles protégées ?', a: 'Absolument. Squad Planner est hébergé en France, conforme au RGPD. Tes données sont chiffrées et tu peux les supprimer à tout moment depuis les paramètres de ton compte.' },
]

/** Exported for FAQ schema injection in Landing.tsx */
export { faqs }

export function FaqSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <section aria-label="Questions fréquentes" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
            Questions fréquentes
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              variants={staggerItemVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="border border-border-subtle rounded-xl overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-bg-elevated/50 transition-colors"
                aria-expanded={expandedFaq === i}
              >
                <span className="text-md font-medium text-text-primary pr-4">{faq.q}</span>
                <ChevronDown className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <div className={`faq-answer ${expandedFaq === i ? 'open' : ''}`}>
                <div>
                  <p className="px-5 pb-5 text-md text-text-tertiary leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
