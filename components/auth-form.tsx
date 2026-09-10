'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../lib/supabase/client'
import { authCopy } from '../lib/auth-copy'
import type { Locale } from '../lib/supabase/database'
import { syncProfile } from '../app/actions/auth'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

export function AuthForm({ locale, mode }: { locale: Locale; mode: Mode }) {
  const t = authCopy[locale]
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('')
    if (!supabase) { setError(t.setupText); setBusy(false); return }
    try {
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : mode === 'signup'
        ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/${locale}/dashboard`, data: { display_name: displayName, locale } } })
        : mode === 'forgot'
          ? await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/${locale}/reset-password` })
          : await supabase.auth.updateUser({ password })
    if (result.error) setError(result.error.message || t.error)
    else if (mode === 'login') { router.push(`/${locale}/dashboard`); router.refresh() }
    else if (mode === 'signup') { if ('data' in result && result.data && 'session' in result.data && result.data.session) { await syncProfile({ locale, displayName }); router.push(`/${locale}/dashboard`); router.refresh() } else setMessage(t.success) }
    else setMessage(mode === 'forgot' ? t.resetSent : t.success)
    } catch { setError(t.error) } finally { setBusy(false) }
  }

  const title = t[mode]
  return <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-10"><section className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8"><div className="mb-8"><Link href={`/${locale}`} className="text-sm font-semibold text-primary">Kintex<span className="text-foreground">BG</span></Link><h1 className="mt-5 text-2xl font-semibold">{title}</h1></div><form onSubmit={submit} className="space-y-4">{mode === 'signup' && <label className="block text-sm"><span className="mb-1 block font-medium">{t.displayName}</span><input required maxLength={120} value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5" /></label>}{mode !== 'reset' && <label className="block text-sm"><span className="mb-1 block font-medium">{t.email}</span><input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5" /></label>}{mode !== 'forgot' && <label className="block text-sm"><span className="mb-1 block font-medium">{t.password}</span><input required minLength={8} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5" /></label>}<button disabled={busy} className="w-full rounded-lg bg-primary px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-60">{busy ? '…' : mode === 'login' ? t.submitLogin : mode === 'signup' ? t.submitSignup : mode === 'forgot' ? t.submitForgot : t.submitReset}</button></form>{message && <p className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">{message}</p>}{error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="mt-6 space-y-2 text-sm text-muted-foreground">{mode === 'login' && <><p>{t.noAccount} <Link className="font-semibold text-primary" href={`/${locale}/signup`}>{t.signup}</Link></p><p><Link className="text-primary" href={`/${locale}/forgot-password`}>{t.forgotLink}</Link></p></>}{mode === 'signup' && <p>{t.hasAccount} <Link className="font-semibold text-primary" href={`/${locale}/login`}>{t.login}</Link></p>}{(mode === 'forgot' || mode === 'reset') && <p><Link className="font-semibold text-primary" href={`/${locale}/login`}>{t.backLogin}</Link></p>}</div></section></main>
}
