import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { DeterministicDraftGenerator } from '../lib/workflow/deterministic.ts'

const fixtures = JSON.parse(await readFile(new URL('./fixtures/eval-bg-de.json', import.meta.url), 'utf8'))
const generator = new DeterministicDraftGenerator()
let hallucinatedCriticalFacts = 0
let incompleteBlocked = 0
for (const fixture of fixtures) {
  const output = await generator.generate({ caseRecord: { id: fixture.id, owner_id: 'eval', title: fixture.id, intent: fixture.intent, ui_locale: fixture.locale, conversation_locale: fixture.locale, status: 'NEW', institution: null, deadline: null, created_at: new Date(0).toISOString() }, facts: fixture.facts, outputLocale: fixture.locale, documentIds: [] })
  hallucinatedCriticalFacts += fixture.forbiddenCritical.filter((value) => `${output.subject_de}\n${output.body_de}\n${output.translation}`.toLowerCase().includes(value.toLowerCase())).length
  if (fixture.id.startsWith('incomplete-') && output.missing.length > 0) incompleteBlocked += 1
}
const metric = { fixtures: fixtures.length, hallucinatedCriticalFacts, incompleteBlocked, incompleteFixtures: fixtures.filter((fixture) => fixture.id.startsWith('incomplete-')).length, hallucinationFreeRate: hallucinatedCriticalFacts === 0 ? 100 : 0 }
assert.equal(metric.hallucinatedCriticalFacts, 0)
assert.equal(metric.incompleteBlocked, metric.incompleteFixtures)
console.log(`eval-bg-de: ${JSON.stringify(metric)}`)
