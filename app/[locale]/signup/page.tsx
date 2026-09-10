import { notFound } from 'next/navigation'
import { AuthForm } from '../../../components/auth-form'
import { locales } from '../../../lib/locales'
import type { Locale } from '../../../lib/supabase/database'

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!locales.includes(locale as Locale)) notFound()
  return <AuthForm locale={locale as Locale} mode="signup" />
}
