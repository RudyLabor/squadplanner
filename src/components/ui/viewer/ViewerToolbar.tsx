import { m } from 'framer-motion'
import { X, ZoomIn, ZoomOut, Download, RotateCw } from '../../icons'
interface ViewerToolbarProps {
  alt: string
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onRotate: () => void
  onDownload: () => void
  onClose: () => void
}

export function ViewerToolbar({
  alt,
  scale,
  onZoomIn,
  onZoomOut,
  onRotate,
  onDownload,
  onClose,
}: ViewerToolbarProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
    >
      <p className="text-sm text-white/70 truncate max-w-[200px]">{alt}</p>

      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="p-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Dézoomer"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-xs text-white/50 min-w-[3rem] text-center font-mono">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          className="p-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Zoomer"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={onRotate}
          className="p-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Pivoter"
        >
          <RotateCw className="w-5 h-5" />
        </button>
        <button
          onClick={onDownload}
          className="p-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Télécharger"
        >
          <Download className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-white/20 mx-1" />
        <button
          onClick={onClose}
          className="p-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </m.div>
  )
}
