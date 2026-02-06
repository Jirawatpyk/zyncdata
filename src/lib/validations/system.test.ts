import { describe, it, expect } from 'vitest'
import { systemSchema, createSystemSchema, updateSystemSchema, deleteSystemSchema, reorderSystemsSchema, toggleSystemSchema, uploadLogoSchema, MAX_LOGO_SIZE, SYSTEM_CATEGORIES, CATEGORY_LABELS } from './system'

describe('systemSchema', () => {
  // Story 3.8: Validate full system object including lastCheckedAt

  const validSystem = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'TINEDY',
    url: 'https://tinedy.example.com',
    logoUrl: null,
    description: 'Task management system',
    status: null,
    responseTime: null,
    displayOrder: 1,
    enabled: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    lastCheckedAt: null,
    category: null,
    consecutiveFailures: 0,
  }

  it('should accept valid system with null lastCheckedAt', () => {
    const result = systemSchema.safeParse(validSystem)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lastCheckedAt).toBeNull()
    }
  })

  it('should accept valid system with timestamp lastCheckedAt', () => {
    const result = systemSchema.safeParse({
      ...validSystem,
      lastCheckedAt: '2026-02-07T10:30:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.lastCheckedAt).toBe('2026-02-07T10:30:00.000Z')
    }
  })

  it('should accept valid system with online status', () => {
    const result = systemSchema.safeParse({
      ...validSystem,
      status: 'online',
      lastCheckedAt: '2026-02-07T10:30:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('online')
      expect(result.data.lastCheckedAt).toBe('2026-02-07T10:30:00.000Z')
    }
  })

  it('should accept valid system with offline status', () => {
    const result = systemSchema.safeParse({
      ...validSystem,
      status: 'offline',
      lastCheckedAt: '2026-02-07T10:30:00.000Z',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('offline')
    }
  })

  it('should reject system missing lastCheckedAt field', () => {
    const { lastCheckedAt: _, ...withoutLastCheckedAt } = validSystem
    void _
    const result = systemSchema.safeParse(withoutLastCheckedAt)
    expect(result.success).toBe(false)
  })

  it('should accept system with category string', () => {
    const result = systemSchema.safeParse({ ...validSystem, category: 'dxt_smart_platform' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBe('dxt_smart_platform')
    }
  })

  it('should accept system with null category', () => {
    const result = systemSchema.safeParse(validSystem)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.category).toBeNull()
    }
  })

  it('should reject system missing category field', () => {
    const { category: _, ...withoutCategory } = validSystem
    void _
    const result = systemSchema.safeParse(withoutCategory)
    expect(result.success).toBe(false)
  })
})

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

  describe('category field', () => {
    it('should accept valid category', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        category: 'dxt_smart_platform',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe('dxt_smart_platform')
      }
    })

    it('should accept null category (uncategorized)', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        category: null,
      })
      expect(result.success).toBe(true)
    })

    it('should accept omitted category', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid category value', () => {
      const result = createSystemSchema.safeParse({
        name: 'ENEOS',
        url: 'https://eneos.example.com',
        category: 'invalid_category',
      })
      expect(result.success).toBe(false)
    })

    it('should accept all valid category values', () => {
      for (const cat of SYSTEM_CATEGORIES) {
        const result = createSystemSchema.safeParse({
          name: 'Test',
          url: 'https://test.com',
          category: cat,
        })
        expect(result.success).toBe(true)
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
        category: 'dxt_solutions',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toEqual({
          name: 'ENEOS',
          url: 'https://eneos.example.com',
          description: 'Energy management system',
          enabled: false,
          category: 'dxt_solutions',
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

  describe('category field', () => {
    it('should accept valid category in update', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        category: 'dxt_game',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.category).toBe('dxt_game')
      }
    })

    it('should accept null category in update', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        category: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid category in update', () => {
      const result = updateSystemSchema.safeParse({
        ...validInput,
        category: 'invalid',
      })
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

describe('SYSTEM_CATEGORIES constants', () => {
  it('should have 3 categories', () => {
    expect(SYSTEM_CATEGORIES).toHaveLength(3)
  })

  it('should have labels for all categories', () => {
    for (const cat of SYSTEM_CATEGORIES) {
      expect(CATEGORY_LABELS[cat]).toBeDefined()
      expect(typeof CATEGORY_LABELS[cat]).toBe('string')
    }
  })
})

describe('deleteSystemSchema', () => {
  // Story 3.4 AC #3: Validate UUID for delete operation

  it('should accept valid UUID', () => {
    const result = deleteSystemSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    }
  })

  it('should reject invalid UUID', () => {
    const result = deleteSystemSchema.safeParse({
      id: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid system ID')
    }
  })

  it('should reject missing id', () => {
    const result = deleteSystemSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('should strip unknown fields', () => {
    const result = deleteSystemSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      extraField: 'should be stripped',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('extraField' in result.data).toBe(false)
    }
  })
})

describe('reorderSystemsSchema', () => {
  // Story 3.5 AC #1: Validate reorder payload

  const validInput = {
    systems: [
      { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0 },
      { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
    ],
  }

  describe('systems array', () => {
    it('should accept valid 2-system swap', () => {
      const result = reorderSystemsSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.systems).toHaveLength(2)
        expect(result.data.systems[0].id).toBe('550e8400-e29b-41d4-a716-446655440000')
        expect(result.data.systems[0].displayOrder).toBe(0)
      }
    })

    it('should reject empty systems array', () => {
      const result = reorderSystemsSchema.safeParse({ systems: [] })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least 2 systems required for reorder')
      }
    })

    it('should reject single system (min 2)', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [{ id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0 }],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least 2 systems required for reorder')
      }
    })

    it('should reject over 100 systems', () => {
      const systems = Array.from({ length: 101 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
        displayOrder: i,
      }))
      const result = reorderSystemsSchema.safeParse({ systems })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Too many systems in single reorder')
      }
    })

    it('should accept exactly 100 systems', () => {
      const systems = Array.from({ length: 100 }, (_, i) => ({
        id: `550e8400-e29b-41d4-a716-${String(i).padStart(12, '0')}`,
        displayOrder: i,
      }))
      const result = reorderSystemsSchema.safeParse({ systems })
      expect(result.success).toBe(true)
    })

    it('should reject missing systems field', () => {
      const result = reorderSystemsSchema.safeParse({})
      expect(result.success).toBe(false)
    })
  })

  describe('system id field', () => {
    it('should reject invalid UUID', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: 'not-a-uuid', displayOrder: 0 },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid system ID')
      }
    })

    it('should reject missing id', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { displayOrder: 0 },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('displayOrder field', () => {
    it('should accept zero', () => {
      const result = reorderSystemsSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.systems[0].displayOrder).toBe(0)
      }
    })

    it('should reject negative displayOrder', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: -1 },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 0 },
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Display order must be non-negative')
      }
    })

    it('should reject float displayOrder', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 1.5 },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 0 },
        ],
      })
      expect(result.success).toBe(false)
    })

    it('should reject missing displayOrder', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: '550e8400-e29b-41d4-a716-446655440000' },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('duplicate ID validation', () => {
    it('should reject duplicate system IDs', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0 },
          { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 1 },
        ],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Duplicate system IDs are not allowed')
      }
    })

    it('should accept unique system IDs', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0 },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
        ],
      })
      expect(result.success).toBe(true)
    })
  })

  describe('strip unknown fields', () => {
    it('should strip unknown fields from systems items', () => {
      const result = reorderSystemsSchema.safeParse({
        systems: [
          { id: '550e8400-e29b-41d4-a716-446655440000', displayOrder: 0, extra: 'stripped' },
          { id: '550e8400-e29b-41d4-a716-446655440001', displayOrder: 1 },
        ],
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect('extra' in result.data.systems[0]).toBe(false)
      }
    })
  })
})

