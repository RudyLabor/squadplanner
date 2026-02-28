import { useRef, useState, useCallback } from 'react'
import { Crown, Check, X, ChevronRight } from '../../components/icons'
import { FEATURES } from './PremiumData'

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return (
      <div className="flex items-center justify-center">
        {value ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <X className="w-4 h-4 text-text-tertiary" />
        )}
      </div>
    )
  }
  return <span className="text-xs font-medium text-success leading-tight">{value}</span>
}

export function PremiumFeaturesTable() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }, [])

  return (
    <div
      className="animate-fade-in-up mt-12 mb-16 max-w-3xl mx-auto px-4 sm:px-0"
      style={{ animationDelay: '0.3s' }}
    >
      <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
        Comparatif des fonctionnalités
      </h2>
      {/* Mobile scroll hint */}
      <p className="text-xs text-text-tertiary text-center mb-6 sm:hidden flex items-center justify-center gap-1">
        Glisse pour voir tous les plans <ChevronRight className="w-3 h-3" />
      </p>
      <div className="hidden sm:block mb-8" />
      <div className="relative rounded-2xl border border-border-subtle overflow-hidden">
        <div ref={scrollRef} className="overflow-x-auto" onScroll={handleScroll}>
          <table className="w-full border-collapse table-fixed" style={{ minWidth: 600 }}>
            <colgroup>
              <col style={{ width: 216 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 96 }} />
              <col style={{ width: 96 }} />
            </colgroup>
            <thead>
              <tr className="border-b border-border-default">
                <th className="sticky left-0 z-20 bg-bg-elevated text-left text-xs font-semibold text-text-secondary p-3 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.4)]">
                  Fonctionnalité
                </th>
                <th className="bg-bg-elevated text-center text-xs font-semibold text-text-secondary p-2">
                  Gratuit
                </th>
                <th className="bg-bg-elevated text-center p-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs font-bold text-primary-hover">
                    Premium
                  </span>
                </th>
                <th className="bg-bg-elevated text-center p-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-warning to-warning/70 text-xs font-bold text-bg-base">
                    <Crown className="w-2.5 h-2.5" /> Leader
                  </span>
                </th>
                <th className="bg-bg-elevated text-center p-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-bg text-xs font-bold text-white">
                    Club
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, index) => {
                const bg = index % 2 === 0 ? 'bg-bg-base' : 'bg-bg-elevated'
                return (
                  <tr
                    key={feature.name}
                    className={`border-b border-border-subtle last:border-b-0 ${bg}`}
                  >
                    <td
                      className={`sticky left-0 z-10 ${bg} p-3 text-left shadow-[2px_0_8px_-2px_rgba(0,0,0,0.4)]`}
                    >
                      <div className="flex items-center gap-2">
                        <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-xs text-text-primary leading-tight">
                          {feature.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-center align-middle">
                      <CellValue value={feature.free} />
                    </td>
                    <td className="p-2 text-center align-middle">
                      <CellValue value={feature.premium} />
                    </td>
                    <td className="p-2 text-center align-middle">
                      <CellValue value={feature.squadLeader} />
                    </td>
                    <td className="p-2 text-center align-middle">
                      <CellValue value={feature.club} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {/* Gradient fade — wider and more opaque to fully hide partial column */}
        {canScrollRight && (
          <div
            className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:hidden"
            style={{
              background: 'linear-gradient(to left, var(--color-bg-base) 20%, transparent)',
            }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  )
}
