import { Dialog, DialogBody, DialogFooter } from './Dialog'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  isLoading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} size="sm" title={title}>
      <DialogBody>
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            variant === 'danger' ? 'bg-error-10' : 'bg-warning/10'
          }`}>
            <AlertTriangle className={`w-5 h-5 ${
              variant === 'danger' ? 'text-error' : 'text-warning'
            }`} />
          </div>
          <p className="text-md text-text-secondary">{description}</p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isLoading}
          aria-label={confirmLabel}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}
