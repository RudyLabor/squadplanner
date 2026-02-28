import { memo } from 'react'
import { m } from 'framer-motion'
import { Users, ChevronRight } from '../icons'
import { Link } from 'react-router'
import { Card, SquadCardSkeleton } from '../ui'
import { springTap } from '../../utils/animations'

interface Squad {
  id: string
  name: string
  game?: string
  member_count?: number
  total_members?: number
}

interface HomeSquadsSectionProps {
  squads: Squad[]
  squadsLoading: boolean
}

export const HomeSquadsSection = memo(function HomeSquadsSection({
  squads,
  squadsLoading,
}: HomeSquadsSectionProps) {
  if (squadsLoading) {
    return (
      <section aria-label="Mes squads">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Mes squads</h2>
        </div>
        <div className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0">
          <SquadCardSkeleton />
          <SquadCardSkeleton />
          <SquadCardSkeleton />
        </div>
      </section>
    )
  }

  if (squads.length > 0) {
    return (
      <section aria-label="Mes squads">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-text-primary">Mes squads</h2>
          <Link to="/squads">
            <m.button
              className="text-sm text-primary font-medium flex items-center gap-1 min-w-[44px] min-h-[44px] px-2 justify-center"
              whileHover={{ x: 2 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              Gérer
              <ChevronRight className="w-3.5 h-3.5" />
            </m.button>
          </Link>
        </div>
        <ul className="space-y-2 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-4 lg:space-y-0 list-none">
          {squads.slice(0, 6).map((squad, index) => (
            <li key={squad.id}>
              <Link to={`/squad/${squad.id}`}>
                <m.div
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4, ease: 'easeOut' }}
                >
                  <Card className="p-3 hover:shadow-glow-primary-sm transition-interactive">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/12 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-md font-medium text-text-primary truncate">
                          {squad.name}
                        </div>
                        <div className="text-sm text-text-tertiary">{squad.game}</div>
                      </div>
                      <div className="text-sm text-text-quaternary">
                        {squad.member_count ?? squad.total_members ?? 1} membre
                        {(squad.member_count ?? squad.total_members ?? 1) > 1 ? 's' : ''}
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-quaternary" />
                    </div>
                  </Card>
                </m.div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  // Empty state
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-transparent border border-border-subtle">
        <m.div
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-purple/8 flex items-center justify-center mx-auto mb-4"
          animate={{ rotate: [0, 3, -3, 0] }}
          transition={{ duration: 4, repeat: 2 }}
        >
          <Users className="w-7 h-7 text-primary" strokeWidth={1.5} />
        </m.div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Tes potes t'attendent !</h3>
        <p className="text-md text-text-tertiary mb-6 max-w-[250px] mx-auto">
          Crée ta squad et finis-en avec les "on verra". Place à l'action !
        </p>
        <Link to="/squads">
          <m.button
            className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-primary-bg text-white text-md font-semibold shadow-glow-primary-sm"
            whileHover={{ y: -2, scale: 1.02, boxShadow: 'var(--shadow-glow-primary-md)' }}
            {...springTap}
          >
            Créer ma squad
          </m.button>
        </Link>
      </Card>
    </m.div>
  )
})
