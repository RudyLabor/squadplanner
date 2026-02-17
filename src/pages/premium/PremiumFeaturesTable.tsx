import { Crown, Check, X } from '../../components/icons'
import { FEATURES } from './PremiumData'

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-success mx-auto" />
    ) : (
      <X className="w-4 h-4 text-text-tertiary mx-auto" />
    )
  }
  return <span className="text-xs md:text-base font-medium text-success">{value}</span>
}

export function PremiumFeaturesTable() {
  return (
    <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
        Comparatif des fonctionnalit&eacute;s
      </h2>
      <div className="rounded-2xl border border-border-subtle overflow-hidden">
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="grid grid-cols-[140px_repeat(4,minmax(90px,1fr))] md:grid-cols-[1.2fr_repeat(4,1fr)] gap-0 border-b border-border-default">
            <div className="sticky left-0 z-20 bg-bg-elevated p-3 md:p-4 text-xs md:text-base font-semibold text-text-secondary shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]">
              Feature
            </div>
            <div className="p-3 md:p-4 text-xs md:text-base font-semibold text-text-secondary text-center bg-bg-elevated">Gratuit</div>
            <div className="p-3 md:p-4 text-center bg-bg-elevated">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs font-bold text-primary">
                Premium
              </span>
            </div>
            <div className="p-3 md:p-4 text-center bg-bg-elevated">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-warning to-warning/70 text-xs font-bold text-bg-base">
                <Crown className="w-2.5 h-2.5" /> Leader
              </span>
            </div>
            <div className="p-3 md:p-4 text-center bg-bg-elevated">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-xs font-bold text-white">
                Club
              </span>
            </div>
          </div>

          {/* Rows */}
          {FEATURES.map((feature, index) => {
            const isEven = index % 2 === 0
            const cellBg = isEven ? 'bg-bg-base' : 'bg-bg-elevated'
            return (
              <div
                key={feature.name}
                className={`grid grid-cols-[140px_repeat(4,minmax(90px,1fr))] md:grid-cols-[1.2fr_repeat(4,1fr)] gap-0 border-b border-border-subtle last:border-b-0 ${cellBg}`}
              >
                <div className={`sticky left-0 z-10 ${cellBg} p-3 md:p-4 flex items-center gap-2 min-w-0 shadow-[2px_0_4px_-1px_rgba(0,0,0,0.3)]`}>
                  <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-xs md:text-sm text-text-primary">{feature.name}</span>
                </div>
                <div className="p-3 md:p-4 text-center flex items-center justify-center min-w-0">
                  <CellValue value={feature.free} />
                </div>
                <div className="p-3 md:p-4 text-center flex items-center justify-center min-w-0">
                  <CellValue value={feature.premium} />
                </div>
                <div className="p-3 md:p-4 text-center flex items-center justify-center min-w-0">
                  <CellValue value={feature.squadLeader} />
                </div>
                <div className="p-3 md:p-4 text-center flex items-center justify-center min-w-0">
                  <CellValue value={feature.club} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
