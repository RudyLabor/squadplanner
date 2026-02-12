import { m } from 'framer-motion'
import { Crown, Check, X } from '../../components/icons'
import { Card } from '../../components/ui'
import { FEATURES } from './PremiumData'

export function PremiumFeaturesTable() {
  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-16">
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">Comparatif des fonctionnalit&eacute;s</h2>
      <Card className="overflow-hidden">
        <div className="grid grid-cols-[1.5fr_1fr_1.2fr] md:grid-cols-3 gap-2 md:gap-4 p-4 bg-overlay-faint border-b border-border-default">
          <div className="text-base font-semibold text-text-secondary">Fonctionnalit&eacute;</div>
          <div className="text-base font-semibold text-text-secondary text-center">Gratuit</div>
          <div className="text-base font-semibold text-center">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gradient-to-r from-warning to-warning/70 text-xs font-bold text-bg-base">
              <Crown className="w-3 h-3" /> PREMIUM
            </span>
          </div>
        </div>
        <div className="divide-y divide-border-default">
          {FEATURES.map((feature, index) => (
            <m.div key={feature.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06, duration: 0.35, ease: 'easeOut' }}
              className={`grid grid-cols-[1.5fr_1fr_1.2fr] md:grid-cols-3 gap-2 md:gap-4 p-4 items-center ${feature.highlight ? 'bg-primary-5' : ''}`}>
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-md text-text-primary break-words">{feature.name}</span>
              </div>
              <div className="text-center min-w-0">
                {typeof feature.free === 'boolean' ? (
                  feature.free ? <Check className="w-5 h-5 text-success mx-auto" /> : <X className="w-5 h-5 text-text-tertiary mx-auto" />
                ) : (
                  <span className="text-base text-text-secondary break-words">{feature.free}</span>
                )}
              </div>
              <div className="text-center min-w-0">
                {typeof feature.premium === 'boolean' ? (
                  <Check className="w-5 h-5 text-success mx-auto" />
                ) : (
                  <span className="text-base font-medium text-success break-words">{feature.premium}</span>
                )}
              </div>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  )
}
