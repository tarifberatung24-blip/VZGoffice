import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getAuthenticatedUser } from '../lib/supabase/auth'
import { workspaceCopy } from '../lib/workspace-copy'
import { authCopy } from '../lib/auth-copy'
import type { Locale } from '../lib/supabase/database'

export async function OwnedCollection({ locale, kind }: { locale: Locale; kind: 'documents' | 'drafts' }) {
  const t = workspaceCopy[locale]
  if (!t) notFound()
  const { user, supabase } = await getAuthenticatedUser()
  if (!supabase) return <main className="p-6">{authCopy[locale].setupText}</main>
  if (!user) redirect(`/${locale}/login`)
  const result = kind === 'documents'
    ? await supabase.from('source_documents').select('id, case_id, path, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(100)
    : await supabase.from('correspondence_drafts').select('id, case_id, subject_de, version, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(100)
  return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-semibold">{t[kind]}</h1>
    {result.error ? <p role="alert" className="mt-5 rounded-xl border p-4">{t.network}</p> : result.data?.length ? <ul className="mt-6 space-y-3">{result.data.map(item => <li key={item.id} className="rounded-xl border bg-card p-4"><p className="break-all font-medium">{'path' in item ? item.path.split('/').pop() : `v${item.version} · ${item.subject_de}`}</p><div className="mt-3 flex flex-wrap gap-4 text-sm"><Link className="text-primary underline" href={`/${locale}?case=${item.case_id}`}>{t.open}</Link><a className="text-primary underline" href={kind === 'documents' ? `/api/documents/${item.id}/signed-url?download=1` : `/api/drafts/${item.id}/export`}>{kind === 'documents' ? t.documents : t.export}</a></div></li>)}</ul> : <Link href={`/${locale}`} className="mt-6 inline-block rounded-lg border px-4 py-3">{t.newCase}</Link>}
  </main>
}
