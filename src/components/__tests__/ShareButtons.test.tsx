import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareButtons } from '../ShareButtons'

describe('ShareButtons — real component render, zero mocks', () => {
  const defaultProps = {
    url: 'https://squadplanner.fr/s/abc123',
    title: 'Session Valorant ce soir',
    text: 'Rejoins notre session Valorant !',
  }

  it('renders WhatsApp share link with correct href', () => {
    render(<ShareButtons {...defaultProps} />)
    const whatsappLink = screen.getByText('WhatsApp').closest('a')!
    expect(whatsappLink).toBeTruthy()
    expect(whatsappLink.href).toContain('wa.me')
    expect(whatsappLink.href).toContain(encodeURIComponent(defaultProps.url))
    expect(whatsappLink.target).toBe('_blank')
    expect(whatsappLink.rel).toContain('noopener')
  })

  it('renders Twitter/X share link with correct href', () => {
    render(<ShareButtons {...defaultProps} />)
    const twitterLink = screen.getByText('Twitter').closest('a')!
    expect(twitterLink).toBeTruthy()
    expect(twitterLink.href).toContain('twitter.com/intent/tweet')
    expect(twitterLink.href).toContain(encodeURIComponent(defaultProps.url))
    expect(twitterLink.target).toBe('_blank')
  })

  it('renders copy button with "Copier" text', () => {
    render(<ShareButtons {...defaultProps} />)
    expect(screen.getByText('Copier')).toBeTruthy()
  })

  it('uses title as text when text prop is not provided', () => {
    render(<ShareButtons url="https://test.com" title="Mon titre" />)
    const whatsappLink = screen.getByText('WhatsApp').closest('a')!
    expect(whatsappLink.href).toContain(encodeURIComponent('Mon titre'))
  })

  it('copy button changes to "Copié !" after click', async () => {
    // In jsdom, clipboard.writeText throws, so the fallback path runs
    // We verify the UI state change (Copier → Copié !)
    const user = userEvent.setup()
    render(<ShareButtons {...defaultProps} />)

    const copyBtn = screen.getByText('Copier')
    await user.click(copyBtn)

    // After click, the button text should change to "Copié !"
    // (via the fallback execCommand path in jsdom)
    expect(await screen.findByText('Copié !')).toBeTruthy()
  })

  it('applies custom className', () => {
    const { container } = render(<ShareButtons {...defaultProps} className="mt-4" />)
    const wrapper = container.firstElementChild!
    expect(wrapper.classList.contains('mt-4')).toBe(true)
  })

  it('encodes special characters in URL and text', () => {
    render(
      <ShareButtons
        url="https://squadplanner.fr/s/test?a=1&b=2"
        title="Session avec l'équipe"
        text="Rejoins-nous !"
      />
    )
    const whatsappLink = screen.getByText('WhatsApp').closest('a')!
    // URL should be encoded
    expect(whatsappLink.href).toContain(encodeURIComponent('https://squadplanner.fr/s/test?a=1&b=2'))
  })
})
