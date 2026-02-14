import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement, createRef } from 'react'
import { MessageComposer } from '../MessageComposer'

// Mock icons
vi.mock('../../icons', () => ({
  Send: (props: any) => createElement('svg', { ...props, 'data-testid': 'send-icon' }),
  Loader2: (props: any) => createElement('svg', { ...props, 'data-testid': 'loader-icon' }),
  BarChart3: (props: any) => createElement('svg', { ...props, 'data-testid': 'poll-icon' }),
}))

// Mock UI Button
vi.mock('../../ui', () => ({
  Button: ({ children, disabled, type, ...props }: any) =>
    createElement('button', { type, disabled, ...props }, children),
}))

// Mock MentionInput
vi.mock('../../MentionInput', () => ({
  MentionInput: ({ value, onChange, placeholder, disabled }: any) =>
    createElement('input', {
      'data-testid': 'mention-input',
      value,
      onChange: (e: any) => onChange(e.target.value),
      placeholder,
      disabled,
    }),
}))

// Mock GifPicker
vi.mock('../../GifPicker', () => ({
  GifPicker: ({ isOpen, onSelect, onClose }: any) =>
    isOpen ? createElement('div', { 'data-testid': 'gif-picker' }, 'GIF Picker') : null,
}))

// Mock VoiceRecorder
vi.mock('../../VoiceRecorder', () => ({
  VoiceRecorder: ({ onSend, disabled }: any) =>
    createElement('button', { 'data-testid': 'voice-recorder', disabled }, 'Voice'),
}))

// Mock LocationShare
vi.mock('../../LocationShare', () => ({
  LocationShareButton: ({ onShare, disabled }: any) =>
    createElement('button', { 'data-testid': 'location-share', disabled }, 'Location'),
}))

// Mock ReplyComposer
vi.mock('../../ReplyComposer', () => ({
  ReplyComposer: ({ replyingTo, onCancel }: any) =>
    replyingTo
      ? createElement('div', { 'data-testid': 'reply-composer' }, [
          createElement('span', { key: 's' }, replyingTo.sender_username),
          createElement('button', { key: 'c', onClick: onCancel, 'data-testid': 'cancel-reply' }, 'Cancel'),
        ])
      : null,
}))

const defaultProps = {
  embedded: false,
  isSquadChat: false,
  chatName: 'TestChat',
  newMessage: '',
  isSending: false,
  showGifPicker: false,
  replyingTo: null,
  mentionMembers: [],
  inputRef: createRef<HTMLInputElement>(),
  onMessageChange: vi.fn(),
  onInputChange: vi.fn(),
  onSubmit: vi.fn(),
  onCancelReply: vi.fn(),
  onToggleGifPicker: vi.fn(),
  onGifSelect: vi.fn(),
  onLocationShare: vi.fn(),
  onVoiceSend: vi.fn(),
  onShowPollModal: vi.fn(),
  onTyping: vi.fn(),
}

