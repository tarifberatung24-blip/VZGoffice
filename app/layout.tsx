import type { Metadata } from 'next'
import './[locale]/globals.css'

export const metadata: Metadata = { title: 'KintexBG AI Kommunikationsassistent', description: 'Multilingual communication assistance with explicit approval and no automatic sending.' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html><body>{children}</body></html>
}
