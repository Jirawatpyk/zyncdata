import type { APIRequestContext } from '@playwright/test'

/**
 * Seed an entity via API.
 * Use this to set up test data before running E2E tests.
 *
 * @example
 * const user = buildUser({ role: 'admin' })
 * await seedViaApi(request, '/api/users', user)
 */
export async function seedViaApi<T extends Record<string, unknown>>(
  request: APIRequestContext,
  endpoint: string,
  data: T,
): Promise<T> {
  const response = await request.post(endpoint, { data })

  if (!response.ok()) {
    const body = await response.text()
    throw new Error(`Seed failed: ${response.status()} ${endpoint} — ${body}`)
  }

  return data
}

/**
 * Delete an entity via API.
 *
 * @example
 * await deleteViaApi(request, '/api/users', userId)
 */
export async function deleteViaApi(
  request: APIRequestContext,
  endpoint: string,
  id: string,
): Promise<void> {
  const response = await request.delete(`${endpoint}/${id}`)

  if (!response.ok() && response.status() !== 404) {
    const body = await response.text()
    throw new Error(`Delete failed: ${response.status()} ${endpoint}/${id} — ${body}`)
  }
}

/**
 * Seed multiple entities via API.
 *
 * @example
 * const users = [buildUser(), buildUser({ role: 'admin' })]
 * await seedManyViaApi(request, '/api/users', users)
 */
export async function seedManyViaApi<T extends Record<string, unknown>>(
  request: APIRequestContext,
  endpoint: string,
  items: T[],
): Promise<T[]> {
  for (const item of items) {
    await seedViaApi(request, endpoint, item)
  }
  return items
}
