import { m } from 'framer-motion'
import { Users, Calendar, TrendingUp, Star } from '../icons'
import { AnimatedCounter } from '../ui/AnimatedCounter'

const stats = [
  {
    end: 2000,
    suffix: '+',
    singularSuffix: undefined as string | undefined,
    label: 'gamers inscrits',
    icon: Users,
    color: 'var(--color-primary)',
    prefix: '',
  },
  {
    end: 1200,
    suffix: '+',
    singularSuffix: undefined as string | undefined,
    label: 'sessions cette semaine',
    icon: Calendar,
    color: 'var(--color-secondary)',
    prefix: '',
  },
  {
    end: 85,
    suffix: '%',
    singularSuffix: undefined as string | undefined,
    label: 'taux de présence moyen',
    icon: TrendingUp,
    color: 'var(--color-success)',
    prefix: '',
  },
  {
    end: 4.9,
    suffix: '/5',
    singularSuffix: undefined as string | undefined,
    label: 'satisfaction utilisateurs',
    icon: Star,
    color: 'var(--color-gold)',
    decimals: 1,
    prefix: '★ ',
  },
]

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
}

export function SocialProofSection() {
  return (
    <section aria-label="Statistiques" className="px-4 md:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat, index) => (
            <m.div
              key={stat.label}
              className="text-center p-4 md:p-6 rounded-2xl bg-bg-elevated border border-border-subtle relative group hover:border-border-hover transition-colors"
              custom={index}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {index === 0 && (
                <span className="absolute top-3 right-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-[10px] font-medium text-success uppercase tracking-wider">Live</span>
                </span>
              )}
              {index !== 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-success animate-pulse" />
              )}
              <stat.icon
                className="w-5 h-5 md:w-7 md:h-7 mx-auto mb-2"
                style={{ color: stat.color }}
                aria-hidden="true"
              />
              <AnimatedCounter
                end={stat.end}
                suffix={stat.suffix}
                singularSuffix={stat.singularSuffix}
                separator=" "
                className="text-xl md:text-3xl font-bold text-text-primary"
                duration={2.5}
                decimals={stat.decimals || 0}
              />
              <div className="text-sm md:text-sm text-text-tertiary mt-1">{stat.label}</div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
