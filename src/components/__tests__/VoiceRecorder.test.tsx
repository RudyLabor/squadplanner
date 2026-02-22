import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { VoiceRecorder } from '../VoiceRecorder'

// Mock icons
vi.mock('../icons', () => ({
  Mic: (props: any) => createElement('svg', { 'data-testid': 'icon-mic', ...props }),
  Square: (props: any) => createElement('svg', { 'data-testid': 'icon-square', ...props }),
  Send: (props: any) => createElement('svg', { 'data-testid': 'icon-send', ...props }),
  Trash2: (props: any) => createElement('svg', { 'data-testid': 'icon-trash', ...props }),
  Loader2: (props: any) => createElement('svg', { 'data-testid': 'icon-loader', ...props }),
}))

// Mock browser APIs
const mockMediaStream = {
  getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
}

const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  state: 'inactive',
  ondataavailable: null as any,
  onstop: null as any,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

vi.stubGlobal(
  'MediaRecorder',
  vi.fn().mockImplementation(() => mockMediaRecorder)
)
Object.defineProperty(MediaRecorder, 'isTypeSupported', {
  value: vi.fn().mockReturnValue(true),
})

Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
  },
  writable: true,
})

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('blob:test-url'),
  revokeObjectURL: vi.fn(),
})

describe('VoiceRecorder', () => {
  const mockOnSend = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = render(<VoiceRecorder onSend={mockOnSend} />)
    expect(container.firstChild).toBeTruthy()
  })

  it('shows mic button in idle state', () => {
    render(<VoiceRecorder onSend={mockOnSend} />)
    expect(screen.getByLabelText('Message vocal')).toBeInTheDocument()
  })

  it('shows mic icon in idle state', () => {
    render(<VoiceRecorder onSend={mockOnSend} />)
    expect(screen.getByTestId('icon-mic')).toBeInTheDocument()
  })

  it('disables mic button when disabled prop is true', () => {
    render(<VoiceRecorder onSend={mockOnSend} disabled={true} />)
    const button = screen.getByLabelText('Message vocal')
    expect(button).toBeDisabled()
  })

  it('does not disable mic button when disabled prop is false', () => {
    render(<VoiceRecorder onSend={mockOnSend} disabled={false} />)
    const button = screen.getByLabelText('Message vocal')
    expect(button).not.toBeDisabled()
  })

  it('requests microphone access when record button is clicked', async () => {
    render(<VoiceRecorder onSend={mockOnSend} />)
    fireEvent.click(screen.getByLabelText('Message vocal'))
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
  })

  it('has correct aria-label on mic button', () => {
    render(<VoiceRecorder onSend={mockOnSend} />)
    expect(screen.getByLabelText('Message vocal')).toBeInTheDocument()
  })
})
