import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Download, RotateCw } from 'lucide-react'

interface ImageViewerProps {
  src: string
  alt?: string
  isOpen: boolean
  onClose: () => void
}

interface TouchState {
  initialDistance: number
  initialScale: number
  lastTap: number
  isPinching: boolean
  isPanning: boolean
  panStart: { x: number; y: number }
}

function getTouchDistance(t1: Touch, t2: Touch): number {
  const dx = t1.clientX - t2.clientX
  const dy = t1.clientY - t2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}


export function ImageViewer({ src, alt = 'Image', isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const positionRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const touchState = useRef<TouchState>({
    initialDistance: 0,
    initialScale: 1,
    lastTap: 0,
    isPinching: false,
    isPanning: false,
    panStart: { x: 0, y: 0 },
  })

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
      positionRef.current = { x: 0, y: 0 }
      scaleRef.current = 1
      touchState.current = {
        initialDistance: 0,
        initialScale: 1,
        lastTap: 0,
        isPinching: false,
        isPanning: false,
        panStart: { x: 0, y: 0 },
      }
    }
  }, [isOpen])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          setScale(s => { const n = Math.min(s + 0.25, 5); scaleRef.current = n; return n })
          break
        case '-':
          setScale(s => { const n = Math.max(s - 0.25, 0.25); scaleRef.current = n; return n })
          break
        case 'r':
          setRotation(r => r + 90)
          break
        case '0':
          setScale(1)
          scaleRef.current = 1
          setRotation(0)
          setPosition({ x: 0, y: 0 })
          positionRef.current = { x: 0, y: 0 }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setScale(s => {
      const next = Math.max(0.25, Math.min(5, s + delta))
      scaleRef.current = next
      return next
    })
  }, [])

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y }
  }, [scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const newPos = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    }
    positionRef.current = newPos
    setPosition(newPos)
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback(() => {
    if (scale > 1) {
      setScale(1)
      scaleRef.current = 1
      setPosition({ x: 0, y: 0 })
      positionRef.current = { x: 0, y: 0 }
    } else {
      setScale(2.5)
      scaleRef.current = 2.5
    }
  }, [scale])

  // Touch handlers for pinch-to-zoom and pan
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch start
      e.preventDefault()
      const dist = getTouchDistance(e.touches[0], e.touches[1])
      touchState.current.initialDistance = dist
      touchState.current.initialScale = scaleRef.current
      touchState.current.isPinching = true
      touchState.current.isPanning = false
      setIsTouching(true)
    } else if (e.touches.length === 1) {
      // Check for double-tap
      const now = Date.now()
      const dt = now - touchState.current.lastTap
      touchState.current.lastTap = now

      if (dt < 300 && dt > 0) {
        // Double-tap detected
        e.preventDefault()
        if (scaleRef.current > 1) {
          setScale(1)
          scaleRef.current = 1
          setPosition({ x: 0, y: 0 })
          positionRef.current = { x: 0, y: 0 }
        } else {
          const newScale = 2
          setScale(newScale)
          scaleRef.current = newScale
        }
        touchState.current.lastTap = 0 // reset to prevent triple-tap
        return
      }

      // Single finger pan (only when zoomed in)
      if (scaleRef.current > 1) {
        touchState.current.isPanning = true
        touchState.current.panStart = {
          x: e.touches[0].clientX - positionRef.current.x,
          y: e.touches[0].clientY - positionRef.current.y,
        }
        setIsTouching(true)
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchState.current.isPinching && e.touches.length === 2) {
      e.preventDefault()
      const dist = getTouchDistance(e.touches[0], e.touches[1])
      const ratio = dist / touchState.current.initialDistance
      const newScale = Math.max(0.5, Math.min(5, touchState.current.initialScale * ratio))
      scaleRef.current = newScale
      setScale(newScale)

    } else if (touchState.current.isPanning && e.touches.length === 1) {
      e.preventDefault()
      const newPos = {
        x: e.touches[0].clientX - touchState.current.panStart.x,
        y: e.touches[0].clientY - touchState.current.panStart.y,
      }
      positionRef.current = newPos
      setPosition(newPos)
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      touchState.current.isPinching = false
    }
    if (e.touches.length === 0) {
      touchState.current.isPanning = false
      setIsTouching(false)
    }
  }, [])

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank')
    }
  }, [src, alt])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer: ${alt}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
          >
            {/* Title */}
            <p className="text-sm text-white/70 truncate max-w-[200px]">{alt}</p>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setScale(s => { const n = Math.max(s - 0.25, 0.25); scaleRef.current = n; return n })}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Dézoomer"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <span className="text-xs text-white/50 min-w-[3rem] text-center font-mono">
                {Math.round(scale * 100)}%
              </span>

              <button
                onClick={() => setScale(s => { const n = Math.min(s + 0.25, 5); scaleRef.current = n; return n })}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Zoomer"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={() => setRotation(r => r + 90)}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Pivoter"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleDownload}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Télécharger"
              >
                <Download className="w-5 h-5" />
              </button>

              <div className="w-px h-5 bg-white/20 mx-1" />

              <button
                onClick={onClose}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>

          {/* Image container */}
          <motion.div
            className={`select-none ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{ touchAction: 'none' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging || isTouching ? 'none' : 'transform 0.2s ease-out',
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                willChange: isTouching ? 'transform' : 'auto',
              }}
              className="rounded-lg"
            />
          </motion.div>

          {/* Keyboard hints */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm text-white/30 max-sm:hidden">
            <span>Scroll: zoom</span>
            <span>Double-clic: zoom 2.5x</span>
            <span>R: pivoter</span>
            <span>0: reset</span>
            <span>Esc: fermer</span>
          </div>
          {/* Touch hints (mobile only) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm text-white/30 sm:hidden">
            <span>Pincer: zoom</span>
            <span>Double-tap: zoom 2x</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ImageViewer
