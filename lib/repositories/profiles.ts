import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Locale } from '../supabase/database'

export type ProfilePreferences = { display_name: string; locale: Locale; conversation_locale: Locale; output_locale: Locale }
export async function upsertOwnProfile(client: SupabaseClient<Database>, userId: string, input: ProfilePreferences) {
  // Column-scoped grants deliberately do not allow updating id. ON CONFLICT
  // would attempt that update even when the id is unchanged.
  const existing = await client.from('profiles').select('id').eq('id', userId).maybeSingle()
  if (existing.error) return { data: null, error: existing.error.message }
  if (!existing.data) {
    const inserted = await client.from('profiles').insert({ id: userId, ...input }).select('*').single()
    if (!inserted.error || inserted.error.code !== '23505') return { data: inserted.data, error: inserted.error?.message ?? null }
  }
  const { data, error } = await client.from('profiles').update(input).eq('id', userId).select('*').single()
  return { data, error: error?.message ?? null }
}
