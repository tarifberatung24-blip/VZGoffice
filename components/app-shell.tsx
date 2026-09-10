'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Menu, Sparkles, X } from 'lucide-react'
import { locales } from '../lib/locales'
import { workspaceCopy } from '../lib/workspace-copy'
import type { Locale } from '../lib/supabase/database'

export function AppShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname(), router = useRouter(), t = workspaceCopy[locale]
  const [open, setOpen] = useState(false)
  const routes = [['', t.home], ['/dashboard', t.cases], ['/documents', t.documents], ['/drafts', t.drafts], ['/settings', t.settings], ['/help', t.help]]
  return <div lang={locale} className="min-h-screen bg-background text-foreground">
    <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b bg-card px-4 py-3 lg:px-8">
      <div className="flex items-center gap-3"><button onClick={() => setOpen(!open)} aria-label={t.cases} aria-expanded={open} aria-controls="main-nav" className="rounded-lg border p-2 lg:hidden">{open ? <X /> : <Menu />}</button><Link href={`/${locale}`} className="flex items-center gap-2 font-semibold"><Sparkles className="text-primary" />KintexBG</Link></div>
      <label className="flex items-center gap-2 text-sm">{t.language}<select value={locale} onChange={e => { setOpen(false); router.push(pathname.replace(/^\/[a-z]{2}(?=\/|$)/, `/${e.target.value}`)) }} className="rounded-lg border bg-background p-2">{locales.map(item => <option key={item} value={item}>{item.toUpperCase()}</option>)}</select></label>
    </header>
    <div className="lg:flex"><aside id="main-nav" className={`${open ? 'block' : 'hidden'} w-full shrink-0 border-b bg-card p-4 lg:block lg:min-h-[calc(100vh-4rem)] lg:w-60 lg:border-r`}><nav aria-label="KintexBG" className="space-y-1">{routes.map(([suffix,label]) => <Link key={suffix} href={`/${locale}${suffix}`} onClick={() => setOpen(false)} aria-current={pathname === `/${locale}${suffix}` ? 'page' : undefined} className={`block rounded-lg px-3 py-3 text-sm ${pathname === `/${locale}${suffix}` ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}>{label}</Link>)}<a href={`https://www.finanzberaterbg.de/${locale === 'bg' ? 'bg' : 'de'}`} className="mt-6 block rounded-lg border px-3 py-3 text-sm">← {t.platform}</a></nav></aside><div className="min-w-0 flex-1">{children}</div></div>
  </div>
}
