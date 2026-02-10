import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ViewerToolbar } from './viewer/ViewerToolbar'

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
  const touchState = useRef<TouchState>({ initialDistance: 0, initialScale: 1, lastTap: 0, isPinching: false, isPanning: false, panStart: { x: 0, y: 0 } })

  useEffect(() => {
    if (isOpen) {
      setScale(1); setRotation(0); setPosition({ x: 0, y: 0 })
      positionRef.current = { x: 0, y: 0 }; scaleRef.current = 1
      touchState.current = { initialDistance: 0, initialScale: 1, lastTap: 0, isPinching: false, isPanning: false, panStart: { x: 0, y: 0 } }
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': onClose(); break
        case '+': case '=': setScale(s => { const n = Math.min(s + 0.25, 5); scaleRef.current = n; return n }); break
        case '-': setScale(s => { const n = Math.max(s - 0.25, 0.25); scaleRef.current = n; return n }); break
        case 'r': setRotation(r => r + 90); break
        case '0': setScale(1); scaleRef.current = 1; setRotation(0); setPosition({ x: 0, y: 0 }); positionRef.current = { x: 0, y: 0 }; break
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    setScale(s => { const next = Math.max(0.25, Math.min(5, s + delta)); scaleRef.current = next; return next })
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return; e.preventDefault(); setIsDragging(true)
    dragStart.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y }
  }, [scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const newPos = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }
    positionRef.current = newPos; setPosition(newPos)
  }, [isDragging])

  const handleMouseUp = useCallback(() => { setIsDragging(false) }, [])

  const handleDoubleClick = useCallback(() => {
    if (scale > 1) { setScale(1); scaleRef.current = 1; setPosition({ x: 0, y: 0 }); positionRef.current = { x: 0, y: 0 } }
    else { setScale(2.5); scaleRef.current = 2.5 }
  }, [scale])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      touchState.current.initialDistance = getTouchDistance(e.touches[0], e.touches[1])
      touchState.current.initialScale = scaleRef.current
      touchState.current.isPinching = true; touchState.current.isPanning = false; setIsTouching(true)
    } else if (e.touches.length === 1) {
      const now = Date.now(); const dt = now - touchState.current.lastTap; touchState.current.lastTap = now
      if (dt < 300 && dt > 0) {
        e.preventDefault()
        if (scaleRef.current > 1) { setScale(1); scaleRef.current = 1; setPosition({ x: 0, y: 0 }); positionRef.current = { x: 0, y: 0 } }
        else { setScale(2); scaleRef.current = 2 }
        touchState.current.lastTap = 0; return
      }
      if (scaleRef.current > 1) {
        touchState.current.isPanning = true
        touchState.current.panStart = { x: e.touches[0].clientX - positionRef.current.x, y: e.touches[0].clientY - positionRef.current.y }
        setIsTouching(true)
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchState.current.isPinching && e.touches.length === 2) {
      e.preventDefault()
      const dist = getTouchDistance(e.touches[0], e.touches[1])
      const newScale = Math.max(0.5, Math.min(5, touchState.current.initialScale * (dist / touchState.current.initialDistance)))
      scaleRef.current = newScale; setScale(newScale)
    } else if (touchState.current.isPanning && e.touches.length === 1) {
      e.preventDefault()
      const newPos = { x: e.touches[0].clientX - touchState.current.panStart.x, y: e.touches[0].clientY - touchState.current.panStart.y }
      positionRef.current = newPos; setPosition(newPos)
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) touchState.current.isPinching = false
    if (e.touches.length === 0) { touchState.current.isPanning = false; setIsTouching(false) }
  }, [])

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(src); const blob = await response.blob(); const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = alt || 'image'
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
    } catch { window.open(src, '_blank') }
  }, [src, alt])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog" aria-modal="true" aria-label={`Image viewer: ${alt}`}
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <ViewerToolbar
            alt={alt} scale={scale}
            onZoomIn={() => setScale(s => { const n = Math.min(s + 0.25, 5); scaleRef.current = n; return n })}
            onZoomOut={() => setScale(s => { const n = Math.max(s - 0.25, 0.25); scaleRef.current = n; return n })}
            onRotate={() => setRotation(r => r + 90)}
            onDownload={handleDownload}
            onClose={onClose}
          />

          <motion.div
            className={`select-none ${scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{ touchAction: 'none' }}
            onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <img src={src} alt={alt} draggable={false}
              style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`, transition: isDragging || isTouching ? 'none' : 'transform 0.2s ease-out', maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', willChange: isTouching ? 'transform' : 'auto' }}
              className="rounded-lg"
            />
          </motion.div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm text-white/30 max-sm:hidden">
            <span>Scroll: zoom</span><span>Double-clic: zoom 2.5x</span><span>R: pivoter</span><span>0: reset</span><span>Esc: fermer</span>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 text-sm text-white/30 sm:hidden">
            <span>Pincer: zoom</span><span>Double-tap: zoom 2x</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ImageViewer
