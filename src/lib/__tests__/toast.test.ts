import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock sonner
const mockToast = vi.fn() as any
mockToast.success = vi.fn()
mockToast.error = vi.fn()
mockToast.warning = vi.fn()
mockToast.info = vi.fn()
mockToast.promise = vi.fn()
mockToast.dismiss = vi.fn()

vi.mock('sonner', () => ({
  toast: mockToast,
}))

// Mock ToastIcons
vi.mock('../../components/ui/ToastIcons', () => ({
  AnimatedCheckmark: vi.fn(() => null),
  AnimatedXMark: vi.fn(() => null),
  AnimatedWarning: vi.fn(() => null),
  AnimatedInfo: vi.fn(() => null),
}))

// Mock Capacitor (not native by default in tests)
vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    notification: vi.fn(),
    impact: vi.fn(),
  },
  NotificationType: { Success: 'SUCCESS', Error: 'ERROR', Warning: 'WARNING' },
  ImpactStyle: { Medium: 'MEDIUM' },
}))

describe('toast', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Ensure not native by default
    ;(globalThis as any).Capacitor = undefined
  })

  describe('showSuccess', () => {
    it('should call toast.success with correct message', async () => {
      const { showSuccess } = await import('../toast')
      showSuccess('Operation reussie')

      expect(mockToast.success).toHaveBeenCalledWith(
        'Operation reussie',
        expect.objectContaining({
          id: 'success-Operation reussie',
          duration: 4000,
        })
      )
    })

    it('should deduplicate by message using id', async () => {
      const { showSuccess } = await import('../toast')
      showSuccess('Same message')
      showSuccess('Same message')

      // Both calls should use the same id
      const calls = mockToast.success.mock.calls
      expect(calls[0][1].id).toBe('success-Same message')
      expect(calls[1][1].id).toBe('success-Same message')
    })

    it('should include --toast-duration CSS variable', async () => {
      const { showSuccess } = await import('../toast')
      showSuccess('Test')

      const options = mockToast.success.mock.calls[0][1]
      expect(options.style['--toast-duration']).toBe('4s')
    })

    it('should include an icon element', async () => {
      const { showSuccess } = await import('../toast')
      showSuccess('Test')

      const options = mockToast.success.mock.calls[0][1]
      expect(options.icon).toBeDefined()
    })
  })

  describe('showError', () => {
    it('should call toast.error with 5000ms duration', async () => {
      const { showError } = await import('../toast')
      showError('Something broke')

      expect(mockToast.error).toHaveBeenCalledWith(
        'Something broke',
        expect.objectContaining({
          id: 'error-Something broke',
          duration: 5000,
        })
      )
    })

    it('should set --toast-duration to 5s', async () => {
      const { showError } = await import('../toast')
      showError('Err')

      const options = mockToast.error.mock.calls[0][1]
      expect(options.style['--toast-duration']).toBe('5s')
    })
  })

  describe('showWarning', () => {
    it('should call toast.warning with 4000ms duration', async () => {
      const { showWarning } = await import('../toast')
      showWarning('Attention!')

      expect(mockToast.warning).toHaveBeenCalledWith(
        'Attention!',
        expect.objectContaining({
          id: 'warning-Attention!',
          duration: 4000,
        })
      )
    })
  })

  describe('showInfo', () => {
    it('should call toast.info with 3000ms duration', async () => {
      const { showInfo } = await import('../toast')
      showInfo('FYI')

      expect(mockToast.info).toHaveBeenCalledWith(
        'FYI',
        expect.objectContaining({
          id: 'info-FYI',
          duration: 3000,
        })
      )
    })

    it('should set --toast-duration to 3s', async () => {
      const { showInfo } = await import('../toast')
      showInfo('Info')

      const options = mockToast.info.mock.calls[0][1]
      expect(options.style['--toast-duration']).toBe('3s')
    })
  })

  describe('showLoading', () => {
    it('should call toast.promise with the provided promise and messages', async () => {
      const { showLoading } = await import('../toast')
      const promise = Promise.resolve('ok')
      const messages = {
        loading: 'Loading...',
        success: 'Done!',
        error: 'Failed!',
      }

      showLoading(promise, messages)

      expect(mockToast.promise).toHaveBeenCalledWith(promise, messages)
    })

    it('should support function callbacks for success/error messages', async () => {
      const { showLoading } = await import('../toast')
      const promise = Promise.resolve(42)
      const successFn = (data: number) => `Got ${data}`
      const errorFn = (err: unknown) => `Error: ${err}`
      const messages = {
        loading: 'Working...',
        success: successFn,
        error: errorFn,
      }

      showLoading(promise, messages)

      expect(mockToast.promise).toHaveBeenCalledWith(promise, messages)
    })
  })

  describe('dismissAll', () => {
    it('should call toast.dismiss()', async () => {
      const { dismissAll } = await import('../toast')
      dismissAll()

      expect(mockToast.dismiss).toHaveBeenCalled()
    })
  })

  describe('showWithAction', () => {
    it('should call toast with action label and onClick', async () => {
      const { showWithAction } = await import('../toast')
      const onClick = vi.fn()

      showWithAction('Confirm?', { label: 'Yes', onClick })

      expect(mockToast).toHaveBeenCalledWith('Confirm?', {
        action: {
          label: 'Yes',
          onClick,
        },
      })
    })
  })

  describe('showWithUndo', () => {
    it('should call toast with Annuler action label and default 5000ms duration', async () => {
      const { showWithUndo } = await import('../toast')
      const undoFn = vi.fn()

      showWithUndo('Deleted', undoFn)

      expect(mockToast).toHaveBeenCalledWith('Deleted', {
        duration: 5000,
        action: {
          label: 'Annuler',
          onClick: undoFn,
        },
        style: { '--toast-duration': '5s' },
      })
    })

    it('should use custom duration when provided', async () => {
      const { showWithUndo } = await import('../toast')
      const undoFn = vi.fn()

      showWithUndo('Removed', undoFn, 10000)

      expect(mockToast).toHaveBeenCalledWith(
        'Removed',
        expect.objectContaining({
          duration: 10000,
          style: { '--toast-duration': '10s' },
        })
      )
    })
  })

  describe('showProgress', () => {
    it('should call toast.promise with default success/error messages', async () => {
      const { showProgress } = await import('../toast')
      const promise = Promise.resolve('data')

      showProgress('Uploading...', promise)

      expect(mockToast.promise).toHaveBeenCalledWith(promise, {
        loading: 'Uploading...',
        success: 'Fait !',
        error: 'Une erreur est survenue',
      })
    })

    it('should use custom success/error messages when provided', async () => {
      const { showProgress } = await import('../toast')
      const promise = Promise.resolve('data')

      showProgress('Saving...', promise, {
        success: 'Saved!',
        error: 'Save failed!',
      })

      expect(mockToast.promise).toHaveBeenCalledWith(promise, {
        loading: 'Saving...',
        success: 'Saved!',
        error: 'Save failed!',
      })
    })

    it('should fall back to defaults when messages object is partially provided', async () => {
      const { showProgress } = await import('../toast')
      const promise = Promise.resolve('data')

      showProgress('Working...', promise, { success: 'OK!' })

      expect(mockToast.promise).toHaveBeenCalledWith(promise, {
        loading: 'Working...',
        success: 'OK!',
        error: 'Une erreur est survenue',
      })
    })
  })

  describe('isNativeApp detection', () => {
    it('should not trigger haptics when not on native platform', async () => {
      const hapticsMod = await import('@capacitor/haptics')
      const { showSuccess } = await import('../toast')

      showSuccess('Test')

      // Haptics should not be called since Capacitor is not present
      expect(hapticsMod.Haptics.notification).not.toHaveBeenCalled()
    })
  })

  describe('re-export', () => {
    it('should re-export toast from sonner', async () => {
      const mod = await import('../toast')
      expect(mod.toast).toBeDefined()
    })
  })
})
