import { NextResponse } from 'next/server'
import { createAdminClient } from '../../../lib/supabase/admin'

export async function GET() {
  const admin = createAdminClient()
  let supabase: 'ok' | 'not_configured' | 'error' = 'not_configured'
  if (admin) {
    const result = await admin.from('usage_counters').select('user_id').limit(1)
    supabase = result.error ? 'error' : 'ok'
  }
  const healthy = supabase === 'ok'
  return NextResponse.json({
    status: healthy ? 'ok' : 'degraded',
    build_sha: process.env.BUILD_SHA ?? process.env.GIT_COMMIT_SHA ?? 'unknown',
    supabase,
    ai_provider: process.env.GROQ_API_KEY ? 'configured' : 'fallback',
    ai_reachable: 'not_checked',
  }, { status: healthy ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
