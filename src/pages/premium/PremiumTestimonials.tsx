import { Clock } from '../../components/icons'
import { Card } from '../../components/ui'
import { TESTIMONIALS } from './PremiumData'
import { TestimonialAvatar } from './TestimonialAvatars'

export function PremiumTestimonials() {
  return (
    <div className="animate-fade-in-up mb-16" style={{ animationDelay: '0.4s' }}>
      <h2 className="text-xl font-semibold text-text-primary text-center mb-2">
        Cas d'usage Premium
      </h2>
      <p className="text-md text-text-secondary text-center mb-8">
        Le Premium s'adapte à ton style de jeu. Voilà à quoi ça ressemble.
      </p>
      <div className="grid md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((testimonial, index) => (
          <div
            key={index}
            className="animate-fade-in-up"
            style={{ animationDelay: `${0.4 + index * 0.1}s` }}
          >
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-purple/20 to-warning/20 h-full">
              <Card className="p-5 h-full rounded-[15px] bg-bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-1 ring-offset-bg-surface">
                    <TestimonialAvatar type={testimonial.avatarType} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-md font-semibold text-text-primary truncate">
                        {testimonial.name}
                      </span>
                    </div>
                    <div className="text-sm text-text-tertiary">{testimonial.squad}</div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary/70">
                      <Clock className="w-3 h-3" />
                      <span>{testimonial.memberSince}</span>
                    </div>
                  </div>
                </div>
                <p className="text-md text-text-secondary leading-relaxed">
                  {testimonial.text}
                </p>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
