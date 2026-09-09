import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { locales } from '../../../lib/locales'
import type { Locale } from '../../../lib/supabase/database'
import { safeNextPath } from '../../../lib/supabase/auth-utils'
import { upsertOwnProfile } from '../../../lib/repositories/profiles'

export async function GET(request: Request) {
  const url = new URL(request.url); const code = url.searchParams.get('code'); const next = safeNextPath(url.searchParams.get('next'))
  const supabase = await createClient(); if (!supabase) return NextResponse.redirect(new URL('/bg/login?error=setup', url.origin))
  if (code) { const { error } = await supabase.auth.exchangeCodeForSession(code); if (error) return NextResponse.redirect(new URL('/bg/login?error=auth', url.origin)) }
  const { data: { user } } = await supabase.auth.getUser(); if (!user) return NextResponse.redirect(new URL('/bg/login?error=auth', url.origin))
  const requested = user.user_metadata?.locale; const locale: Locale = locales.includes(requested as Locale) ? requested as Locale : 'bg'
  await upsertOwnProfile(supabase, user.id, { locale, conversation_locale: locale, output_locale: 'de', display_name: typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0, 120) : '' })
  return NextResponse.redirect(new URL(next === '/bg' ? `/${locale}/dashboard` : next, url.origin))
}
