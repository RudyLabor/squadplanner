import { useState } from 'react'
import { m } from 'framer-motion'
import { ChevronDown } from '../icons'
const staggerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const faqs = [
  {
    q: 'Squad Planner est-il gratuit ?',
    a: "Oui, 100% gratuit pour commencer. Tu crées 1 squad avec jusqu'à 5 membres, tu planifies 2 sessions par semaine -- tout est inclus. Concrètement, ça veut dire que tu peux organiser tes soirées gaming sans sortir ta CB. Le premium est là pour ceux qui veulent plus de squads, du coaching IA et des stats poussées, mais l'essentiel est gratuit.",
  },
  {
    q: 'Comment inviter mes amis ?',
    a: "Tu reçois un code d'invitation unique quand tu crées ta squad. Tu le partages par Discord, WhatsApp, SMS -- n'importe quoi. Tes potes cliquent sur le lien et rejoignent en 10 secondes, sans créer de compte au préalable. Résultat : en 2 minutes ta squad est au complet et prête à planifier.",
  },
  {
    q: 'Quelle est la différence avec Discord ?',
    a: "Discord c'est top pour discuter, mais personne ne sait qui vient mardi soir. Squad Planner ajoute le planning avec confirmation de présence, le score de fiabilité et les check-ins. Concrètement, tu sais à 18h qui sera là à 21h -- plus besoin de relancer tout le monde sur Discord.",
  },
  {
    q: 'Combien de joueurs par squad ?',
    a: "Jusqu'à 5 membres par squad en gratuit. En Premium, tu peux aller jusqu'à 20. En Squad Leader jusqu'à 50, Team jusqu'à 75, et Club jusqu'à 100. Tu peux créer plusieurs squads si tu joues à différents jeux.",
  },
  {
    q: 'Mes données sont-elles protégées ?',
    a: "Absolument. Hébergé en France, conforme RGPD. Tes données sont chiffrées et tu peux tout supprimer à tout moment depuis les paramètres. En gros, tes stats de gaming restent les tiennes, point.",
  },
  {
    q: 'Pourquoi pas juste un Google Calendar ou Doodle ?',
    a: "Parce que Google Calendar c'est fait pour des réunions de boulot, pas pour tes ranked du mardi. Squad Planner est conçu pour le gaming : vocal intégré, score de présence, confirmation auto quand assez de joueurs sont dispo. Résultat : tu passes moins de temps à organiser et plus de temps à jouer.",
  },
  {
    q: "Mes potes vont vraiment l'utiliser ?",
    a: "Oui, parce qu'ils n'ont qu'à cliquer OUI ou NON. Pas d'app à installer (ça marche dans le navigateur). Du coup même les plus flemmards de ta squad peuvent confirmer en 2 secondes. S'ils veulent les notifs push, l'app mobile est dispo.",
  },
  {
    q: "C'est vraiment 100% gratuit ?",
    a: "Oui. 1 squad, 5 membres, 2 sessions par semaine, confirmation de présence, chat basique, vocal -- tout ça gratuit, sans limite de temps. Le premium à partir de 6,99€/mois ajoute le chat complet avec GIF et polls, le coach IA et des stats avancées. Mais honnêtement, tu n'en as pas besoin pour bien organiser tes sessions.",
  },
]

/** Exported for FAQ schema injection in Landing.tsx */
export { faqs }

export function FaqSection() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  return (
    <section aria-label="Questions fréquentes" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Questions fréquentes
          </h2>
        </m.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <m.div
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
                <ChevronDown
                  className={`w-5 h-5 text-text-quaternary shrink-0 transition-transform duration-300 ${expandedFaq === i ? 'rotate-180' : ''}`}
                />
              </button>
              <div className={`faq-answer ${expandedFaq === i ? 'open' : ''}`}>
                <div>
                  <p className="px-5 pb-5 text-md text-text-tertiary leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
