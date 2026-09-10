import { NextResponse } from 'next/server'
import { publicConfig } from '../../../lib/supabase/config'
import { createAdminClient } from '../../../lib/supabase/admin'
import { groqConfig } from '../../../lib/workflow/provider'

export async function GET() {
  const ai = !!groqConfig()
  const configured = !!publicConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) && !!createAdminClient() && (process.env.KINTEX_AI_ENABLED !== 'true' || ai)
  return NextResponse.json({
    service: 'kintex-communication-assistant', configured,
    verification: 'configuration-only; database and auth require deployment checks',
    capabilities: { manualDrafts: true, textExport: true, ocr: false, aiTranslation: ai, automaticSending: false, sharedKintexLogin: false },
  }, { status: configured ? 200 : 503, headers: { 'Cache-Control': 'no-store' } })
}
