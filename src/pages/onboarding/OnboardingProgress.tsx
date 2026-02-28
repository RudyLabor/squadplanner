import { Check } from '../../components/icons'
type OnboardingStep =
  | 'splash'
  | 'squad-choice'
  | 'create-squad'
  | 'join-squad'
  | 'permissions'
  | 'profile'
  | 'invite'
  | 'complete'

interface OnboardingProgressProps {
  step: OnboardingStep
}

export function OnboardingProgress({ step }: OnboardingProgressProps) {
  if (step === 'splash' || step === 'complete') return null

  const items = [
    { key: 'squad', label: 'Squad' },
    { key: 'profile', label: 'Profil' },
    { key: 'permissions', label: 'Permissions' },
  ]

  const currentIndex = ['squad-choice', 'create-squad', 'join-squad'].includes(step)
    ? 0
    : step === 'profile'
      ? 1
      : step === 'permissions'
        ? 2
        : -1

  return (
    <div className="flex justify-center items-center gap-3 mt-8">
      {items.map((item, i) => {
        const isActive = i === currentIndex
        const isCompleted = i < currentIndex
        return (
          <div key={item.key} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-semibold transition-interactive ${
                  isCompleted
                    ? 'bg-success-bg text-white'
                    : isActive
                      ? 'bg-primary-bg text-white'
                      : 'bg-border-subtle text-text-tertiary'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-xs ${isActive || isCompleted ? 'text-text-primary' : 'text-text-tertiary'}`}
              >
                {item.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div
                className={`w-8 h-0.5 mb-5 ${i < currentIndex ? 'bg-success' : 'bg-border-hover'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
