import 'server-only'
import { randomBytes, createHash } from 'crypto'

const BACKUP_CODE_COUNT = 8
const BACKUP_CODE_LENGTH = 4 // 4 bytes = 8 hex characters

export function generateBackupCodes(): { plainCodes: string[]; hashedCodes: string[] } {
  const plainCodes: string[] = []
  const hashedCodes: string[] = []

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = randomBytes(BACKUP_CODE_LENGTH).toString('hex').toUpperCase()
    plainCodes.push(code)
    hashedCodes.push(hashBackupCode(code))
  }

  return { plainCodes, hashedCodes }
}

export function hashBackupCode(code: string): string {
  return createHash('sha256').update(code.toUpperCase()).digest('hex')
}

// Also duplicated in BackupCodesDisplay.tsx ('use client' — cannot import server-only).
// Keep in sync if format changes.
export function formatBackupCodeForDisplay(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`
}
