import { m } from 'framer-motion'
import { CheckCircle2, Clock, Star } from '../../components/icons'
import { Card } from '../../components/ui'
import { TESTIMONIALS } from './PremiumData'
import { TestimonialAvatar } from './TestimonialAvatars'

export function PremiumTestimonials() {
  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mb-16">
      <h2 className="text-xl font-semibold text-text-primary text-center mb-2">Ils sont pass&eacute;s Premium</h2>
      <p className="text-md text-text-secondary text-center mb-8">Et ils ne reviendraient pas en arri&egrave;re</p>
      <div className="grid md:grid-cols-3 gap-4">
        {TESTIMONIALS.map((testimonial, index) => (
          <m.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1, duration: 0.4 }}>
            <div className="relative p-[1px] rounded-2xl bg-gradient-to-br from-primary/30 via-purple/20 to-warning/20 h-full">
              <Card className="p-5 h-full rounded-[15px] bg-bg-surface">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/20 ring-offset-1 ring-offset-bg-surface">
                    <TestimonialAvatar type={testimonial.avatarType} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-md font-semibold text-text-primary truncate">{testimonial.name}</span>
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                    </div>
                    <div className="text-sm text-text-tertiary">{testimonial.squad}</div>
                    <div className="flex items-center gap-1 text-xs text-text-tertiary/70"><Clock className="w-3 h-3" /><span>{testimonial.memberSince}</span></div>
                  </div>
                </div>
                <p className="text-md text-text-secondary leading-relaxed">&laquo; {testimonial.text} &raquo;</p>
                <div className="flex gap-0.5 mt-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-warning text-warning" />)}</div>
              </Card>
            </div>
          </m.div>
        ))}
      </div>
    </m.div>
  )
}
