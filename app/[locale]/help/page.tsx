import { workspaceCopy } from '../../../lib/workspace-copy'
import type { Locale } from '../../../lib/supabase/database'
import { notFound } from 'next/navigation'
export default async function Help({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = workspaceCopy[locale as Locale]
  if (!t) notFound()
  return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-semibold">{t.help}</h1><p className="mt-6 leading-7">{t.helpText}</p><p className="mt-6 rounded-xl border bg-muted p-4">{t.manual}</p></main>
}
