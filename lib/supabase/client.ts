import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database'
import { publicConfig } from './config'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const config = publicConfig(url, key)
  if (!config) return null
  return createBrowserClient<Database>(config.url, config.key)
}
