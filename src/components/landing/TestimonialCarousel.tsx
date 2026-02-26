import { useState, useEffect, useCallback, useRef } from 'react'
import { m, AnimatePresence, useInView } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from '../icons'
interface Testimonial {
  name: string
  squad: string
  text: string
  avatar: string
  rating: number
  game: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Gamer anonyme',
    squad: 'Sur Discord, chaque soir',
    text: "« On joue ce soir ? » — 3 jours plus tard, toujours rien. C'est exactement pour ça qu'on a besoin d'un outil comme Squad Planner.",
    avatar: '💬',
    rating: 5,
    game: 'Valorant',
  },
  {
    name: 'Bêta-testeur #12',
    squad: 'Alpha Squad',
    text: "Depuis qu'on utilise le RSVP, plus personne ne ghost. Tu dis OUI, tu viens. Simple.",
    avatar: '🎯',
    rating: 5,
    game: 'League of Legends',
  },
  {
    name: 'Bêta-testeur #7',
    squad: 'Les Nocturnes',
    text: 'On est passés de « on verra demain » à 3 sessions par semaine. Le score de présence, ça motive.',
    avatar: '🔥',
    rating: 5,
    game: 'Apex Legends',
  },
  {
    name: 'Tout gamer, ever',
    squad: "N'importe quel groupe Discord",
    text: '« Qui est dispo ce week-end ? » *vu par 8, répondu par 2*. Squad Planner règle ça en 30 secondes.',
    avatar: '😤',
    rating: 5,
    game: 'Fortnite',
  },
  {
    name: 'Bêta-testeur #3',
    squad: 'Ranked Buddies',
    text: "Le check-in rend tout le monde responsable. Mon pote qui ghostait tout le temps ? Son score l'a calmé.",
    avatar: '🎮',
    rating: 4,
    game: 'Overwatch 2',
  },
  {
    name: 'Bêta-testeur #19',
    squad: 'Vendredi Soir Gaming',
    text: "La party vocale toujours ouverte, c'est le game changer. On se retrouve même sans session prévue.",
    avatar: '🎧',
    rating: 5,
    game: 'Rocket League',
  },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
  }),
}

function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <div className="surface-glass rounded-2xl p-6 h-full flex flex-col transition-shadow duration-300 hover:shadow-[0_0_24px_rgba(139,92,246,0.08)]" style={{ backdropFilter: 'blur(24px) saturate(1.2)', WebkitBackdropFilter: 'blur(24px) saturate(1.2)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl">
          {t.avatar}
        </div>
        <div>
          <div className="font-semibold text-text-primary text-sm">{t.name}</div>
          <div className="text-xs text-text-tertiary">{t.squad}</div>
          <div className="text-xs text-info mt-0.5">{t.game}</div>
        </div>
      </div>
      <div className="flex gap-0.5 mb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${i < t.rating ? 'text-warning fill-warning' : 'text-border-subtle'}`}
          />
        ))}
      </div>
      <p className="text-text-secondary text-sm leading-relaxed italic flex-1">
        {'\u00AB\u00A0'}
        {t.text}
        {'\u00A0\u00BB'}
      </p>
    </div>
  )
}

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  // On desktop show 3 at once, on mobile show 1
  const [cardsPerView, setCardsPerView] = useState(1)

  useEffect(() => {
    const updateCardsPerView = () => {
      if (window.innerWidth >= 1024) setCardsPerView(3)
      else if (window.innerWidth >= 768) setCardsPerView(2)
      else setCardsPerView(1)
    }
    updateCardsPerView()
    window.addEventListener('resize', updateCardsPerView)
    return () => window.removeEventListener('resize', updateCardsPerView)
  }, [])

  const totalSlides = Math.ceil(testimonials.length / cardsPerView)

  const next = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % totalSlides)
  }, [totalSlides])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides)
  }, [totalSlides])

  const goToSlide = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1)
      setCurrentIndex(index)
    },
    [currentIndex]
  )

  // Auto-advance
  useEffect(() => {
    if (isPaused || !isInView) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, isInView, next])

  const visibleTestimonials = testimonials.slice(
    currentIndex * cardsPerView,
    currentIndex * cardsPerView + cardsPerView
  )

  return (
    <div
      ref={ref}
      role="region"
      aria-roledescription="carousel"
      aria-label="Témoignages de joueurs"
    >
      <m.h2
        className="text-xl md:text-2xl font-bold text-center text-text-primary mb-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Nos joueurs en parlent mieux que nous
      </m.h2>
      <m.p
        className="text-text-tertiary text-center mb-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        Bêta en cours — premiers retours de nos testeurs
      </m.p>

      <div
        className="relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Navigation arrows — min 44x44px touch target */}
        <button
          type="button"
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-6 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]"
          aria-label="Témoignage précédent"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]"
          aria-label="Témoignage suivant"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Testimonial cards */}
        <div className="overflow-hidden px-6 md:px-2">
          <AnimatePresence mode="wait" custom={direction}>
            <m.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.4 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) next()
                else if (info.offset.x > 80) prev()
              }}
              className={`grid gap-4 ${
                cardsPerView === 3
                  ? 'grid-cols-3'
                  : cardsPerView === 2
                    ? 'grid-cols-2'
                    : 'grid-cols-1'
              }`}
              role="group"
              aria-roledescription="slide"
              aria-label={`Témoignages ${currentIndex * cardsPerView + 1} à ${Math.min((currentIndex + 1) * cardsPerView, testimonials.length)} sur ${testimonials.length}`}
            >
              {visibleTestimonials.map((t) => (
                <TestimonialCard key={t.name} t={t} />
              ))}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators — 44x44px touch targets */}
        <div className="flex justify-center gap-0 mt-4">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]"
              aria-label={`Témoignage groupe ${i + 1}`}
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 block ${
                  i === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-border-hover w-2 hover:bg-text-quaternary'
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
