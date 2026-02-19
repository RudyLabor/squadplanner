import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock all commands to avoid importing real discord.js builders
vi.mock('../commands/session.js', () => ({ default: { data: { name: 'session', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../commands/rsvp.js', () => ({ default: { data: { name: 'rsvp', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../commands/squad.js', () => ({ default: { data: { name: 'squad', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../commands/lfg.js', () => ({ default: { data: { name: 'lfg', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../commands/link.js', () => ({ default: { data: { name: 'link', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../commands/help.js', () => ({ default: { data: { name: 'help', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../commands/premium.js', () => ({ default: { data: { name: 'premium', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../premium-commands/recurring.js', () => ({ default: { data: { name: 'recurring', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../premium-commands/analytics.js', () => ({ default: { data: { name: 'analytics', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../premium-commands/coach.js', () => ({ default: { data: { name: 'coach', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../premium-commands/leaderboard.js', () => ({ default: { data: { name: 'leaderboard', toJSON: () => ({}) }, execute: vi.fn() } }))
vi.mock('../premium-commands/remind.js', () => ({ default: { data: { name: 'remind', toJSON: () => ({}) }, execute: vi.fn() } }))

import { loadCommands, getAllCommandData } from '../commands/loader.js'

describe('loadCommands', () => {
  it('loads 12 commands (7 free + 5 premium)', () => {
    const commands = new Map()
    const client = { commands } as never

    loadCommands(client)

    // loadCommands sets client.commands — but since client is our object, read from it
    const loaded = (client as { commands: Map<string, unknown> }).commands
    expect(loaded.size).toBe(12)
  })

  it('includes all free commands', () => {
    const client = { commands: new Map() } as never
    loadCommands(client)
    const loaded = (client as { commands: Map<string, unknown> }).commands

    expect(loaded.has('session')).toBe(true)
    expect(loaded.has('rsvp')).toBe(true)
    expect(loaded.has('squad')).toBe(true)
    expect(loaded.has('lfg')).toBe(true)
    expect(loaded.has('link')).toBe(true)
    expect(loaded.has('help')).toBe(true)
    expect(loaded.has('premium')).toBe(true)
  })

  it('includes all premium commands with premium flag', () => {
    const client = { commands: new Map() } as never
    loadCommands(client)
    const loaded = (client as { commands: Map<string, { premium?: boolean }> }).commands

    expect(loaded.get('recurring')?.premium).toBe(true)
    expect(loaded.get('analytics')?.premium).toBe(true)
    expect(loaded.get('coach')?.premium).toBe(true)
    expect(loaded.get('leaderboard')?.premium).toBe(true)
    expect(loaded.get('remind')?.premium).toBe(true)
  })
})

describe('getAllCommandData', () => {
  it('returns JSON data for all 12 commands', () => {
    const data = getAllCommandData()
    expect(data).toHaveLength(12)
  })
})
