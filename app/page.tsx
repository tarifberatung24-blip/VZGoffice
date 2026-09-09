import { redirect } from 'next/navigation'

export const locales = ['bg', 'de', 'ru', 'pl', 'sr', 'ro'] as const

export default function Home() {
  redirect('/bg')
}
