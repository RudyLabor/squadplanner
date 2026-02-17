import { Crown, Check, X } from '../../components/icons'
import { FEATURES } from './PremiumData'

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-success" />
    ) : (
      <X className="w-4 h-4 text-text-tertiary" />
    )
  }
  return <span className="text-xs font-medium text-success">{value}</span>
}

export function PremiumFeaturesTable() {
  return (
    <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.3s' }}>
      <h2 className="text-xl font-semibold text-text-primary text-center mb-8">
        Comparatif des fonctionnalit&eacute;s
      </h2>
      <div className="rounded-2xl border border-border-subtle overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse">
          <thead>
            <tr className="bg-bg-elevated border-b border-border-default">
              <th className="text-left text-xs font-semibold text-text-secondary p-3 w-[140px] md:w-auto">
                Feature
              </th>
              <th className="text-center text-xs font-semibold text-text-secondary p-3">
                Gratuit
              </th>
              <th className="text-center p-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/20 text-xs font-bold text-primary">
                  Premium
                </span>
              </th>
              <th className="text-center p-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-warning to-warning/70 text-xs font-bold text-bg-base">
                  <Crown className="w-2.5 h-2.5" /> Leader
                </span>
              </th>
              <th className="text-center p-3">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-xs font-bold text-white">
                  Club
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((feature, index) => (
              <tr
                key={feature.name}
                className={`border-b border-border-subtle last:border-b-0 ${
                  index % 2 === 0 ? 'bg-bg-base' : 'bg-bg-elevated'
                }`}
              >
                <td className="p-3 text-left">
                  <div className="flex items-center gap-2">
                    <feature.icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-xs text-text-primary">{feature.name}</span>
                  </div>
                </td>
                <td className="p-3 text-center">
                  <CellValue value={feature.free} />
                </td>
                <td className="p-3 text-center">
                  <CellValue value={feature.premium} />
                </td>
                <td className="p-3 text-center">
                  <CellValue value={feature.squadLeader} />
                </td>
                <td className="p-3 text-center">
                  <CellValue value={feature.club} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
