import { m } from 'framer-motion'
import { MousePointerClick, Clock, Smile, Target } from 'lucide-react'
import { scaleReveal } from '../../utils/animations'
import { AnimatedCounter } from '../ui/AnimatedCounter'

const stats = [
  { end: 3, suffix: ' clics', singularSuffix: ' clic' as string | undefined, label: 'pour confirmer ta présence', icon: MousePointerClick, color: 'var(--color-secondary)' },
  { end: 5, suffix: ' min/sem', singularSuffix: undefined as string | undefined, label: 'pour organiser toutes tes sessions', icon: Clock, color: 'var(--color-primary)' },
  { end: 0, suffix: '', singularSuffix: undefined as string | undefined, label: 'prise de tête pour planifier', icon: Smile, color: 'var(--color-gold)' },
  { end: 4.9, suffix: '★', singularSuffix: undefined as string | undefined, label: 'satisfaction beta testeurs', icon: Target, color: 'var(--color-success)', decimals: 1 },
]

export function SocialProofSection() {
  return (
    <section aria-label="Statistiques" className="px-4 md:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {stats.map((stat) => (
            <m.div
              key={stat.label}
              className="text-center p-4 md:p-6 rounded-2xl bg-bg-elevated border border-border-subtle relative group hover:border-border-hover transition-colors"
              variants={scaleReveal}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-success animate-pulse" />
              <stat.icon className="w-5 h-5 md:w-7 md:h-7 mx-auto mb-2" style={{ color: stat.color }} aria-hidden="true" />
              <AnimatedCounter end={stat.end} suffix={stat.suffix} singularSuffix={stat.singularSuffix} separator=" " className="text-xl md:text-3xl font-bold text-text-primary" duration={2.5} decimals={stat.decimals || 0} />
              <div className="text-sm md:text-sm text-text-tertiary mt-1">{stat.label}</div>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  )
}
