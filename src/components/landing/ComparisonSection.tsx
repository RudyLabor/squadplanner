import { m } from 'framer-motion'
import { Check, X as XIcon } from '../icons'
import { scrollReveal } from '../../utils/animations'
import { SquadPlannerLogo } from '../SquadPlannerLogo'

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 256 199"
      fill="#5865F2"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M216.856 16.597A208.502 208.502 0 0 0 164.042 0c-2.275 4.113-4.933 9.645-6.766 14.046-19.692-2.961-39.203-2.961-58.533 0-1.832-4.4-4.55-9.933-6.846-14.046a207.809 207.809 0 0 0-52.855 16.638C5.618 67.147-3.443 116.4 1.087 164.956c22.169 16.555 43.653 26.612 64.775 33.193A161.094 161.094 0 0 0 79.735 175.3a136.413 136.413 0 0 1-21.846-10.632 108.636 108.636 0 0 0 5.356-4.237c42.122 19.702 87.89 19.702 129.51 0a131.66 131.66 0 0 0 5.355 4.237 136.07 136.07 0 0 1-21.886 10.653c4.006 8.02 8.638 15.67 13.873 22.848 21.142-6.58 42.646-16.637 64.815-33.213 5.316-56.288-9.08-105.09-38.056-148.36ZM85.474 135.095c-12.645 0-23.015-11.805-23.015-26.18s10.149-26.2 23.015-26.2c12.867 0 23.236 11.804 23.015 26.2.02 14.375-10.148 26.18-23.015 26.18Zm85.051 0c-12.645 0-23.014-11.805-23.014-26.18s10.148-26.2 23.014-26.2c12.867 0 23.236 11.804 23.015 26.2 0 14.375-10.148 26.18-23.015 26.18Z" />
    </svg>
  )
}

const comparisons = [
  {
    feature: 'Planning de sessions avec RSVP',
    discord: false,
    discordNote: '',
    squad: true,
    squadNote: '',
  },
  {
    feature: 'Score de fiabilité par joueur',
    discord: false,
    discordNote: '',
    squad: true,
    squadNote: '',
  },
  {
    feature: 'Check-in présence réelle',
    discord: false,
    discordNote: '',
    squad: true,
    squadNote: '',
  },
  { feature: 'Coach IA personnalisé', discord: false, discordNote: '', squad: true, squadNote: '' },
  {
    feature: 'Stats & analytics d\'équipe',
    discord: false,
    discordNote: '',
    squad: true,
    squadNote: 'Avancées',
  },
  {
    feature: 'Sessions récurrentes',
    discord: false,
    discordNote: '',
    squad: true,
    squadNote: '',
  },
  {
    feature: 'Gestion multi-squads',
    discord: 'partial' as const,
    discordNote: 'Serveurs séparés',
    squad: true,
    squadNote: 'Dashboard unifié',
  },
  {
    feature: 'Party vocale dédiée',
    discord: true,
    discordNote: 'Basique',
    squad: true,
    squadNote: 'Audio HD',
  },
  {
    feature: 'Chat de squad',
    discord: true,
    discordNote: 'Basique',
    squad: true,
    squadNote: 'Optimisé gaming',
  },
  {
    feature: 'Gamification (XP, challenges)',
    discord: 'partial' as const,
    discordNote: 'Via bots tiers',
    squad: true,
    squadNote: 'Natif',
  },
  {
    feature: 'Parrainage avec récompenses',
    discord: false,
    discordNote: '',
    squad: true,
    squadNote: 'Natif',
  },
]

export function ComparisonSection() {
  return (
    <section aria-label="Comparaison avec Discord" className="px-4 md:px-6 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <m.div
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-xl md:text-2xl font-bold text-text-primary mb-4">
            Plus qu'un Discord pour gamers
          </h2>
          <p className="text-text-tertiary text-lg">
            Discord est fait pour discuter. Squad Planner est fait pour{' '}
            <span className="text-text-primary font-medium">jouer ensemble</span>.
          </p>
        </m.div>

        <m.div
          className="rounded-2xl border border-border-default overflow-hidden"
          variants={scrollReveal}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <table className="w-full table-fixed">
            <caption className="sr-only">
              Comparaison des fonctionnalités entre Discord et Squad Planner
            </caption>
            <colgroup>
              <col className="w-[54%] md:w-auto" />
              <col className="w-[23%] md:w-auto" />
              <col className="w-[23%] md:w-auto" />
            </colgroup>
            <thead>
              <tr className="bg-bg-surface border-b border-border-subtle">
                <th
                  scope="col"
                  className="text-left text-xs md:text-base font-medium text-text-secondary px-2 md:px-6 py-3"
                >
                  Fonctionnalité
                </th>
                <th
                  scope="col"
                  className="text-center text-xs md:text-base font-medium text-text-secondary px-1 md:px-6 py-3"
                >
                  <span className="inline-flex items-center gap-1 md:gap-1.5">
                    <DiscordIcon className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Discord</span>
                  </span>
                </th>
                <th
                  scope="col"
                  className="text-center text-xs md:text-base font-medium text-primary px-1 md:px-6 py-3 border-t-2 border-t-primary"
                >
                  <span className="inline-flex items-center gap-1 md:gap-1.5">
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
                  <th
                    scope="row"
                    className="text-left text-xs md:text-md text-text-primary px-2 md:px-6 py-2.5 md:py-4 font-normal"
                  >
                    {item.feature}
                  </th>
                  <td className="text-center px-1 md:px-6 py-2.5 md:py-4">
                    {item.discord === true ? (
                      <span className="inline-flex flex-col items-center">
                        <Check className="w-4 h-4 md:w-5 md:h-5 text-success" aria-hidden="true" />
                        {item.discordNote ? (
                          <span className="text-xs text-text-quaternary mt-0.5">
                            {item.discordNote}
                          </span>
                        ) : (
                          <span className="sr-only">Disponible</span>
                        )}
                      </span>
                    ) : item.discord === 'partial' ? (
                      <span className="inline-flex flex-col items-center">
                        <span className="text-xs md:text-sm text-warning px-1 md:px-1.5 py-0.5 rounded-full bg-warning/10">
                          {item.discordNote || 'Limité'}
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex flex-col items-center">
                        <XIcon
                          className="w-4 h-4 md:w-5 md:h-5 text-text-quaternary"
                          aria-hidden="true"
                        />
                        <span className="sr-only">Non disponible</span>
                      </span>
                    )}
                  </td>
                  <td className="text-center px-1 md:px-6 py-2.5 md:py-4">
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
        </m.div>

        <p className="text-center text-base text-text-quaternary mt-6 max-w-lg mx-auto">
          Discord reste indispensable pour les communautés larges. Squad Planner est conçu
          spécifiquement pour ta squad de 3 à 10 joueurs.
        </p>
      </div>
    </section>
  )
}
