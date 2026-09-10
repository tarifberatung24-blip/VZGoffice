'use client'
import { useState } from 'react'
import { syncProfile } from '../app/actions/auth'
import { detailCopy } from '../lib/case-detail-copy'
import { workspaceCopy } from '../lib/workspace-copy'
import { locales } from '../lib/locales'
import type { Locale } from '../lib/supabase/database'
import type { ProfilePreferences } from '../lib/repositories/profiles'

export function SettingsForm({ locale, profile }: { locale: Locale; profile: ProfilePreferences | null }) {
  const t = detailCopy[locale], w = workspaceCopy[locale]
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState(false)
  return <form className="mt-6 space-y-4" onSubmit={async event => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setBusy(true); setError(''); setSaved(false)
    try {
      const result = await syncProfile({ locale: String(form.get('locale')), conversationLocale: String(form.get('conversation_locale')), outputLocale: String(form.get('output_locale')), displayName: String(form.get('display_name')) })
      if ('error' in result) setError(w.network); else setSaved(true)
    } catch { setError(w.network) } finally { setBusy(false) }
  }}>
    <fieldset disabled={busy} className="space-y-4"><label className="block text-sm font-medium">{t.displayName}<input name="display_name" defaultValue={profile?.display_name ?? ''} maxLength={120} className="mt-2 w-full rounded-lg border bg-background p-3" /></label>
      {([['locale',t.interfaceLanguage],['conversation_locale',t.conversationLanguage],['output_locale',t.outputLanguage]] as const).map(([name,label]) => <label key={name} className="block text-sm font-medium">{label}<select name={name} defaultValue={profile?.[name] ?? (name === 'output_locale' ? 'de' : locale)} className="mt-2 w-full rounded-lg border bg-background p-3">{locales.map(value => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></label>)}
      <button className="rounded-lg bg-primary px-4 py-3 text-primary-foreground">{busy ? '…' : t.save}</button>
    </fieldset>{error && <p role="alert">{error}</p>}{saved && <p role="status">{w.saved}</p>}
  </form>
}
