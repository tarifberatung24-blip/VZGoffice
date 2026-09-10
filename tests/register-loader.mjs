// Test-only module boundaries: never load credentials or contact Supabase.
import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
const fixture = new URL('./supabase-fixture.mjs', import.meta.url).href
registerHooks({ resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') return { url: 'data:text/javascript,export {}', shortCircuit: true }
  if (specifier.endsWith('/supabase/admin') || specifier.endsWith('/supabase/auth')) return { url: fixture, shortCircuit: true }
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const candidate = new URL(specifier + '.ts', context.parentURL)
    if (existsSync(candidate)) return nextResolve(candidate.href, context)
  }
  return nextResolve(specifier, context)
} })
