import { Sparkles, TrendingUp } from '../../components/icons'
import { Card } from '../../components/ui'
import type { SlotSuggestion, CoachTip } from './types'
import { dayNames } from './types'

interface AISlotSuggestionsProps {
  slotSuggestions: SlotSuggestion[]
  hasSlotHistory?: boolean
}

export function AISlotSuggestions({ slotSuggestions, hasSlotHistory = false }: AISlotSuggestionsProps) {
  if (slotSuggestions.length === 0) return null
  return (
    <section className="mb-6" aria-label="Suggestions de créneaux IA">
      <Card className="p-4 border-purple bg-purple-10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-purple" />
          </div>
          <div className="flex-1">
            <h3 className="text-md font-semibold text-text-primary mb-2">Meilleurs créneaux suggérés</h3>
            {!hasSlotHistory && (
              <p className="text-sm text-text-tertiary mb-2">Suggestions basées sur les habitudes de ta squad. Plus tu joues, plus elles seront précises.</p>
            )}
            <div className="space-y-2">
              {slotSuggestions.slice(0, 3).map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-overlay-medium">
                  <span className="text-base text-text-secondary">{dayNames[slot.day_of_week]} {slot.hour}h</span>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-success" />
                    <span className="text-sm font-medium text-success">{slot.reliability_score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </section>
  )
}

interface CoachTipsSectionProps {
  coachTips: CoachTip[]
}

export function CoachTipsSection({ coachTips }: CoachTipsSectionProps) {
  if (coachTips.length === 0) return null
  return (
    <section className="mb-6" aria-label="Conseil Coach IA">
      <Card className="p-4 border-warning bg-warning-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning-10 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-text-primary mb-1">🎯 Conseil Coach</h3>
            <p className="text-base text-text-secondary">{coachTips[0].content}</p>
          </div>
        </div>
      </Card>
    </section>
  )
}