describe('toggleSystemSchema', () => {
  // Story 3.6 AC #1: Validate toggle input

  const validInput = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    enabled: true,
  }

  it('should accept valid input with enabled true', () => {
    const result = toggleSystemSchema.safeParse(validInput)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(result.data.enabled).toBe(true)
    }
  })

  it('should accept valid input with enabled false', () => {
    const result = toggleSystemSchema.safeParse({ ...validInput, enabled: false })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.enabled).toBe(false)
    }
  })

  it('should reject invalid UUID', () => {
    const result = toggleSystemSchema.safeParse({ id: 'not-a-uuid', enabled: true })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Invalid system ID')
    }
  })

  it('should reject missing enabled field', () => {
    const result = toggleSystemSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(false)
  })

  it('should reject non-boolean enabled', () => {
    const result = toggleSystemSchema.safeParse({ ...validInput, enabled: 'true' })
    expect(result.success).toBe(false)
  })

  it('should reject missing id', () => {
    const result = toggleSystemSchema.safeParse({ enabled: true })
    expect(result.success).toBe(false)
  })

  it('should strip unknown fields', () => {
    const result = toggleSystemSchema.safeParse({ ...validInput, extraField: 'stripped' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('extraField' in result.data).toBe(false)
    }
  })
})

describe('uploadLogoSchema', () => {
  // Story 3.7 AC #1, #4: Validate logo upload metadata

  const validInput = {
    systemId: '550e8400-e29b-41d4-a716-446655440000',
    fileName: 'logo.png',
    fileSize: 10240,
    fileType: 'image/png' as const,
  }

  describe('valid file types', () => {
    it('should accept JPEG upload', () => {
      const result = uploadLogoSchema.safeParse({ ...validInput, fileType: 'image/jpeg' })
      expect(result.success).toBe(true)
    })

    it('should accept PNG upload', () => {
      const result = uploadLogoSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should accept SVG upload', () => {
      const result = uploadLogoSchema.safeParse({ ...validInput, fileType: 'image/svg+xml' })
      expect(result.success).toBe(true)
    })

    it('should accept WebP upload', () => {
      const result = uploadLogoSchema.safeParse({ ...validInput, fileType: 'image/webp' })
      expect(result.success).toBe(true)
    })
  })

  describe('file size validation', () => {
    it('should reject file larger than 512KB (AC #4)', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        fileSize: MAX_LOGO_SIZE + 1,
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('File must be less than 512KB')
      }
    })

    it('should accept file at exactly 512KB', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        fileSize: MAX_LOGO_SIZE,
      })
      expect(result.success).toBe(true)
    })

    it('should accept small file', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        fileSize: 1024,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid file types', () => {
    it('should reject PDF (AC #4)', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        fileType: 'application/pdf',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('File must be JPEG, PNG, SVG, or WebP')
      }
    })

    it('should reject GIF (AC #4)', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        fileType: 'image/gif',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('File must be JPEG, PNG, SVG, or WebP')
      }
    })
  })

  describe('systemId validation', () => {
    it('should reject missing systemId', () => {
      const { systemId: _, ...withoutId } = validInput
      void _
      const result = uploadLogoSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        systemId: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid system ID')
      }
    })
  })

  describe('fileName validation', () => {
    it('should reject missing fileName', () => {
      const { fileName: _, ...withoutName } = validInput
      void _
      const result = uploadLogoSchema.safeParse(withoutName)
      expect(result.success).toBe(false)
    })

    it('should reject empty fileName', () => {
      const result = uploadLogoSchema.safeParse({
        ...validInput,
        fileName: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('File name required')
      }
    })
  })
})
