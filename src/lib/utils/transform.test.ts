import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { toCamelCase, toSnakeCase } from '@/lib/utils/transform'

describe('toCamelCase', () => {
  it('should convert snake_case keys to camelCase', () => {
    const input = { first_name: 'John', last_name: 'Doe', created_at: '2024-01-01' }
    const result = toCamelCase<{ firstName: string; lastName: string; createdAt: string }>(input)

    expect(result).toEqual({ firstName: 'John', lastName: 'Doe', createdAt: '2024-01-01' })
  })

  it('should handle already camelCase keys', () => {
    const input = { firstName: 'John', age: 30 }
    const result = toCamelCase<{ firstName: string; age: number }>(input)

    expect(result).toEqual({ firstName: 'John', age: 30 })
  })

  it('should handle single key', () => {
    const result = toCamelCase<{ displayOrder: number }>({ display_order: 1 })
    expect(result).toEqual({ displayOrder: 1 })
  })

  it('should handle empty object', () => {
    const result = toCamelCase<Record<string, never>>({})
    expect(result).toEqual({})
  })

  it('should handle null values', () => {
    const result = toCamelCase<{ logoUrl: null }>({ logo_url: null })
    expect(result).toEqual({ logoUrl: null })
  })

  it('should handle undefined values', () => {
    const result = toCamelCase<{ someField: undefined }>({ some_field: undefined })
    expect(result).toEqual({ someField: undefined })
  })

  it('should NOT transform nested object keys', () => {
    const input = { top_level: { nested_key: 'value' } }
    const result = toCamelCase<{ topLevel: { nested_key: string } }>(input)

    expect(result).toEqual({ topLevel: { nested_key: 'value' } })
  })

  it('should handle array values without transforming them', () => {
    const input = { tag_list: ['a', 'b'] }
    const result = toCamelCase<{ tagList: string[] }>(input)

    expect(result).toEqual({ tagList: ['a', 'b'] })
  })

  it('should handle multiple underscores', () => {
    const input = { some_long_field_name: 'value' }
    const result = toCamelCase<{ someLongFieldName: string }>(input)

    expect(result).toEqual({ someLongFieldName: 'value' })
  })

  it('should transform leading underscore followed by lowercase', () => {
    // regex /_([a-z])/g matches _p and _f in _private_field
    const input = { _private_field: 'secret' }
    const result = toCamelCase<Record<string, string>>(input)

    expect(result).toEqual({ PrivateField: 'secret' })
  })

  it('should preserve one underscore when consecutive underscores appear', () => {
    // __d: first _ has no [a-z] after it (next char is _), stays; _d matches
    const input = { some__double: 'value' }
    const result = toCamelCase<Record<string, string>>(input)

    expect(result).toEqual({ some_Double: 'value' })
  })

  it('should preserve trailing underscore', () => {
    // trailing _ has no [a-z] after it, so it stays
    const input = { field_: 'value' }
    const result = toCamelCase<Record<string, string>>(input)

    expect(result).toEqual({ field_: 'value' })
  })
})

describe('toSnakeCase', () => {
  it('should convert camelCase keys to snake_case', () => {
    const input = { firstName: 'John', lastName: 'Doe', createdAt: '2024-01-01' }
    const result = toSnakeCase(input)

    expect(result).toEqual({ first_name: 'John', last_name: 'Doe', created_at: '2024-01-01' })
  })

  it('should handle already snake_case keys', () => {
    const input = { first_name: 'John', age: 30 }
    const result = toSnakeCase(input)

    expect(result).toEqual({ first_name: 'John', age: 30 })
  })

  it('should handle single key', () => {
    const result = toSnakeCase({ displayOrder: 1 })
    expect(result).toEqual({ display_order: 1 })
  })

  it('should handle empty object', () => {
    const result = toSnakeCase({})
    expect(result).toEqual({})
  })

  it('should handle null values', () => {
    const result = toSnakeCase({ logoUrl: null })
    expect(result).toEqual({ logo_url: null })
  })

  it('should NOT transform nested object keys', () => {
    const input = { topLevel: { nestedKey: 'value' } }
    const result = toSnakeCase(input)

    expect(result).toEqual({ top_level: { nestedKey: 'value' } })
  })

  it('should insert underscore before each uppercase letter in acronyms', () => {
    // /[A-Z]/g matches each uppercase letter individually: X, M, L, P
    const input = { XMLParser: 'value' }
    const result = toSnakeCase(input)

    expect(result).toEqual({ _x_m_l_parser: 'value' })
  })
})

describe('roundtrip', () => {
  it('should satisfy toSnakeCase(toCamelCase(x)) === x for known inputs', () => {
    const original = { logo_url: null, display_order: 1, created_at: '2024-01-01' }
    const roundtripped = toSnakeCase(toCamelCase<Record<string, unknown>>(original))

    expect(roundtripped).toEqual(original)
  })

  it('should satisfy roundtrip for property-based random snake_case strings', () => {
    const snakeCaseKey = fc
      .array(fc.stringMatching(/^[a-z]+$/), { minLength: 1, maxLength: 4 })
      .map((parts) => parts.join('_'))

    fc.assert(
      fc.property(snakeCaseKey, fc.anything(), (key, value) => {
        const original: Record<string, unknown> = { [key]: value }
        const roundtripped = toSnakeCase(toCamelCase<Record<string, unknown>>(original))

        expect(Object.keys(roundtripped)[0]).toBe(key)
      }),
      { numRuns: 200 },
    )
  })
})
