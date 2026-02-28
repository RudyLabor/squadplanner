import { useState, useEffect, useCallback, useRef } from 'react'
import { m, AnimatePresence, useInView } from 'framer-motion'
import { ChevronLeft, ChevronRight } from '../icons'
interface Testimonial {
  name: string
  squad: string
  text: string
  avatar: string
  game: string
}

const testimonials: Testimonial[] = [
  {
    name: 'Le message sans réponse',
    squad: 'Chaque groupe Discord, chaque soir',
    text: "« On joue ce soir ? » Vu par 8, répondu par 2. Trois jours plus tard, toujours rien. Depuis qu'on a créé notre squad, tout le monde confirme en 30 secondes. On a joué 4 fois cette semaine.",
    avatar: '💬',
    game: 'Valorant',
  },
  {
    name: 'Le ghost du samedi soir',
    squad: 'Squad ranked, chaque week-end',
    text: "On était 5 inscrits, 2 connectés. Chaque samedi, la même déception. Depuis qu'on utilise le score de fiabilité, on a enchaîné 12 sessions d'affilée sans une seule annulation.",
    avatar: '🎯',
    game: 'League of Legends',
  },
  {
    name: 'Le « on verra demain »',
    squad: 'Squad casual qui veut progresser',
    text: "On jouait une fois par mois, toujours au dernier moment, jamais les mêmes. Maintenant on a 3 sessions fixes par semaine. Le score de présence a tout changé : tout le monde se pointe.",
    avatar: '🔥',
    game: 'Apex Legends',
  },
  {
    name: 'Le pote qui ghost',
    squad: "Groupe d'amis depuis le lycée",
    text: "On avait un pote qui disait oui à tout mais ne venait jamais. Avec le check-in et le score de fiabilité, il a compris. Maintenant c'est lui qui rappelle aux autres de confirmer.",
    avatar: '😤',
    game: 'Fortnite',
  },
  {
    name: 'Le 5e qui manque toujours',
    squad: 'Ranked 5v5',
    text: "On lançait jamais la ranked parce qu'il manquait toujours quelqu'un. Avec les confirmations obligatoires, on sait 24h avant si on sera 5. Résultat : on a enfin grimpé ensemble.",
    avatar: '🎮',
    game: 'Overwatch 2',
  },
  {
    name: 'La squad éparpillée',
    squad: 'Amis sur 3 fuseaux horaires',
    text: "Avec des potes à Paris, Montréal et Bruxelles, trouver un créneau c'était l'enfer. La planification par timezone a tout simplifié. On se retrouve chaque dimanche sans prise de tête.",
    avatar: '🎧',
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
      <p className="text-text-secondary text-sm leading-relaxed italic flex-1">
        {t.text}
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
      aria-label="Situations de joueurs"
    >
      <m.h2
        className="text-xl md:text-2xl font-bold text-center text-text-primary mb-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        Situations que tu reconnais
      </m.h2>
      <m.p
        className="text-text-tertiary text-center mb-10"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        Si tu as déjà envoyé {'« '}qui est dispo ce soir{' ? »'} sans réponse… on a la solution.
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
          aria-label="Situation précédente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 md:translate-x-6 z-10 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-bg-elevated border border-border-subtle flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B5CF6]"
          aria-label="Situation suivante"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scenario cards */}
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
              aria-label={`Situations ${currentIndex * cardsPerView + 1} à ${Math.min((currentIndex + 1) * cardsPerView, testimonials.length)} sur ${testimonials.length}`}
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
              aria-label={`Situation groupe ${i + 1}`}
            >
              <span
                className={`h-2 rounded-full transition-all duration-300 block ${
                  i === currentIndex
                    ? 'bg-primary-bg w-6'
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
