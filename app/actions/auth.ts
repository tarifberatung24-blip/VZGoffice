'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'
import { locales } from '../../lib/locales'
import type { Locale } from '../../lib/supabase/database'
import { upsertOwnProfile } from '../../lib/repositories/profiles'

export async function syncProfile(input: { locale: string; conversationLocale?: string; outputLocale?: string; displayName?: string }) {
  const supabase = await createClient(); if (!supabase) return { error: 'setup' }
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return { error: 'auth' }
  const fallback = locales.includes(input.locale as Locale) ? input.locale as Locale : 'bg'
  const conversation_locale = locales.includes(input.conversationLocale as Locale) ? input.conversationLocale as Locale : fallback
  const output_locale = locales.includes(input.outputLocale as Locale) ? input.outputLocale as Locale : 'de'
  const { data: existing } = await supabase.from('profiles').select('display_name, conversation_locale, output_locale').eq('id', user.id).maybeSingle()
  const result = await upsertOwnProfile(supabase, user.id, { locale: fallback, conversation_locale: input.conversationLocale ? conversation_locale : existing?.conversation_locale ?? fallback, output_locale: input.outputLocale ? output_locale : existing?.output_locale ?? 'de', display_name: (input.displayName ?? existing?.display_name ?? '').slice(0, 120) })
  if (result.error) return { error: result.error }; revalidatePath(`/${fallback}`); return { ok: true }
}
export async function signOut() { const supabase = await createClient(); if (supabase) await supabase.auth.signOut(); revalidatePath('/', 'layout'); redirect('/') }
