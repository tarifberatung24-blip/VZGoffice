'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { workspaceCopy } from '../../lib/workspace-copy'
import type { Locale } from '../../lib/supabase/database'
export default function ErrorPage({ reset }: { reset: () => void }) {
  const locale = usePathname().split('/')[1] as Locale
  const t = workspaceCopy[locale] ?? workspaceCopy.bg
  return <main className="p-6"><h1 role="alert" className="text-xl font-semibold">{t.network}</h1><div className="mt-5 flex gap-4"><button onClick={reset} className="rounded-lg border px-4 py-3">{t.retry}</button><Link href={`/${locale}/login`} className="rounded-lg border px-4 py-3">KintexBG</Link></div></main>
}
