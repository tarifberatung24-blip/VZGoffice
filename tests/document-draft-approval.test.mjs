import assert from 'node:assert/strict'
import { DeterministicDraftGenerator, DeterministicSafetyReviewer } from '../lib/workflow/deterministic.ts'

const generator = new DeterministicDraftGenerator()
const base = { id:'case', owner_id:'user', title:'case', intent:'explanation', ui_locale:'bg', conversation_locale:'bg', status:'NEW', institution:null, deadline:null, created_at:new Date().toISOString() }
const blocked = await generator.generate({ caseRecord:base, facts:[], outputLocale:'bg', documentIds:[] })
assert.ok(blocked.missing.length > 0)
assert.equal((await new DeterministicSafetyReviewer().review({ draft:blocked, facts:[] })).status, 'block')
const complete = await generator.generate({ caseRecord:base, facts:[{key:'recipient',value:'Hausverwaltung'},{key:'subject',value:'Anfrage'},{key:'request',value:'Bitte um Prüfung'}], outputLocale:'de', documentIds:['doc'] })
assert.equal(complete.missing.length, 0)
assert.equal(complete.body_de.includes('384,20'), false)
assert.equal(complete.body_de.includes('Petrova'), false)
assert.match(complete.contentHash, /^[a-f0-9]{64}$/)
assert.match(complete.inputFactsHash, /^[a-f0-9]{64}$/)
const documents = await import('node:fs/promises')
const source = await documents.readFile(new URL('../lib/workflow/documents.ts', import.meta.url), 'utf8')
assert.equal(source.includes('createSignedUrl'), true)
assert.equal(source.includes('public/'), false)
const records = await documents.readFile(new URL('../lib/workflow/records.ts', import.meta.url), 'utf8')
assert.equal(records.includes(".update({"), false)
assert.equal(records.includes("approvedHash"), true)
console.log('document-draft-approval tests: PASS')
