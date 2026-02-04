import { faker } from '@faker-js/faker'

export type SystemFactoryData = {
  id: string
  name: string
  description: string
  status: 'healthy' | 'degraded' | 'down' | 'maintenance'
  url: string
  checkIntervalSeconds: number
  createdAt: string
  updatedAt: string
}

const createdIds: string[] = []

export function buildSystem(overrides: Partial<SystemFactoryData> = {}): SystemFactoryData {
  const now = new Date().toISOString()

  const system: SystemFactoryData = {
    id: faker.string.uuid(),
    name: faker.company.name() + ' API',
    description: faker.lorem.sentence(),
    status: 'healthy',
    url: faker.internet.url(),
    checkIntervalSeconds: 60,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }

  createdIds.push(system.id)
  return system
}

export function buildDegradedSystem(overrides: Partial<SystemFactoryData> = {}): SystemFactoryData {
  return buildSystem({ status: 'degraded', ...overrides })
}

export function buildDownSystem(overrides: Partial<SystemFactoryData> = {}): SystemFactoryData {
  return buildSystem({ status: 'down', ...overrides })
}

/** Returns all tracked IDs and resets the list */
export function getCreatedSystemIds(): string[] {
  return [...createdIds]
}

/** Cleanup all tracked systems via API */
export async function cleanupSystems(
  request: { delete: (url: string) => Promise<unknown> },
): Promise<void> {
  for (const id of createdIds) {
    await request.delete(`/api/systems/${id}`)
  }
  createdIds.length = 0
}

/** Reset tracking without API calls (for unit tests) */
export function resetSystemTracking(): void {
  createdIds.length = 0
}
