import { spawn } from 'node:child_process'
import { once } from 'node:events'
const origin = 'http://127.0.0.1:3109'
const env = { ...process.env, NEXT_PUBLIC_SUPABASE_URL:'', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'', SUPABASE_SERVICE_ROLE_KEY:'', KINTEX_AI_ENABLED:'false' }
const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3109'], { env, stdio:['ignore','pipe','pipe'] })
let output = ''
server.stdout.on('data', data => { output += data })
server.stderr.on('data', data => { output += data })
const exited = once(server, 'exit')
try {
  let ready = false
  for (let i = 0; i < 60; i++) {
    if (server.exitCode !== null) throw new Error('Server failed to start: ' + output)
    try { await fetch(origin + '/api/health', {signal:AbortSignal.timeout(500)}); ready = true; break } catch { await new Promise(resolve => setTimeout(resolve, 250)) }
  }
  if (!ready) throw new Error('Server startup timed out: ' + output)
  process.env.SMOKE_ORIGIN = origin
  await import('./runtime-smoke.mjs')
} finally { server.kill('SIGTERM'); await exited }
