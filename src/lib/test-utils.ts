import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function createQueryWrapper() {
  const client = createTestQueryClient()
  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client }, children)
  }
}
