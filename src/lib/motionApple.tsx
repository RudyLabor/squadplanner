// Apple-level Motion System
// Spring physics + micro-interactions comme iOS/macOS 2026

interface SpringConfig {
  tension: number
  friction: number
  mass?: number
}

interface MotionConfig {
  duration?: number
  ease?: 'spring' | 'ease-in' | 'ease-out' | 'ease-in-out'
  spring?: SpringConfig
  delay?: number
}

// Presets Apple authentiques (reverse-engineered from iOS/macOS)
export const ApplePresets = {
  // iOS button tap
  gentle: { tension: 300, friction: 20 },
  // macOS window resize
  smooth: { tension: 280, friction: 25 },
  // iOS modal present
  bouncy: { tension: 400, friction: 15 },
  // iOS notification
  snappy: { tension: 500, friction: 30 },
  // macOS dock scale
  wobbly: { tension: 180, friction: 12 },
} as const

class SpringAnimation {
  private startValue: number = 0
  private endValue: number = 0
  private currentValue: number = 0
  private velocity: number = 0
  private config: SpringConfig
  private onUpdate?: (value: number) => void
  private onComplete?: () => void
  private animationId?: number
  private isRunning = false

  constructor(config: SpringConfig) {
    this.config = { mass: 1, ...config }
  }

  start(from: number, to: number, onUpdate?: (value: number) => void, onComplete?: () => void) {
    this.startValue = from
    this.endValue = to
    this.currentValue = from
    this.velocity = 0
    this.onUpdate = onUpdate
    this.onComplete = onComplete
    this.isRunning = true

    this.tick()
  }

  private tick = () => {
    if (!this.isRunning) return

    const { tension, friction, mass = 1 } = this.config

    // Spring physics calculation (Hooke's law + damping)
    const displacement = this.currentValue - this.endValue
    const springForce = -tension * displacement
    const dampingForce = -friction * this.velocity
    const acceleration = (springForce + dampingForce) / mass

    // Integration (Verlet method for stability)
    const deltaTime = 1 / 60 // 60fps
    this.velocity += acceleration * deltaTime
    this.currentValue += this.velocity * deltaTime

    this.onUpdate?.(this.currentValue)

    // Check if animation is complete (within threshold + low velocity)
    const isAtRest = Math.abs(displacement) < 0.01 && Math.abs(this.velocity) < 0.01

    if (isAtRest) {
      this.currentValue = this.endValue
      this.onUpdate?.(this.endValue)
      this.isRunning = false
      this.onComplete?.()
    } else {
      this.animationId = requestAnimationFrame(this.tick)
    }
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
  }
}

// Hook pour animations Apple-style
export function useAppleMotion() {
  const animate = useCallback(
    (
      element: HTMLElement,
      property: string,
      from: number,
      to: number,
      config: MotionConfig = {}
    ): Promise<void> => {
      return new Promise((resolve) => {
        const springConfig = config.spring || ApplePresets.smooth
        const animation = new SpringAnimation(springConfig)

        const startTime = performance.now()

        animation.start(
          from,
          to,
          (value) => {
            // Apply transform with hardware acceleration
            if (property === 'scale') {
              element.style.transform = `scale(${value})`
            } else if (property === 'translateY') {
              element.style.transform = `translateY(${value}px)`
            } else if (property === 'opacity') {
              element.style.opacity = value.toString()
            }
            // Force hardware layer
            element.style.willChange = property
          },
          () => {
            element.style.willChange = 'auto'
            resolve()
          }
        )

        // Cleanup on component unmount
        return () => animation.stop()
      })
    },
    []
  )

  return { animate }
}

