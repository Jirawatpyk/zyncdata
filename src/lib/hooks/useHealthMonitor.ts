import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected'

const DEBOUNCE_MS = 2_000
const RECONNECT_TIMEOUT_MS = 30_000

export function useHealthMonitor() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>('disconnected')
  const queryClient = useQueryClient()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const channel: RealtimeChannel = supabase
      .channel('health-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'systems',
        },
        () => {
          // Debounce: cron updates each system individually → N rapid events
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ['admin', 'health', 'dashboard'],
            })
          }, DEBOUNCE_MS)
        },
      )
      .subscribe((status) => {
        // Clear any pending reconnect timeout on state transition
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
          reconnectTimeoutRef.current = null
        }

        if (status === 'SUBSCRIBED') setConnectionState('connected')
        else if (status === 'TIMED_OUT') setConnectionState('disconnected')
        else if (status === 'CHANNEL_ERROR') {
          setConnectionState('reconnecting')
          // Fall back to disconnected after timeout — handles non-transient errors
          // (e.g., RLS denial, auth expiry) where Supabase auto-retry won't recover
          reconnectTimeoutRef.current = setTimeout(() => {
            setConnectionState('disconnected')
          }, RECONNECT_TIMEOUT_MS)
        }
        else if (status === 'CLOSED') setConnectionState('disconnected')
      })

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return { connectionState }
}
