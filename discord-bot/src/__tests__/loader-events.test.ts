import { describe, it, expect, vi } from 'vitest'

vi.mock('../events/ready.js', () => ({ ready: vi.fn() }))
vi.mock('../events/interactionCreate.js', () => ({ interactionCreate: vi.fn() }))
vi.mock('../events/guildCreate.js', () => ({ guildCreate: vi.fn() }))
vi.mock('../events/guildDelete.js', () => ({ guildDelete: vi.fn() }))

import { loadEvents } from '../events/loader.js'

describe('loadEvents', () => {
  it('registers 4 event handlers on the client', () => {
    const once = vi.fn()
    const on = vi.fn()
    const client = { once, on }

    loadEvents(client as never)

    expect(once).toHaveBeenCalledWith('ready', expect.any(Function))
    expect(on).toHaveBeenCalledWith('interactionCreate', expect.any(Function))
    expect(on).toHaveBeenCalledWith('guildCreate', expect.any(Function))
    expect(on).toHaveBeenCalledWith('guildDelete', expect.any(Function))
  })

  it('logs registration message', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    loadEvents({ once: vi.fn(), on: vi.fn() } as never)

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('4'))
    consoleSpy.mockRestore()
  })
})
