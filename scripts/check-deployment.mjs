import { createClient } from '@supabase/supabase-js'
import { publicConfig } from '../lib/supabase/config.ts'

const config = publicConfig(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!config || !secret) {
  console.error('FAIL: configure Supabase URL, publishable key and server-only service key. No key values are printed.')
  process.exit(1)
}
const expected = process.env.KINTEX_EXPECTED_SUPABASE_HOST || 'ambhlmdrfsgdbbljjsic.supabase.co'
if (new URL(config.url).hostname !== expected) {
  console.error('FAIL: Supabase project differs from the assistant project. Verify the target before continuing.')
  process.exit(1)
}
const client = createClient(config.url, secret, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) } })
const checks = {
  profiles: 'id,locale,display_name,conversation_locale,output_locale',
  cases: 'id,owner_id,title,intent,ui_locale,conversation_locale,status',
  source_documents: 'id,owner_id,case_id,path,mime_type,bytes,sha256,status',
  extracted_facts: 'id,owner_id,case_id,key,value,confirmed_at',
  correspondence_drafts: 'id,case_id,version,content_hash,translation,review_status',
  approvals: 'id,user_id,draft_id,approved_hash',
  case_messages: 'id,owner_id,case_id,role,locale,content',
  audit_events: 'id,actor_id,case_id,action',
}
let failures = 0
for (const [table, columns] of Object.entries(checks)) {
  try {
    const { error } = await client.from(table).select(columns, { head: true }).limit(0)
    console.log(`${error ? 'FAIL' : 'PASS'}: ${table} schema`)
    if (error) failures++
  } catch { failures++; console.error(`FAIL: ${table} unreachable`) }
}
try {
  const { data, error } = await client.storage.getBucket('source-documents')
  const ok = !error && data && data.public === false
  console.log(`${ok ? 'PASS' : 'FAIL'}: private source-documents bucket`)
  if (!ok) failures++
} catch { failures++; console.error('FAIL: storage unreachable') }
console.log('Read-only checks only. Auth, RLS isolation and the full user flow still require the acceptance tests in docs/integration.md.')
process.exitCode = failures ? 1 : 0
