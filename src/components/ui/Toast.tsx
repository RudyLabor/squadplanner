import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { m, AnimatePresence, useMotionValue, useTransform, type PanInfo } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from '../icons'
// --- Types ---
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'default'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastData {
  id: string
  message: string
  type?: ToastType
  duration?: number
  action?: ToastAction
  icon?: ReactNode
  dismissible?: boolean
}

type ToastEntry = ToastData & { createdAt: number }

// --- Store (simple pub/sub, no external deps) ---
let toasts: ToastEntry[] = []
let listeners: Array<() => void> = []
let nextId = 0

function emit() {
  listeners.forEach((fn) => fn())
}

function addToast(data: Omit<ToastData, 'id'>): string {
  const id = `toast-${++nextId}`
  const entry: ToastEntry = {
    ...data,
    id,
    createdAt: Date.now(),
    duration: data.duration ?? 4000,
    dismissible: data.dismissible ?? true,
  }
  toasts = [...toasts, entry]
  // Queue: max 5 visible
  if (toasts.length > 5) toasts = toasts.slice(-5)
  emit()
  return id
}

function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function clearAll() {
  toasts = []
  emit()
}

// Public API (replaces Sonner calls)
export const toast = {
  success: (message: string, opts?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) =>
    addToast({ message, type: 'success', ...opts }),
  error: (message: string, opts?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) =>
    addToast({ message, type: 'error', duration: 5000, ...opts }),
  warning: (message: string, opts?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) =>
    addToast({ message, type: 'warning', ...opts }),
  info: (message: string, opts?: Partial<Omit<ToastData, 'id' | 'message' | 'type'>>) =>
    addToast({ message, type: 'info', duration: 3000, ...opts }),
  show: (message: string, opts?: Partial<Omit<ToastData, 'id' | 'message'>>) =>
    addToast({ message, ...opts }),
  dismiss: (id?: string) => (id ? removeToast(id) : clearAll()),
}

// --- Hook ---
function useToasts() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const listener = () => setTick((t) => t + 1)
    listeners.push(listener)
    return () => {
      listeners = listeners.filter((l) => l !== listener)
    }
  }, [])
  return toasts
}

// --- Icons (lazy to avoid TDZ in minified builds) ---
function getTypeIcon(type: ToastType): ReactNode {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-success" />
    case 'error':
      return <AlertCircle className="w-5 h-5 text-error" />
    case 'warning':
      return <AlertTriangle className="w-5 h-5 text-warning" />
    case 'info':
      return <Info className="w-5 h-5 text-primary" />
    default:
      return null
  }
}

const typeBorderColors: Record<ToastType, string> = {
  success: 'border-success/20',
  error: 'border-error/20',
  warning: 'border-warning/20',
  info: 'border-primary/20',
  default: 'border-border-default',
}

const typeProgressColors: Record<ToastType, string> = {
  success: 'bg-success',
  error: 'bg-error',
  warning: 'bg-warning',
  info: 'bg-primary',
  default: 'bg-text-tertiary',
}

// Type-specific animation variants
const getToastAnimationVariants = (type: ToastType) => {
  switch (type) {
    case 'success':
      return {
        initial: { opacity: 0, x: 400, y: 0 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: 400, y: 0 },
      }
    case 'error':
      return {
        initial: { opacity: 0, x: 400, y: 0 },
        animate: { opacity: 1, x: [0, -2, 2, 0], y: 0 },
        exit: { opacity: 0, x: 400, y: 0 },
      }
    case 'warning':
      return {
        initial: { opacity: 0, x: 400, y: 0 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: 400, y: 0 },
      }
    default:
      return {
        initial: { opacity: 0, x: 400, y: 0 },
        animate: { opacity: 1, x: 0, y: 0 },
        exit: { opacity: 0, x: 400, y: 0 },
      }
  }
}

// --- Single Toast Item ---
function ToastItem({ data, onDismiss }: { data: ToastEntry; onDismiss: (id: string) => void }) {
  const [paused, setPaused] = useState(false)
  const remainingRef = useRef(data.duration ?? 4000)
  const startRef = useRef(Date.now())
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-150, 0, 150], [0, 1, 0])
  const type = data.type ?? 'default'
  const animationVariants = getToastAnimationVariants(type)

  // Auto-dismiss timer with pause support
  useEffect(() => {
    if (paused || !data.duration) return
    startRef.current = Date.now()
    const timeout = setTimeout(() => onDismiss(data.id), remainingRef.current)
    return () => {
      remainingRef.current -= Date.now() - startRef.current
      clearTimeout(timeout)
    }
  }, [paused, data.id, data.duration, onDismiss])

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 80) {
      onDismiss(data.id)
    }
  }

  return (
    <m.div
      layout
      initial={animationVariants.initial}
      animate={animationVariants.animate}
      exit={animationVariants.exit}
      transition={
        type === 'error'
          ? { type: 'spring', stiffness: 400, damping: 30 }
          : { type: 'spring', stiffness: 300, damping: 25 }
      }
      style={{ x, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.5}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="alert"
      aria-live="polite"
      className={`relative w-full max-w-sm bg-bg-elevated border ${typeBorderColors[type]} rounded-xl shadow-lg overflow-hidden cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <div className="shrink-0 mt-0.5" aria-hidden="true">
          {data.icon ?? getTypeIcon(type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary">{data.message}</p>
          {data.action && (
            <button
              onClick={() => {
                data.action!.onClick()
                onDismiss(data.id)
              }}
              className="mt-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              {data.action.label}
            </button>
          )}
        </div>

        {/* Close */}
        {data.dismissible !== false && (
          <button
            onClick={() => onDismiss(data.id)}
            className="shrink-0 p-0.5 rounded-md text-text-quaternary hover:text-text-secondary hover:bg-bg-hover transition-colors"
            aria-label="Fermer la notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Timer progress bar */}
      {data.duration && data.duration > 0 && (
        <div className="h-0.5 w-full bg-border-subtle">
          <m.div
            className={`h-full ${typeProgressColors[type]}`}
            initial={{ width: '100%' }}
            animate={{ width: paused ? undefined : '0%' }}
            transition={{
              duration: (paused ? remainingRef.current : data.duration) / 1000,
              ease: 'linear',
            }}
          />
        </div>
      )}
    </m.div>
  )
}

// --- Toast Container (mount once in App) ---
export function ToastContainer() {
  const items = useToasts()
  const handleDismiss = useCallback((id: string) => removeToast(id), [])

  return (
    <div
      aria-label="Notifications"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none"
    >
      <AnimatePresence mode="popLayout">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto w-full">
            <ToastItem data={t} onDismiss={handleDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
