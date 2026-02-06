import { runAllHealthChecks } from '@/lib/health/mutations'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const results = await runAllHealthChecks()

    const failures = results.filter((r) => r.status === 'failure').length

    console.info(
      `[health-check] Checked ${results.length} systems: ${results.length - failures} success, ${failures} failure`,
    )

    return Response.json({
      data: { checked: results.length, timestamp: new Date().toISOString() },
      error: null,
    })
  } catch (error) {
    console.error('[health-check] Cron execution failed:', error)

    return Response.json(
      {
        data: null,
        error: { message: 'Health check execution failed', code: 'CRON_ERROR' },
      },
      { status: 500 },
    )
  }
}
