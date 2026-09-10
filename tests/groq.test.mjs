import test from 'node:test'
import assert from 'node:assert/strict'
import { generateGroqDraft, validateProviderOutput } from '../lib/workflow/groq.ts'
import { DeterministicDraftGenerator } from '../lib/workflow/deterministic.ts'

const input = { caseRecord:{ id:'private-case-id' }, facts:[{key:'recipient',value:'Amt'},{key:'subject',value:'Въпрос'},{key:'request',value:'Искам информация.'},{key:'unused',value:'private-unused-value'}], outputLocale:'bg', documentIds:['private-document-id'] }
const base = await new DeterministicDraftGenerator().generate(input)
const output = { subject_de:'Anfrage', body_de:'Bitte um Informationen.', translation:'Запитване\nМоля за информация.', missing:[] }
const config = { apiKey:'test-key-not-real', model:'test-model' }
test('AI request excludes identifiers and unrelated facts; response is a real translated field', async () => {
  let called = false
  const draft = await generateGroqDraft(input, base, config, async (url, request) => {
    called = true
    assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions')
    assert.doesNotMatch(request.body, /private-case-id|private-document-id|private-unused-value/)
    assert.equal(JSON.parse(request.body).response_format.json_schema.strict, true)
    return Response.json({ choices:[{finish_reason:'stop', message:{content:JSON.stringify(output)}}] })
  })
  assert.equal(called, true)
  assert.equal(draft.translation, output.translation)
  assert.notEqual(draft.contentHash, base.contentHash)
  assert.equal(draft.recipient, 'Amt')
  assert.deepEqual(draft.attachments, ['private-document-id'])
})
test('AI never calls provider when required facts are missing', async () => {
  const missing = { ...base, missing:['recipient'] }
  assert.equal(await generateGroqDraft(input, missing, config, () => { throw new Error('must not call') }), missing)
})
test('AI rejects quota errors, truncation and malformed responses instead of inventing fallback results', async () => {
  for (const response of [new Response('', {status:429}), Response.json({choices:[{finish_reason:'length',message:{content:'{}'}}]}), Response.json({choices:[{finish_reason:'stop',message:{content:'not json'}}]})]) {
    await assert.rejects(generateGroqDraft(input, base, config, async () => response))
  }
  for (const value of [null, {}, { ...output, missing:'no' }, { ...output, translation:'' }, { ...output, body_de:3 }]) assert.throws(() => validateProviderOutput(value))
})
