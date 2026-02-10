import { motion } from 'framer-motion'
import { Check, X as XIcon } from 'lucide-react'
import { scrollReveal } from '../../utils/animations'
import { SquadPlannerLogo } from '../SquadPlannerLogo'

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286z" />
    </svg>
  )
}

const comparisons = [
  { feature: 'Planning de sessions avec RSVP', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Score de fiabilité par joueur', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Check-in présence réelle', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Coach IA personnalisé', discord: false, discordNote: '', squad: true, squadNote: '' },
  { feature: 'Party vocale dédiée', discord: true, discordNote: 'Basique', squad: true, squadNote: 'Optimisé gaming' },
  { feature: 'Chat de squad', discord: true, discordNote: 'Basique', squad: true, squadNote: 'Optimisé gaming' },
  { feature: 'Gamification (XP, challenges)', discord: 'partial' as const, discordNote: 'Via bots tiers', squad: true, squadNote: 'Natif' },
]

export function ComparisonSection() {
  return (
    <section aria-label="Comparaison avec Discord" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={scrollReveal} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Plus qu'un Discord pour gamers
          </h2>
          <p className="text-text-tertiary text-lg">
            Discord est fait pour discuter. Squad Planner est fait pour <span className="text-text-primary font-medium">jouer ensemble</span>.
          </p>
        </motion.div>

        <motion.div
          className="overflow-x-auto rounded-2xl border border-border-default"
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <table className="w-full min-w-[500px]">
            <caption className="sr-only">
              Comparaison des fonctionnalités entre Discord et Squad Planner
            </caption>
            <thead>
              <tr className="bg-bg-surface border-b border-border-subtle">
                <th scope="col" className="text-left text-sm md:text-base font-medium text-text-secondary px-3 md:px-6 py-3 sticky left-0 z-10 bg-bg-surface">
                  Fonctionnalité
                </th>
                <th scope="col" className="text-center text-sm md:text-base font-medium text-text-secondary px-3 md:px-6 py-3">
                  <span className="inline-flex items-center gap-1.5">
                    <DiscordIcon className="w-4 h-4" aria-hidden="true" />
                    Discord
                  </span>
                </th>
                <th scope="col" className="text-center text-sm md:text-base font-medium text-primary px-3 md:px-6 py-3 border-t-2 border-t-primary">
                  <span className="inline-flex items-center gap-1.5">
                    <SquadPlannerLogo size={14} aria-hidden="true" />
                    SP
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((item, i) => (
                <tr
                  key={item.feature}
                  className={`${i < comparisons.length - 1 ? 'border-b border-border-subtle' : ''} ${
                    !item.discord ? 'bg-primary/[0.02]' : ''
                  }`}
                >
                  <th scope="row" className="text-left text-base md:text-md text-text-primary px-3 md:px-6 py-3 md:py-4 font-normal sticky left-0 z-10 bg-bg-base">
                    {item.feature}
                  </th>
                  <td className="text-center px-3 md:px-6 py-3 md:py-4">
                    {item.discord === true ? (
                      <span className="inline-flex flex-col items-center">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-success" aria-hidden="true" />
                        {item.discordNote ? (
                          <span className="text-xs text-text-quaternary mt-0.5">{item.discordNote}</span>
                        ) : (
                          <span className="sr-only">Disponible</span>
                        )}
                      </span>
                    ) : item.discord === 'partial' ? (
                      <span className="inline-flex flex-col items-center">
                        <span className="text-xs md:text-sm text-warning px-1.5 py-0.5 rounded-full bg-warning/10">{item.discordNote || 'Limité'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex flex-col items-center">
                        <XIcon className="w-4 h-4 md:w-5 md:h-5 text-text-quaternary" aria-hidden="true" />
                        <span className="sr-only">Non disponible</span>
                      </span>
                    )}
                  </td>
                  <td className="text-center px-3 md:px-6 py-3 md:py-4">
                    <span className="inline-flex flex-col items-center">
                      <Check className="w-4 h-4 md:w-5 md:h-5 text-success" aria-hidden="true" />
                      {item.squadNote ? (
                        <span className="text-xs text-secondary mt-0.5">{item.squadNote}</span>
                      ) : (
                        <span className="sr-only">Disponible</span>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <p className="text-center text-base text-text-quaternary mt-6 max-w-lg mx-auto">
          Discord reste indispensable pour les communautés larges. Squad Planner est conçu spécifiquement pour ta squad de 3 à 10 joueurs.
        </p>
      </div>
    </section>
  )
}
