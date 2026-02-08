import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { createClient } from '@/lib/supabase/server'
import { updateHealthConfigSchema } from '@/lib/validations/health'
import type { HealthConfig } from '@/lib/validations/health'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ systemId: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { systemId } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('systems')
      .select('check_interval, timeout_threshold, failure_threshold')
      .eq('id', systemId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
          { status: 404 },
        )
      }
      throw error
    }

    const config: HealthConfig = {
      checkInterval: data.check_interval,
      timeoutThreshold: data.timeout_threshold,
      failureThreshold: data.failure_threshold,
    }

    return NextResponse.json({ data: config, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch health config', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ systemId: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { systemId } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { data: null, error: { message: 'Invalid request body', code: 'PARSE_ERROR' } },
        { status: 400 },
      )
    }

    const parsed = updateHealthConfigSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid input', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('systems')
      .update({
        check_interval: parsed.data.checkInterval,
        timeout_threshold: parsed.data.timeoutThreshold,
        failure_threshold: parsed.data.failureThreshold,
      })
      .eq('id', systemId)
      .select('check_interval, timeout_threshold, failure_threshold')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
          { status: 404 },
        )
      }
      throw error
    }

    const config: HealthConfig = {
      checkInterval: data.check_interval,
      timeoutThreshold: data.timeout_threshold,
      failureThreshold: data.failure_threshold,
    }

    return NextResponse.json({ data: config, error: null })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to update health config', code: 'UPDATE_ERROR' } },
      { status: 500 },
    )
  }
}
