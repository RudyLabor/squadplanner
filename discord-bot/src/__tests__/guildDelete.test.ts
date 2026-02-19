import { describe, it, expect, vi } from 'vitest'
import { guildDelete } from '../events/guildDelete.js'

describe('guildDelete', () => {
  it('logs the leave event', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

    guildDelete({ id: 'guild-1', name: 'Left Server' } as never)

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Left Server'),
    )
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('guild-1'),
    )
    consoleSpy.mockRestore()
  })

  it('does not throw', () => {
    vi.spyOn(console, 'log').mockImplementation(() => {})
    expect(() => guildDelete({ id: 'g1', name: 'S' } as never)).not.toThrow()
  })
})
