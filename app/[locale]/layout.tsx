import { notFound } from 'next/navigation'
import { locales } from '../../lib/locales'

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!locales.includes(locale as (typeof locales)[number])) notFound()
  return <>{children}</>
}
