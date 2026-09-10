import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
const routes = [
  'app/[locale]/login/page.tsx','app/[locale]/signup/page.tsx','app/[locale]/forgot-password/page.tsx','app/[locale]/reset-password/page.tsx','app/[locale]/dashboard/page.tsx','app/[locale]/cases/[id]/page.tsx','app/[locale]/settings/page.tsx','app/api/cases/route.ts','app/api/cases/[id]/route.ts','app/api/cases/[id]/documents/route.ts','app/api/cases/[id]/detail/route.ts','app/api/cases/[id]/messages/route.ts','app/api/drafts/[id]/approve/route.ts','app/api/drafts/[id]/export/route.ts','app/api/documents/[id]/signed-url/route.ts'
]
for (const route of routes) await access(route)
const copy = await readFile('lib/case-copy.ts', 'utf8')
for (const status of ['NEW','UPLOADED','EXTRACTING','NEEDS_INFO','DRAFTING','NEEDS_CONFIRMATION','APPROVED','EXPORTED','SENT','WAITING_REPLY','ACTION_REQUIRED','CLOSED','FAILED_RETRYABLE','FAILED_FINAL','HUMAN_REVIEW']) assert.equal(copy.includes(`${status}:`), true, `missing live status ${status}`)
const source = await readFile('lib/supabase/admin.ts', 'utf8')
assert.equal(source.includes("import 'server-only'"), true)
console.log('route smoke tests: PASS')
