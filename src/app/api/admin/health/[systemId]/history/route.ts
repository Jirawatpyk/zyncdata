import { NextResponse } from 'next/server'
import { requireApiAuth, isAuthError } from '@/lib/auth/guard'
import { getHealthCheckHistory } from '@/lib/health/queries'
import { healthHistoryQuerySchema } from '@/lib/validations/health'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ systemId: string }> },
) {
  const auth = await requireApiAuth('admin')
  if (isAuthError(auth)) return auth

  try {
    const { systemId } = await params

    const url = new URL(request.url)
    const parsed = healthHistoryQuerySchema.safeParse({
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
      status: url.searchParams.get('status') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: { message: parsed.error.issues[0]?.message ?? 'Invalid query parameters', code: 'VALIDATION_ERROR' } },
        { status: 400 },
      )
    }

    const { limit, offset, status } = parsed.data

    // Verify system exists and get name
    const supabase = await createClient()
    const { data: system, error: systemError } = await supabase
      .from('systems')
      .select('name')
      .eq('id', systemId)
      .single()

    if (systemError) {
      if (systemError.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: { message: 'System not found', code: 'NOT_FOUND' } },
          { status: 404 },
        )
      }
      throw systemError
    }

    const { checks, total } = await getHealthCheckHistory(systemId, { limit, offset, status })

    return NextResponse.json({
      data: {
        checks,
        total,
        hasMore: offset + limit < total,
        systemName: system.name,
      },
      error: null,
    })
  } catch {
    return NextResponse.json(
      { data: null, error: { message: 'Failed to fetch health history', code: 'FETCH_ERROR' } },
      { status: 500 },
    )
  }
}
