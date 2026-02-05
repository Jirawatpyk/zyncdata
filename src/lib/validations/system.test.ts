import { describe, it, expect } from 'vitest'
import { createSystemSchema, updateSystemSchema } from './system'

describe('createSystemSchema', () => {
  // AC #3, #4: Validate required fields and URL format

  describe('name field', () => {
    it('should accept valid name', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('ENEOS')
      }
    })

    it('should reject empty name (AC #4)', () => {
      const result = createSystemSchema.safeParse({
        name: '',
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name required')
      }
    })

    it('should reject missing name', () => {
      const result = createSystemSchema.safeParse({
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(false)
    })

    it('should reject name over 100 characters', () => {
      const result = createSystemSchema.safeParse({
        name: 'A'.repeat(101),
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Name must be 100 characters or less',
        )
      }
    })

    it('should accept name at exactly 100 characters', () => {
      const result = createSystemSchema.safeParse({
        name: 'A'.repeat(100),
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('url field', () => {
    it('should accept valid URL', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBe('https://eneos.example.com')
      }
    })

    it('should accept URL with path', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com/app/dashboard',
      })
      expect(result.success).toBe(true)
    })

    it('should accept URL with port', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com:8080',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid URL (AC #3)', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'not-a-url',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valid URL required')
      }
    })

    it('should reject empty URL', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valid URL required')
      }
    })

    it('should reject URL without protocol', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'eneos.example.com',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('description field (optional)', () => {
    it('should accept system without description', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should accept system with empty description string', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        description: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept system with valid description', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        description: 'Energy management system',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('Energy management system')
      }
    })

    it('should reject description over 500 characters', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        description: 'A'.repeat(501),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Description must be 500 characters or less',
        )
      }
    })

    it('should accept description at exactly 500 characters', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        description: 'A'.repeat(500),
      })
      expect(result.success).toBe(true)
    })
  })

  describe('enabled field', () => {
    it('should default to true when not provided', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(true)
      }
    })

    it('should accept explicit true', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        enabled: true,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(true)
      }
    })

    it('should accept explicit false', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        enabled: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(false)
      }
    })
  })

  describe('complete system input', () => {
    it('should accept fully populated valid input', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        description: 'Energy management system',
        enabled: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          name: 'ENEOS',
          url: 'https://eneos.example.com',
          description: 'Energy management system',
          enabled: false,
        })
      }
    })

    it('should strip unknown fields', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        unknownField: 'should be stripped',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect('unknownField' in result.data).toBe(false)
      }
    })
  })
})

describe('updateSystemSchema', () => {
  // Story 3.3 AC #3: Validate required fields and URL format for update

  const validInput = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'ENEOS',
    url: 'https://eneos.example.com',
    description: 'Energy management system',
    enabled: true,
  }

  describe('id field', () => {
    it('should accept valid UUID', () => {
      const result = updateSystemSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      }
    })

    it('should reject invalid UUID', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid system ID')
      }
    })

    it('should reject missing id', () => {
      const { id: _, ...withoutId } = validInput
      void _ // suppress unused var warning
      const result = updateSystemSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })
  })

  describe('name field', () => {
    it('should accept valid name', () => {
      const result = updateSystemSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('ENEOS')
      }
    })

    it('should reject empty name (AC #3)', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        name: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name required')
      }
    })

    it('should reject name over 100 characters', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        name: 'A'.repeat(101),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Name must be 100 characters or less',
        )
      }
    })
  })

  describe('url field', () => {
    it('should accept valid URL', () => {
      const result = updateSystemSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBe('https://eneos.example.com')
      }
    })

    it('should reject invalid URL (AC #3)', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        url: 'not-a-url',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Valid URL required')
      }
    })

    it('should reject empty URL (AC #3)', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        url: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('description field (optional)', () => {
    it('should accept system with description', () => {
      const result = updateSystemSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.description).toBe('Energy management system')
      }
    })

    it('should accept system without description', () => {
      const { description: _, ...withoutDescription } = validInput
      void _ // suppress unused var warning
      const result = updateSystemSchema.safeParse(withoutDescription)
      expect(result.success).toBe(true)
    })

    it('should accept empty description string', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        description: '',
      })
      expect(result.success).toBe(true)
    })

    it('should reject description over 500 characters', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        description: 'A'.repeat(501),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'Description must be 500 characters or less',
        )
      }
    })
  })

  describe('enabled field', () => {
    it('should accept true', () => {
      const result = updateSystemSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(true)
      }
    })

    it('should accept false', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        enabled: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.enabled).toBe(false)
      }
    })

    it('should reject missing enabled (required for update)', () => {
      const { enabled: _, ...withoutEnabled } = validInput
      void _ // suppress unused var warning
      const result = updateSystemSchema.safeParse(withoutEnabled)
      expect(result.success).toBe(false)
    })
  })

  describe('complete update input', () => {
    it('should accept fully populated valid input', () => {
      const result = updateSystemSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual(validInput)
      }
    })

    it('should strip unknown fields', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        unknownField: 'should be stripped',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect('unknownField' in result.data).toBe(false)
      }
    })
  })
})
