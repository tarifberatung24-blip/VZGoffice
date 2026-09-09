import assert from 'node:assert/strict'
import { safeNextPath } from '../lib/supabase/auth-utils.ts'
import { sanitizeCaseCreate, sanitizeCaseUpdate } from '../lib/cases/validation.ts'

assert.equal(safeNextPath('/bg/dashboard'), '/bg/dashboard')
assert.equal(safeNextPath('//evil.example'), '/bg')
assert.equal(safeNextPath('https://evil.example'), '/bg')
assert.equal(sanitizeCaseCreate({ title:'My case', intent:'explanation', ui_locale:'bg', conversation_locale:'de' }).value.title, 'My case')
assert.equal('error' in sanitizeCaseCreate({ title:'', intent:'explanation', ui_locale:'bg', conversation_locale:'de' }), true)
assert.equal('owner_id' in sanitizeCaseUpdate({ owner_id:'attacker', title:'Safe' }).value, false)
assert.equal(sanitizeCaseUpdate({ title:'Updated', ui_locale:'de' }).value.ui_locale, 'de')
console.log('auth-ownership tests: PASS')
