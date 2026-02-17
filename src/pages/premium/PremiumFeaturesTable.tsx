import { Crown, Check, X } from '../../components/icons'
import { Card } from '../../components/ui'
import { FEATURES } from './PremiumData'

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-success mx-auto" />
    ) : (
      <X className="w-4 h-4 text-text-tertiary mx-auto" />
    )
  }
  return <span className="text-xs md:text-base font-medium text-success break-words">{value}</span>
}

export function PremiumFeaturesTable() {
  return (
    <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
        Comparatif des fonctionnalit&eacute;s
      </h2>
      <Card className="overflow-x-auto relative">
        {/* Header */}
        <div className="grid grid-cols-[140px_repeat(4,1fr)] md:grid-cols-[1.2fr_repeat(4,1fr)] min-w-[600px] gap-1 md:gap-3 p-3 md:p-4 bg-overlay-faint border-b border-border-default">
          <div className="sticky left-0 z-10 bg-overlay-faint text-xs md:text-base font-semibold text-text-secondary">Feature</div>
          <div className="text-xs md:text-base font-semibold text-text-secondary text-center">Gratuit</div>
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs font-bold text-primary">
              Premium
            </span>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-warning to-warning/70 text-xs font-bold text-bg-base">
              <Crown className="w-2.5 h-2.5" /> Leader
            </span>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-xs font-bold text-white">
              Club
            </span>
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border-default">
          {FEATURES.map((feature, index) => {
            const rowBg = index % 2 === 0 ? 'bg-bg-base' : 'bg-overlay-faint/50'
            return (
              <div
                key={feature.name}
                className={`animate-fade-in-up grid grid-cols-[140px_repeat(4,1fr)] md:grid-cols-[1.2fr_repeat(4,1fr)] min-w-[600px] gap-1 md:gap-3 p-3 md:p-4 items-center ${rowBg}`}
                style={{ animationDelay: `${0.3 + index * 0.04}s` }}
              >
                <div className={`sticky left-0 z-10 ${rowBg} flex items-center gap-2 min-w-0 pr-2`}>
                  <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-md text-text-primary break-words">{feature.name}</span>
                </div>
                <div className="text-center min-w-0">
                  <CellValue value={feature.free} />
                </div>
                <div className="text-center min-w-0">
                  <CellValue value={feature.premium} />
                </div>
                <div className="text-center min-w-0">
                  <CellValue value={feature.squadLeader} />
                </div>
                <div className="text-center min-w-0">
                  <CellValue value={feature.club} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
