import { faker } from '@faker-js/faker'

export type UserFactoryData = {
  id: string
  email: string
  name: string
  role: 'super_admin' | 'admin' | 'viewer'
  isActive: boolean
  createdAt: string
}

const createdIds: string[] = []

export function buildUser(overrides: Partial<UserFactoryData> = {}): UserFactoryData {
  const user: UserFactoryData = {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'viewer',
    isActive: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }

  createdIds.push(user.id)
  return user
}

export function buildAdminUser(overrides: Partial<UserFactoryData> = {}): UserFactoryData {
  return buildUser({ role: 'admin', ...overrides })
}

export function buildSuperAdmin(overrides: Partial<UserFactoryData> = {}): UserFactoryData {
  return buildUser({ role: 'super_admin', ...overrides })
}

/** Returns all tracked IDs and resets the list */
export function getCreatedUserIds(): string[] {
  return [...createdIds]
}

/** Cleanup all tracked users via API */
export async function cleanupUsers(
  request: { delete: (url: string) => Promise<unknown> },
): Promise<void> {
  for (const id of createdIds) {
    await request.delete(`/api/users/${id}`)
  }
  createdIds.length = 0
}

/** Reset tracking without API calls (for unit tests) */
export function resetUserTracking(): void {
  createdIds.length = 0
}
