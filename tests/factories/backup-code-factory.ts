import { faker } from '@faker-js/faker'

export type BackupCodeRow = {
  id: string
  user_id: string
  code_hash: string
  used_at: string | null
  created_at: string
}

export function buildBackupCode(): string {
  return faker.string.hexadecimal({ length: 8, prefix: '' }).toUpperCase()
}

export function buildBackupCodeRow(overrides: Partial<BackupCodeRow> = {}): BackupCodeRow {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    code_hash: faker.string.hexadecimal({ length: 64, prefix: '' }).toLowerCase(),
    used_at: null,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}
