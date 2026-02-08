import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

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
    name: 'Alexandre D.',
    squad: 'Les Invaincus',
    text: "Depuis Squad Planner, on joue 3 fois par semaine au lieu d'une. Le RSVP force tout le monde a s'engager.",
    avatar: '🎮',
    rating: 5,
    game: 'Valorant',
  },
  {
    name: 'Sarah M.',
    squad: 'GG Squad',
    text: "Le score de fiabilite a change la dynamique. Plus personne ne ghost les sessions, tout le monde assume.",
    avatar: '🎯',
    rating: 5,
    game: 'League of Legends',
  },
  {
    name: 'Lucas R.',
    squad: 'Team Rocket',
    text: "La party vocale est incroyable. On peut parler meme sans jouer, ca soude le groupe.",
    avatar: '🎧',
    rating: 5,
    game: 'Fortnite',
  },
  {
    name: 'Emma L.',
    squad: 'Les Nocturnes',
    text: "Enfin une app qui comprend les gamers. Le planning intelligent propose les meilleurs creneaux automatiquement.",
    avatar: '🌙',
    rating: 5,
    game: 'Overwatch 2',
  },
  {
    name: 'Thomas K.',
    squad: 'Apex Legends FR',
    text: "On est passes de 2 sessions par mois a 2 par semaine. Le check-in rend tout le monde responsable.",
    avatar: '🔥',
    rating: 4,
    game: 'Apex Legends',
  },
  {
    name: 'Julie P.',
    squad: 'Dream Team',
    text: "Les challenges hebdo motivent tout le monde. Notre squad n'a jamais ete aussi active.",
    avatar: '⭐',
    rating: 5,
    game: 'Rocket League',
  },
]

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    scale: 0.97,
  }),
}

export function TestimonialCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: false, amount: 0.3 })

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }, [currentIndex])

  const next = useCallback(() => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
  }, [])

  const prev = useCallback(() => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }, [])

  // Auto-advance
  useEffect(() => {
    if (isPaused || !isInView) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, isInView, next])

  const t = testimonials[currentIndex]

  return (
    <section ref={ref} className="px-4 md:px-6 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        <motion.h2
          className="text-2xl md:text-3xl font-bold text-center text-text-primary mb-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Ce que disent nos joueurs
        </motion.h2>
        <motion.p
          className="text-text-tertiary text-center mb-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Des milliers de squads utilisent deja Squad Planner
        </motion.p>

        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 md:-translate-x-12 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
            aria-label="Precedent"
          >
            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-12 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
            aria-label="Suivant"
          >
            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
          </button>

          {/* Testimonial card */}
          <div className="overflow-hidden px-6 md:px-2 min-h-[140px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
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
                className="bg-bg-elevated border border-border-subtle rounded-2xl p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Avatar + info */}
                  <div className="flex items-center gap-4 md:w-48 shrink-0">
                    <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-text-primary">{t.name}</div>
                      <div className="text-xs text-text-tertiary">{t.squad}</div>
                      <div className="text-xs text-primary mt-0.5">{t.game}</div>
                    </div>
                  </div>

                  {/* Quote */}
                  <div className="flex-1">
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < t.rating ? 'text-[#fbbf24] fill-[#fbbf24]' : 'text-border-subtle'}`}
                        />
                      ))}
                    </div>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed italic">
                      "{t.text}"
                    </p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentIndex
                    ? 'bg-primary w-6'
                    : 'bg-border-hover w-2 hover:bg-text-quaternary'
                }`}
                aria-label={`Temoignage ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
