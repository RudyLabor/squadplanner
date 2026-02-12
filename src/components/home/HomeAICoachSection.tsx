import { memo } from 'react'
import { m } from 'framer-motion'
import { Sparkles, ChevronRight } from '../icons'
import { Card, SkeletonAICoach } from '../ui'

interface AICoachTip {
  tip: string
  tone: 'celebration' | 'warning' | 'neutral'
}

interface HomeAICoachSectionProps {
  aiCoachTip: AICoachTip | undefined
  aiCoachLoading: boolean
  onAction: () => void
}

export const HomeAICoachSection = memo(function HomeAICoachSection({
  aiCoachTip,
  aiCoachLoading,
  onAction,
}: HomeAICoachSectionProps) {
  if (aiCoachLoading) {
    return (
      <div data-tour="ai-coach">
        <SkeletonAICoach />
      </div>
    )
  }

  if (!aiCoachTip) return null

  return (
    <m.div
      className="cursor-pointer h-full"
      data-tour="ai-coach"
      onClick={onAction}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card className={`p-3 h-full flex items-center gap-3 border transition-interactive hover:shadow-glow-primary-md ${
        aiCoachTip.tone === 'celebration'
          ? 'bg-gradient-to-r from-success/8 to-transparent border-success/15 hover:border-success/30'
          : aiCoachTip.tone === 'warning'
            ? 'bg-gradient-to-r from-error/8 to-transparent border-error/15 hover:border-error/30'
            : 'bg-gradient-to-r from-primary/8 to-transparent border-primary/15 hover:border-primary/30'
      }`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          aiCoachTip.tone === 'celebration'
            ? 'bg-success/12'
            : aiCoachTip.tone === 'warning'
              ? 'bg-error/12'
              : 'bg-primary/12'
        }`}>
          <Sparkles className={`w-4 h-4 ${
            aiCoachTip.tone === 'celebration'
              ? 'text-success'
              : aiCoachTip.tone === 'warning'
                ? 'text-error'
                : 'text-primary'
          }`} />
        </div>
        <p className={`text-base leading-relaxed flex-1 ${
          aiCoachTip.tone === 'celebration'
            ? 'text-success'
            : aiCoachTip.tone === 'warning'
              ? 'text-error'
              : 'text-text-primary'
        }`}>
          {aiCoachTip.tip}
        </p>
        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
          aiCoachTip.tone === 'celebration'
            ? 'text-success/60'
            : aiCoachTip.tone === 'warning'
              ? 'text-error/60'
              : 'text-primary/60'
        }`} />
      </Card>
    </m.div>
  )
})
