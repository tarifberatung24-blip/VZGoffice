import { notFound, redirect } from 'next/navigation'
import { createClient } from '../../../lib/supabase/server'
import { locales } from '../../../lib/locales'
import { authCopy } from '../../../lib/auth-copy'
import type { Locale } from '../../../lib/supabase/database'
import { signOut } from '../../actions/auth'

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()
  const supabase = await createClient()
  if (!supabase) return <main className="p-8"><h1>{authCopy[locale as Locale].setup}</h1><p>{authCopy[locale as Locale].setupText}</p></main>
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/login`)
  const { data: profile } = await supabase.from('profiles').select('display_name, locale').eq('id', user.id).maybeSingle()
  const { data: cases } = await supabase.from('cases').select('id, title, status, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(20)
  return <main className="min-h-screen bg-muted px-4 py-10"><section className="mx-auto max-w-4xl rounded-2xl border bg-card p-6 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-muted-foreground">KintexBG</p><h1 className="mt-2 text-2xl font-semibold">{profile?.display_name || user.email}</h1><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></div><form action={signOut}><button className="rounded-lg border px-3 py-2 text-sm">{authCopy[locale as Locale].signOut}</button></form></div><div className="mt-8"><h2 className="text-lg font-semibold">{locale === 'bg' ? 'Моите случаи' : 'Meine Vorgänge'}</h2>{cases?.length ? <ul className="mt-4 space-y-2">{cases.map(item => <li key={item.id} className="rounded-lg border p-3"><span className="font-medium">{item.title || '—'}</span><span className="ml-3 text-xs text-muted-foreground">{item.status}</span></li>)}</ul> : <p className="mt-4 rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{locale === 'bg' ? 'Все още няма случаи.' : 'Noch keine Vorgänge vorhanden.'}</p>}</div></section></main>
}
