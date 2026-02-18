import { describe, it, expect } from 'vitest'
import {
  baseEmbed,
  premiumRequiredEmbed,
  accountNotLinkedEmbed,
  errorEmbed,
  successEmbed,
} from '../lib/embeds.js'

describe('embeds', () => {
  describe('baseEmbed', () => {
    it('has the brand color', () => {
      const embed = baseEmbed()
      expect(embed.data.color).toBe(0x7c3aed)
    })

    it('has a footer with Squad Planner', () => {
      const embed = baseEmbed()
      expect(embed.data.footer?.text).toContain('Squad Planner')
    })

    it('has a timestamp', () => {
      const embed = baseEmbed()
      expect(embed.data.timestamp).toBeDefined()
    })
  })

  describe('premiumRequiredEmbed', () => {
    it('has the title Commande Premium', () => {
      const embed = premiumRequiredEmbed()
      expect(embed.data.title).toBe('Commande Premium')
    })

    it('mentions the price', () => {
      const embed = premiumRequiredEmbed()
      expect(embed.data.description).toContain('2,99')
    })

    it('mentions /premium command', () => {
      const embed = premiumRequiredEmbed()
      expect(embed.data.description).toContain('/premium')
    })
  })

  describe('accountNotLinkedEmbed', () => {
    it('has correct title', () => {
      const embed = accountNotLinkedEmbed()
      expect(embed.data.title).toBe('Compte non lie')
    })

    it('mentions /link command', () => {
      const embed = accountNotLinkedEmbed()
      expect(embed.data.description).toContain('/link')
    })
  })

  describe('errorEmbed', () => {
    it('has red color', () => {
      const embed = errorEmbed('test error')
      expect(embed.data.color).toBe(0xef4444)
    })

    it('shows the error message', () => {
      const embed = errorEmbed('Something went wrong')
      expect(embed.data.description).toBe('Something went wrong')
    })
  })

  describe('successEmbed', () => {
    it('has green color', () => {
      const embed = successEmbed('Done!')
      expect(embed.data.color).toBe(0x22c55e)
    })

    it('shows title and description', () => {
      const embed = successEmbed('Title', 'Description')
      expect(embed.data.title).toBe('Title')
      expect(embed.data.description).toBe('Description')
    })
  })
})
