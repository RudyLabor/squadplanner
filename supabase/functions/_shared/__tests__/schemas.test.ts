import { describe, it, expect } from 'vitest'
import {
  validateString,
  validateEmail,
  validateUUID,
  validateNumber,
  validateBoolean,
  validateArray,
  validateOptional,
  validateEnum,
  validateUrl,
} from '../schemas'

describe('schemas', () => {
  describe('validateString', () => {
    it('returns string for valid input', () => {
      expect(validateString('hello', 'name')).toBe('hello')
    })

    it('throws for non-string input', () => {
      expect(() => validateString(123, 'name')).toThrow('name must be a string')
    })

    it('throws for null input', () => {
      expect(() => validateString(null, 'name')).toThrow('name must be a string')
    })

    it('validates minLength', () => {
      expect(() => validateString('ab', 'name', { minLength: 3 })).toThrow('at least 3')
    })

    it('validates maxLength', () => {
      expect(() => validateString('abcdef', 'name', { maxLength: 3 })).toThrow('at most 3')
    })

    it('passes when within length bounds', () => {
      expect(validateString('abc', 'name', { minLength: 2, maxLength: 5 })).toBe('abc')
    })
  })

  describe('validateEmail', () => {
    it('returns email for valid input', () => {
      expect(validateEmail('test@example.com', 'email')).toBe('test@example.com')
    })

    it('throws for invalid email', () => {
      expect(() => validateEmail('not-an-email', 'email')).toThrow('valid email')
    })

    it('throws for email without domain', () => {
      expect(() => validateEmail('test@', 'email')).toThrow('valid email')
    })

    it('throws for non-string', () => {
      expect(() => validateEmail(123, 'email')).toThrow('must be a string')
    })
  })

  describe('validateUUID', () => {
    it('returns UUID for valid input', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000'
      expect(validateUUID(uuid, 'id')).toBe(uuid)
    })

    it('throws for invalid UUID', () => {
      expect(() => validateUUID('not-a-uuid', 'id')).toThrow('valid UUID')
    })

    it('throws for short string', () => {
      expect(() => validateUUID('abc', 'id')).toThrow('valid UUID')
    })

    it('accepts uppercase UUID', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000'
      expect(validateUUID(uuid, 'id')).toBe(uuid)
    })
  })

  describe('validateNumber', () => {
    it('returns number for valid input', () => {
      expect(validateNumber(42, 'age')).toBe(42)
    })

    it('converts string to number', () => {
      expect(validateNumber('42', 'age')).toBe(42)
    })

    it('throws for NaN', () => {
      expect(() => validateNumber('not-a-number', 'age')).toThrow('must be a number')
    })

    it('validates min', () => {
      expect(() => validateNumber(5, 'age', { min: 10 })).toThrow('at least 10')
    })

    it('validates max', () => {
      expect(() => validateNumber(100, 'age', { max: 50 })).toThrow('at most 50')
    })

    it('passes when within bounds', () => {
      expect(validateNumber(25, 'age', { min: 18, max: 65 })).toBe(25)
    })

    it('accepts zero', () => {
      expect(validateNumber(0, 'count')).toBe(0)
    })
  })

  describe('validateBoolean', () => {
    it('returns true for true', () => {
      expect(validateBoolean(true, 'active')).toBe(true)
    })

    it('returns false for false', () => {
      expect(validateBoolean(false, 'active')).toBe(false)
    })

    it('throws for string', () => {
      expect(() => validateBoolean('true', 'active')).toThrow('must be a boolean')
    })

    it('throws for number', () => {
      expect(() => validateBoolean(1, 'active')).toThrow('must be a boolean')
    })
  })

  describe('validateArray', () => {
    it('returns array for valid input', () => {
      expect(validateArray([1, 2, 3], 'items')).toEqual([1, 2, 3])
    })

    it('throws for non-array', () => {
      expect(() => validateArray('not-array', 'items')).toThrow('must be an array')
    })

    it('throws for object', () => {
      expect(() => validateArray({}, 'items')).toThrow('must be an array')
    })

    it('returns empty array', () => {
      expect(validateArray([], 'items')).toEqual([])
    })

    it('applies item validator', () => {
      const validator = (item: unknown) => validateString(item, 'item')
      expect(validateArray(['a', 'b'], 'items', validator)).toEqual(['a', 'b'])
    })

    it('throws when item validator fails', () => {
      const validator = (item: unknown) => validateString(item, 'item')
      expect(() => validateArray([1, 2], 'items', validator)).toThrow('item must be a string')
    })
  })

  describe('validateOptional', () => {
    it('returns undefined for undefined', () => {
      expect(validateOptional(undefined, (v) => validateString(v, 'x'))).toBeUndefined()
    })

    it('returns undefined for null', () => {
      expect(validateOptional(null, (v) => validateString(v, 'x'))).toBeUndefined()
    })

    it('validates when value is present', () => {
      expect(validateOptional('hello', (v) => validateString(v, 'x'))).toBe('hello')
    })

    it('throws when validation fails on present value', () => {
      expect(() => validateOptional(123, (v) => validateString(v, 'x'))).toThrow()
    })
  })

  describe('validateEnum', () => {
    it('returns value for valid enum', () => {
      expect(validateEnum('active', 'status', ['active', 'inactive'])).toBe('active')
    })

    it('throws for invalid enum value', () => {
      expect(() => validateEnum('unknown', 'status', ['active', 'inactive'])).toThrow('must be one of')
    })

    it('includes allowed values in error', () => {
      expect(() => validateEnum('x', 'status', ['a', 'b'])).toThrow('a, b')
    })
  })

  describe('validateUrl', () => {
    it('returns URL for valid input', () => {
      expect(validateUrl('https://example.com', 'url')).toBe('https://example.com')
    })

    it('throws for invalid URL', () => {
      expect(() => validateUrl('not-a-url', 'url')).toThrow('valid URL')
    })

    it('accepts URL with path', () => {
      expect(validateUrl('https://example.com/path?q=1', 'url')).toBe('https://example.com/path?q=1')
    })
  })
})
