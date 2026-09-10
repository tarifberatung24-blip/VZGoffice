import assert from 'node:assert/strict'
const origin = process.env.SMOKE_ORIGIN || 'http://localhost:3000'
const get = path => fetch(new URL(path, origin), { redirect: 'manual', signal: AbortSignal.timeout(15000) })
for (const locale of ['bg','de','ru','pl','sr','ro']) {
  for (const path of ['', '/login', '/signup', '/help']) {
    const response = await get(`/${locale}${path}`)
    assert.equal(response.status, 200, `${locale}${path}`)
    const html = await response.text()
    assert.match(html, /KintexBG/)
    assert.doesNotMatch(html, /Preview Mode|setStage/)
  }
}
assert.equal((await get('/xx')).status, 404)
const health = await get('/api/health')
assert.equal(health.status, 503, 'run this smoke test without Supabase credentials')
const data = await health.json()
assert.equal(data.configured, false)
assert.equal(data.capabilities.ocr, false)
assert.equal(data.capabilities.aiTranslation, false)
const invalid = await fetch(new URL('/api/cases/not-a-uuid/workflow', origin), { method: 'POST', headers:{'Content-Type':'application/json'}, body:'{}' })
assert.equal(invalid.status, 400)
const crossOrigin = await fetch(new URL('/api/cases', origin), { method: 'POST', headers:{ Origin:'https://evil.example', 'Content-Type':'application/json' }, body:'{}' })
assert.equal(crossOrigin.status, 403)
console.log('Runtime smoke: 24 locale pages, invalid locale, health, validation and cross-origin protection PASS')