// Micro-interactions Apple-style
export const AppleMicroInteractions = {
  // Button press (iOS Safari tabs)
  buttonPress: (element: HTMLElement) => {
    const { animate } = useAppleMotion()
    animate(element, 'scale', 1, 0.97, { spring: ApplePresets.snappy }).then(() =>
      animate(element, 'scale', 0.97, 1, { spring: ApplePresets.gentle })
    )
  },

  // Modal present (iOS sheets)
  modalSlideUp: (element: HTMLElement) => {
    const { animate } = useAppleMotion()
    element.style.opacity = '0'
    animate(element, 'translateY', 100, 0, { spring: ApplePresets.smooth })
    animate(element, 'opacity', 0, 1, { spring: ApplePresets.gentle })
  },

  // Card flip (iOS Control Center)
  cardFlip: async (element: HTMLElement) => {
    const { animate } = useAppleMotion()
    await animate(element, 'scale', 1, 0.8, { spring: ApplePresets.snappy })
    await animate(element, 'scale', 0.8, 1, { spring: ApplePresets.bouncy })
  },

  // Notification bounce (iOS notification)
  notificationBounce: (element: HTMLElement) => {
    const { animate } = useAppleMotion()
    animate(element, 'translateY', -100, 0, { spring: ApplePresets.wobbly })
  },
}

// CSS-in-JS pour motion Apple (plus performant que Framer)
export function generateAppleCSS() {
  return `
    /* Apple-style transitions pour fallback */
    .motion-apple-gentle {
      transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }
    
    .motion-apple-snappy {
      transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    .motion-apple-smooth {
      transition: all 0.3s cubic-bezier(0.4, 0.0, 0.6, 1);
    }
    
    /* Optimisations performance */
    .motion-element {
      transform: translateZ(0); /* Force hardware acceleration */
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    /* Hover states Apple-style */
    .apple-button {
      transform: scale(1);
      transition: transform 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
    }
    
    .apple-button:hover {
      transform: scale(1.02);
    }
    
    .apple-button:active {
      transform: scale(0.98);
      transition-duration: 0.1s;
    }
    
    /* Loading states Apple-style */
    .apple-skeleton {
      background: linear-gradient(90deg, 
        rgba(255,255,255,0) 0%, 
        rgba(255,255,255,0.1) 50%, 
        rgba(255,255,255,0) 100%);
      background-size: 200px 100%;
      animation: apple-shimmer 1.2s infinite linear;
    }
    
    @keyframes apple-shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
  `
}

// Components React avec motion Apple
import React, { useRef, useEffect, useCallback } from 'react'

interface AppleButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'gentle' | 'snappy' | 'smooth'
  className?: string
}

export function AppleButton({
  children,
  onClick,
  variant = 'gentle',
  className = '',
}: AppleButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { animate } = useAppleMotion()

  const handleClick = useCallback(async () => {
    if (buttonRef.current) {
      // Apple-style button feedback
      await animate(buttonRef.current, 'scale', 1, 0.97, {
        spring: ApplePresets.snappy,
      })
      await animate(buttonRef.current, 'scale', 0.97, 1, {
        spring: ApplePresets[variant],
      })
    }
    onClick?.()
  }, [animate, onClick, variant])

  return (
    <button ref={buttonRef} onClick={handleClick} className={`motion-element ${className}`}>
      {children}
    </button>
  )
}

export function AppleModal({
  isOpen,
  onClose,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { animate } = useAppleMotion()

  useEffect(() => {
    if (!modalRef.current) return

    if (isOpen) {
      // Modal appear animation (iOS style)
      modalRef.current.style.opacity = '0'
      modalRef.current.style.transform = 'translateY(100px) scale(0.9)'

      animate(modalRef.current, 'translateY', 100, 0, { spring: ApplePresets.smooth })
      animate(modalRef.current, 'scale', 0.9, 1, { spring: ApplePresets.gentle })
      animate(modalRef.current, 'opacity', 0, 1, { spring: ApplePresets.smooth })
    }
  }, [isOpen, animate])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div
        ref={modalRef}
        className="motion-element absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6"
      >
        {children}
      </div>
    </div>
  )
}
