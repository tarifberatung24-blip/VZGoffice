import Link from 'next/link'
import { CaseWorkspace } from '../../components/case-workspace'
import { getAuthenticatedUser } from '../../lib/supabase/auth'
import { authCopy } from '../../lib/auth-copy'
import { workspaceCopy, aiCopy } from '../../lib/workspace-copy'
import { groqConfig } from '../../lib/workflow/provider'
import type { Locale } from '../../lib/supabase/database'
import { notFound } from 'next/navigation'
import { isUuid } from '../../lib/workflow/validation'

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ case?: string }> }) {
  const { locale } = await params
  const t = workspaceCopy[locale as Locale], a = authCopy[locale as Locale]
  if (!t) notFound()
  const { user, supabase } = await getAuthenticatedUser()
  const query = await searchParams
  const aiEnabled = !!groqConfig()
  return <main className="mx-auto max-w-5xl p-4 sm:p-8"><h1 className="text-2xl font-semibold">Kommunikationsassistent</h1><p className="my-5 rounded-xl border bg-muted p-4 text-sm leading-6">{aiEnabled ? aiCopy[locale as Locale].notice : t.manual}</p>
    {!supabase ? <section role="status"><h2>{a.setup}</h2><p>{a.setupText}</p></section> : !user ? <div className="flex flex-wrap gap-3"><Link href={`/${locale}/login`} className="rounded-lg bg-primary px-5 py-3 text-primary-foreground">{a.login}</Link><Link href={`/${locale}/signup`} className="rounded-lg border px-5 py-3">{a.signup}</Link></div> : <CaseWorkspace key={`${locale}-${query.case ?? ''}`} locale={locale as Locale} aiEnabled={aiEnabled} initialCaseId={isUuid(query.case) ? query.case : undefined} />}
  </main>
}
