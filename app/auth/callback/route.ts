import { NextResponse } from 'next/server'
import { createClient } from '../../../lib/supabase/server'
import { locales } from '../../../lib/locales'
import type { Locale } from '../../../lib/supabase/database'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') || '/bg'
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/bg'
  const supabase = await createClient()
  if (!supabase) return NextResponse.redirect(new URL('/bg/login?error=setup', url.origin))
  if (code) await supabase.auth.exchangeCodeForSession(code)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/bg/login?error=auth', url.origin))
  const requestedLocale = user.user_metadata?.locale
  const locale: Locale = locales.includes(requestedLocale as Locale) ? requestedLocale as Locale : 'bg'
  await supabase.from('profiles').upsert({ id: user.id, locale, display_name: typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0, 120) : '' }, { onConflict: 'id' })
  return NextResponse.redirect(new URL(safeNext === '/bg' ? `/${locale}` : safeNext, url.origin))
}
