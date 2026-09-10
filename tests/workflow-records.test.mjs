import test from 'node:test'
import assert from 'node:assert/strict'
import { setup, complete, calls } from './supabase-fixture.mjs'
import { confirmFacts, generateDraft, approveDraft } from '../lib/workflow/records.ts'

process.env.KINTEX_AI_ENABLED = 'false'
const owned = { table:'cases', result:{data:{id:'case-a',owner_id:'user-a',status:'NEW'},error:null}, check: q => assert.ok(q.filters.some(([key,value]) => key === 'owner_id' && value === 'user-a')) }
const hash = 'a'.repeat(64)
test('unauthenticated requests never use privileged data access', async () => {
  setup([], null)
  assert.equal((await generateDraft('case-a','bg',[])).error, 'Unauthorized')
  assert.equal((await approveDraft('draft-a',hash)).error, 'Unauthorized')
  assert.equal(calls.length, 0); complete()
})
test('a foreign case or document cannot be used for facts or attachments', async () => {
  setup([{table:'cases',result:{data:null,error:null}}])
  assert.equal((await generateDraft('foreign-case','bg',[])).error, 'Case not found'); complete()
  for (const action of [() => confirmFacts('case-a',[{key:'request',value:'test'}],'foreign-doc'), () => generateDraft('case-a','bg',['foreign-doc'])]) {
    setup([owned,{table:'source_documents',result:{data:null,error:null},check:q=>{
      assert.ok(q.filters.some(([key,value]) => key === 'case_id' && value === 'case-a'))
      assert.ok(q.filters.some(([key,value]) => key === 'owner_id' && value === 'user-a'))
    }}])
    assert.ok((await action()).error); complete()
  }
})
test('approval refuses changed hashes and blocked drafts', async () => {
  setup([{table:'correspondence_drafts',result:{data:{id:'draft-a',content_hash:hash,review_status:'pass'},error:null}}])
  assert.match((await approveDraft('draft-a','b'.repeat(64))).error,/changed/); complete()
  setup([{table:'correspondence_drafts',result:{data:{id:'draft-a',content_hash:hash,review_status:'block'},error:null}}])
  assert.match((await approveDraft('draft-a',hash)).error,/review/); complete()
})
test('approval is retry-safe after a duplicate request', async () => {
  setup([
    {table:'correspondence_drafts',result:{data:{id:'draft-a',case_id:'case-a',content_hash:hash,review_status:'pass'},error:null}},
    owned,
    {table:'approvals',result:{data:null,error:{code:'23505'}}},
    {table:'approvals',result:{data:{id:'saved-approval'},error:null},check:q=>assert.ok(q.filters.some(([key,value])=>key==='user_id'&&value==='user-a'))},
  ])
  assert.equal((await approveDraft('draft-a',hash)).approval.id,'saved-approval'); complete()
})
test('concurrent draft version conflicts retry using a new version', async () => {
  const facts = [{key:'recipient',value:'Amt'},{key:'subject',value:'Anfrage'},{key:'request',value:'Bitte um Auskunft'}]
  setup([
    owned,{table:'extracted_facts',result:{data:facts,error:null}},
    {table:'correspondence_drafts',result:{data:[{version:1}],error:null}},
    {table:'correspondence_drafts',result:{data:null,error:{code:'23505'}},check:q=>assert.equal(q.value.version,2)},
    {table:'correspondence_drafts',result:{data:[{version:2}],error:null}},
    {table:'correspondence_drafts',result:{data:{id:'new-draft',version:3},error:null},check:q=>{assert.equal(q.value.version,3);assert.equal(q.value.owner_id,'user-a');assert.equal(q.value.translation,null)}},
  ])
  assert.equal((await generateDraft('case-a','bg',[])).draft.version,3); complete()
})
