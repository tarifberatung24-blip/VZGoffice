import { OwnedCollection } from '../../../components/owned-collection'
import type { Locale } from '../../../lib/supabase/database'
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <OwnedCollection locale={locale as Locale} kind="documents" />
}