describe('MessageComposer', () => {
  it('renders without crashing', () => {
    const { container } = render(<MessageComposer {...defaultProps} />)
    expect(container).toBeTruthy()
  })

  it('shows plain input for non-squad chat', () => {
    render(<MessageComposer {...defaultProps} isSquadChat={false} />)
    expect(screen.getByPlaceholderText('Message a TestChat...')).toBeInTheDocument()
  })

  it('shows MentionInput for squad chat', () => {
    render(<MessageComposer {...defaultProps} isSquadChat={true} />)
    expect(screen.getByTestId('mention-input')).toBeInTheDocument()
  })

  it('shows send button', () => {
    render(<MessageComposer {...defaultProps} />)
    expect(screen.getByLabelText('Envoyer le message')).toBeInTheDocument()
  })

  it('disables send button when message is empty', () => {
    render(<MessageComposer {...defaultProps} newMessage="" />)
    expect(screen.getByLabelText('Envoyer le message')).toBeDisabled()
  })

  it('enables send button when message has content', () => {
    render(<MessageComposer {...defaultProps} newMessage="Hello" />)
    expect(screen.getByLabelText('Envoyer le message')).not.toBeDisabled()
  })

  it('disables send button when sending', () => {
    render(<MessageComposer {...defaultProps} newMessage="Hello" isSending={true} />)
    expect(screen.getByLabelText('Envoyer le message')).toBeDisabled()
  })

  it('shows loader icon when sending', () => {
    render(<MessageComposer {...defaultProps} newMessage="Hello" isSending={true} />)
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument()
  })

  it('shows GIF button', () => {
    render(<MessageComposer {...defaultProps} />)
    expect(screen.getByLabelText('Envoyer un GIF')).toBeInTheDocument()
  })

  it('calls onToggleGifPicker when GIF button is clicked', () => {
    const onToggleGifPicker = vi.fn()
    render(<MessageComposer {...defaultProps} onToggleGifPicker={onToggleGifPicker} />)
    fireEvent.click(screen.getByLabelText('Envoyer un GIF'))
    expect(onToggleGifPicker).toHaveBeenCalledOnce()
  })

  it('shows GIF picker when showGifPicker is true', () => {
    render(<MessageComposer {...defaultProps} showGifPicker={true} />)
    expect(screen.getByTestId('gif-picker')).toBeInTheDocument()
  })

  it('shows poll button for squad chats', () => {
    render(<MessageComposer {...defaultProps} isSquadChat={true} />)
    expect(screen.getByLabelText('Créer un sondage')).toBeInTheDocument()
  })

  it('hides poll button for non-squad chats', () => {
    render(<MessageComposer {...defaultProps} isSquadChat={false} />)
    expect(screen.queryByLabelText('Créer un sondage')).not.toBeInTheDocument()
  })

  it('calls onShowPollModal when poll button is clicked', () => {
    const onShowPollModal = vi.fn()
    render(<MessageComposer {...defaultProps} isSquadChat={true} onShowPollModal={onShowPollModal} />)
    fireEvent.click(screen.getByLabelText('Créer un sondage'))
    expect(onShowPollModal).toHaveBeenCalledOnce()
  })

  it('shows voice recorder when no message typed', () => {
    render(<MessageComposer {...defaultProps} newMessage="" />)
    expect(screen.getByTestId('voice-recorder')).toBeInTheDocument()
  })

  it('hides voice recorder when message has content', () => {
    render(<MessageComposer {...defaultProps} newMessage="Hello" />)
    expect(screen.queryByTestId('voice-recorder')).not.toBeInTheDocument()
  })

  it('shows location share button', () => {
    render(<MessageComposer {...defaultProps} />)
    expect(screen.getByTestId('location-share')).toBeInTheDocument()
  })

  it('shows reply preview when replyingTo is set', () => {
    render(
      <MessageComposer
        {...defaultProps}
        replyingTo={{ id: 'msg-1', content: 'Original', sender: 'Alice' }}
      />
    )
    expect(screen.getByTestId('reply-composer')).toBeInTheDocument()
  })

  it('calls onSubmit on form submit', () => {
    const onSubmit = vi.fn((e) => e.preventDefault())
    render(<MessageComposer {...defaultProps} onSubmit={onSubmit} newMessage="Hello" />)
    fireEvent.submit(screen.getByLabelText('Envoyer le message').closest('form')!)
    expect(onSubmit).toHaveBeenCalledOnce()
  })

  it('calls onInputChange for non-squad input changes', () => {
    const onInputChange = vi.fn()
    render(<MessageComposer {...defaultProps} isSquadChat={false} onInputChange={onInputChange} />)
    fireEvent.change(screen.getByPlaceholderText('Message a TestChat...'), {
      target: { value: 'test' },
    })
    expect(onInputChange).toHaveBeenCalled()
  })
})
