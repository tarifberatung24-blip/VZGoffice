import { notFound } from 'next/navigation'
import { locales } from '../../lib/locales'
import { AppShell } from '../../components/app-shell'

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!locales.includes(locale as (typeof locales)[number])) notFound()
  return <AppShell locale={locale as (typeof locales)[number]}>{children}</AppShell>
}
