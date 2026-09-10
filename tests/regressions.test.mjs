import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { safeNextPath } from '../lib/supabase/auth-utils.ts'
import { publicConfig } from '../lib/supabase/config.ts'
import { validateFacts, matchesDocumentType, isUuid } from '../lib/workflow/validation.ts'
import { DeterministicDraftGenerator } from '../lib/workflow/deterministic.ts'
import { workspaceCopy } from '../lib/workspace-copy.ts'

test('redirects cannot escape through backslashes, controls or protocol-relative URLs', () => {
  for (const path of ['//evil.example', '/\\evil.example', '/\t/evil.example', 'https://evil.example', '/\n/evil.example']) assert.equal(safeNextPath(path), '/bg')
  assert.equal(safeNextPath('/ro/dashboard?view=all'), '/ro/dashboard?view=all')
})
test('public configuration rejects misplaced keys and secret roles', () => {
  const jwt = role => `eyJ.${Buffer.from(JSON.stringify({ role })).toString('base64url')}.signature`
  assert.equal(publicConfig('sb_publishable_not_a_url', 'key'), null)
  assert.equal(publicConfig('https://example.supabase.co', 'sb_secret_private'), null)
  assert.equal(publicConfig('https://example.supabase.co', jwt('service_role')), null)
  assert.equal(publicConfig('ftp://example.supabase.co', jwt('anon')), null)
  assert.equal(publicConfig('https://user:pass@example.supabase.co', jwt('anon')), null)
  assert.equal(publicConfig('https://example.supabase.co', jwt('anon')).url, 'https://example.supabase.co')
  assert.equal(publicConfig(' https://example.supabase.co/ ', ' sb_publishable_test ').key, 'sb_publishable_test')
})
test('fact validation rejects malformed, excessive and duplicate values', () => {
  for (const value of [null, {}, [], [null], [{key:'a',value:'b',evidence:3}], [{key:'a',value:'b',page_no:-1}], [{key:'a',value:'b',page_no:1.5}], [{key:'a',value:'b'},{key:'a',value:'c'}], Array(51).fill({key:'a',value:'b'})]) assert.ok('error' in validateFacts(value))
  assert.equal(validateFacts([{key:' recipient ', value:' Office ', page_no:1}]).facts[0].key, 'recipient')
  assert.equal(isUuid('not-an-id'), false)
})
test('file signatures must match the declared MIME type', () => {
  assert.equal(matchesDocumentType(new TextEncoder().encode('%PDF-1.7'), 'application/pdf'), true)
  assert.equal(matchesDocumentType(new TextEncoder().encode('<script>'), 'application/pdf'), false)
  assert.equal(matchesDocumentType(new Uint8Array([137,80,78,71,13,10,26,10]), 'image/png'), true)
  assert.equal(matchesDocumentType(new Uint8Array([255,216,255]), 'image/jpeg'), true)
  assert.equal(matchesDocumentType(new Uint8Array([255]), 'image/jpeg'), false)
})
test('draft uses latest confirmed values and never labels German as a foreign translation', async () => {
  const generator = new DeterministicDraftGenerator()
  const input = { caseRecord:{}, facts:[{key:'recipient',value:'Amt'},{key:'subject',value:'Anfrage'},{key:'request',value:'Alter Text'},{key:'request',value:'Neuer Text'}], outputLocale:'bg', documentIds:[] }
  const draft = await generator.generate(input)
  assert.match(draft.body_de, /Neuer Text/)
  assert.doesNotMatch(draft.body_de, /Alter Text/)
  assert.equal(draft.translation, null)
  assert.equal(draft.translation_locale, null)
  const changed = await generator.generate({...input, documentIds:['another-document']})
  assert.notEqual(changed.contentHash, draft.contentHash)
})
test('workflow navigation and copy cover all six locales without blank labels', async () => {
  for (const locale of ['bg','de','ru','pl','sr','ro']) {
    assert.ok(Object.values(workspaceCopy[locale]).every(value => typeof value === 'string' && value.length > 0))
  }
  for (const route of ['documents','drafts','help']) await readFile(`app/[locale]/${route}/page.tsx`)
  const home = await readFile('app/[locale]/page.tsx', 'utf8')
  assert.doesNotMatch(home, /setStage|Hausverwaltung|Preview Mode/)
  assert.match(home, /getAuthenticatedUser/)
})
test('document writes and reads agree with the committed SQL baseline', async () => {
  const schema = await readFile('supabase/migrations/20260909112037_kintex_assistant_baseline.sql', 'utf8')
  const upload = await readFile('lib/workflow/documents.ts', 'utf8')
  const detail = await readFile('lib/repositories/case-detail.ts', 'utf8')
  const cases = await readFile('lib/repositories/cases.ts', 'utf8')
  for (const field of ['mime_type','bytes']) assert.match(schema, new RegExp(`\\b${field}\\b`))
  assert.match(upload, /mime_type: file.type/)
  assert.match(upload, /bytes: file.size/)
  assert.match(detail, /mime:mime_type, size_bytes:bytes/)
  assert.match(cases, /status: 'ARCHIVED'/)
  assert.doesNotMatch(cases, /status: 'NEW' as CaseStatus/)
})
