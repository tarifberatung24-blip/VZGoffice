'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../../lib/supabase/server'
import { locales } from '../../lib/locales'
import type { Locale } from '../../lib/supabase/database'

export async function syncProfile(input: { locale: string; displayName?: string }) {
  const supabase = await createClient()
  if (!supabase) return { error: 'setup' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'auth' }
  const locale: Locale = locales.includes(input.locale as Locale) ? input.locale as Locale : 'bg'
  const { error } = await supabase.from('profiles').upsert({ id: user.id, locale, display_name: (input.displayName ?? '').slice(0, 120) }, { onConflict: 'id' })
  if (error) return { error: error.message }
  revalidatePath(`/${locale}`)
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  if (supabase) await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
