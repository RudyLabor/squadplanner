import { describe, it, expect } from 'vitest'
import { getGameImageUrl, getGameGradient, getGameInitial, hasGameImage } from '../gameImages'

describe('gameImages', () => {
  it('returns URL for known game', () => {
    expect(getGameImageUrl('Fortnite')).toBeTruthy()
    expect(getGameImageUrl('Valorant')).toBeTruthy()
  })

  it('returns empty string for unknown game', () => {
    expect(getGameImageUrl('Unknown Game XYZ')).toBe('')
  })

  it('returns empty string for empty input', () => {
    expect(getGameImageUrl('')).toBe('')
  })

  it('hasGameImage returns true for known games', () => {
    expect(hasGameImage('Minecraft')).toBe(true)
  })

  it('hasGameImage returns false for unknown games', () => {
    expect(hasGameImage('Unknown')).toBe(false)
  })

  it('getGameGradient returns CSS gradient', () => {
    const gradient = getGameGradient('Fortnite')
    expect(gradient).toContain('linear-gradient')
  })

  it('getGameInitial returns uppercase first letter', () => {
    expect(getGameInitial('valorant')).toBe('V')
    expect(getGameInitial('Fortnite')).toBe('F')
  })
})
