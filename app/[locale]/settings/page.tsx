import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { detailCopy } from '../../../lib/case-detail-copy'
import { authCopy } from '../../../lib/auth-copy'
import { locales } from '../../../lib/locales'
import type { Locale } from '../../../lib/supabase/database'
import { createClient } from '../../../lib/supabase/server'
import { SettingsForm } from '../../../components/settings-form'
import { signOut } from '../../actions/auth'

export default async function SettingsPage({ params }: { params: Promise<{ locale:string }> }) { const { locale } = await params; if (!locales.includes(locale as Locale)) notFound(); const supabase = await createClient(); if (!supabase) return <main className="p-8">{authCopy[locale as Locale].setup}</main>; const { data:{ user } } = await supabase.auth.getUser(); if (!user) redirect(`/${locale}/login`); const { data: profile } = await supabase.from('profiles').select('display_name, locale, conversation_locale, output_locale').eq('id', user.id).maybeSingle(); const t = detailCopy[locale as Locale]; return <main className="min-h-screen bg-muted px-4 py-10"><section className="mx-auto max-w-2xl rounded-2xl border bg-card p-6 shadow-sm"><Link href={`/${locale}/dashboard`} className="text-sm text-primary hover:underline">← {t.back}</Link><h1 className="mt-5 text-2xl font-semibold">{t.settings}</h1><p className="mt-2 text-sm text-muted-foreground">{t.privacy}</p><SettingsForm locale={locale as Locale} profile={profile} /><form action={signOut} className="mt-4"><button className="rounded-lg border px-4 py-2 text-sm">{authCopy[locale as Locale].signOut}</button></form></section></main> }
