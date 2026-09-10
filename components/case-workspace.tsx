'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { CaseRecord } from '../lib/repositories/cases'
import type { Locale } from '../lib/supabase/database'
import { caseStatusLabel } from '../lib/case-copy'
import { workspaceCopy, aiCopy } from '../lib/workspace-copy'

type Fact = { key: string; value: string; evidence?: string | null; page_no?: number | null }
type Draft = { id: string; version: number; subject_de: string; body_de: string; recipient: string | null; attachments: unknown[]; translation: string | null; content_hash: string; review_status: string; created_at: string }
type Document = { id: string; path: string; mime: string; size_bytes: number }
type Detail = { caseRecord: CaseRecord; facts: Fact[]; documents: Document[]; drafts: Draft[]; error?: string | null }
type Fields = { recipient: string; subject: string; request: string }
const emptyFields: Fields = { recipient: '', subject: '', request: '' }
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(30000) })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.error) throw new Error(data.error || `HTTP ${response.status}`)
  return data as T
}
const json = (value: unknown): RequestInit => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) })
const copy: Record<Locale, Record<string, string>> = {
  bg:{title:'Моите случаи',subtitle:'Данните се пазят в Supabase и са видими само за вас.',create:'Създай случай',empty:'Все още няма случаи.',emptyText:'Създайте първия случай след като добавите документ или въпрос.',save:'Запази',titleField:'Заглавие',login:'Влезте в профила си, за да запазвате случаи.',error:'Възникна грешка.',configured:'Supabase не е конфигуриран.',manual:'Ръчна проверка',manualText:'OCR не е конфигуриран. Потвърдете фактите ръчно; няма автоматично разпознати стойности.',factKey:'Поле',factValue:'Стойност',addFact:'Добави потвърден факт',generate:'Създай чернова',missing:'Липсва информация',draft:'Немска чернова',approve:'Одобри черновата',never:'Никога не се изпраща автоматично. Вашето одобрение е задължително.',safety:'Проверете имена, дати, суми и договорни номера. Това е комуникационна помощ, не правен съвет.'},
  de:{title:'Meine Vorgänge',subtitle:'Ihre Daten werden in Supabase gespeichert und bleiben privat.',create:'Vorgang erstellen',empty:'Noch keine Vorgänge.',emptyText:'Erstellen Sie den ersten Vorgang.',save:'Speichern',titleField:'Titel',login:'Melden Sie sich an, um Vorgänge zu speichern.',error:'Ein Fehler ist aufgetreten.',configured:'Supabase ist nicht konfiguriert.',manual:'Manuelle Prüfung',manualText:'OCR ist nicht konfiguriert. Bestätigen Sie die Fakten manuell; es werden keine Werte erfunden.',factKey:'Feld',factValue:'Wert',addFact:'Bestätigten Fakt hinzufügen',generate:'Entwurf erstellen',missing:'Fehlende Informationen',draft:'Deutscher Entwurf',approve:'Entwurf freigeben',never:'Wird niemals automatisch versendet. Ihre Freigabe ist erforderlich.',safety:'Prüfen Sie Namen, Daten, Beträge und Vertragsnummern. Dies ist Kommunikationshilfe, keine Rechtsberatung.'},
  ru:{title:'Мои дела',subtitle:'Данные хранятся в Supabase и доступны только вам.',create:'Создать дело',empty:'Дел пока нет.',emptyText:'Создайте первое дело.',save:'Сохранить',titleField:'Название',login:'Войдите, чтобы сохранять дела.',error:'Произошла ошибка.',configured:'Supabase не настроен.',manual:'Ручная проверка',manualText:'OCR не настроен. Подтвердите факты вручную; значения не придумываются.',factKey:'Поле',factValue:'Значение',addFact:'Добавить факт',generate:'Создать черновик',missing:'Не хватает информации',draft:'Немецкий черновик',approve:'Одобрить черновик',never:'Никогда не отправляется автоматически. Требуется ваше одобрение.',safety:'Проверьте имена, даты, суммы и номера договоров. Это помощь в коммуникации, не юридическая консультация.'},
  pl:{title:'Moje sprawy',subtitle:'Dane są przechowywane w Supabase i widoczne tylko dla Ciebie.',create:'Utwórz sprawę',empty:'Brak spraw.',emptyText:'Utwórz pierwszą sprawę.',save:'Zapisz',titleField:'Tytuł',login:'Zaloguj się, aby zapisywać sprawy.',error:'Wystąpił błąd.',configured:'Supabase nie jest skonfigurowany.',manual:'Kontrola ręczna',manualText:'OCR nie jest skonfigurowany. Potwierdź fakty ręcznie; wartości nie są wymyślane.',factKey:'Pole',factValue:'Wartość',addFact:'Dodaj fakt',generate:'Utwórz projekt',missing:'Brakujące informacje',draft:'Projekt niemiecki',approve:'Zatwierdź projekt',never:'Nigdy nie jest wysyłany automatycznie. Wymagana jest zgoda.',safety:'Sprawdź nazwiska, daty, kwoty i numery umów. To pomoc komunikacyjna, nie porada prawna.'},
  sr:{title:'Моји предмети',subtitle:'Подаци се чувају у Supabase-у и видљиви су само вама.',create:'Направи предмет',empty:'Нема предмета.',emptyText:'Направите први предмет.',save:'Сачувај',titleField:'Наслов',login:'Пријавите се да бисте чували предмете.',error:'Дошло је до грешке.',configured:'Supabase није подешен.',manual:'Ручна провера',manualText:'OCR није подешен. Потврдите чињенице ручно; вредности се не измишљају.',factKey:'Поље',factValue:'Вредност',addFact:'Додај чињеницу',generate:'Направи нацрт',missing:'Недостају информације',draft:'Немачки нацрт',approve:'Одобри нацрт',never:'Никада се не шаље аутоматски. Потребно је ваше одобрење.',safety:'Проверите имена, датуме, износе и бројеве уговора. Ово је помоћ у комуникацији, не правни савет.'},
  ro:{title:'Cazurile mele',subtitle:'Datele sunt stocate în Supabase și sunt vizibile doar pentru dvs.',create:'Creează caz',empty:'Nu există cazuri.',emptyText:'Creați primul caz.',save:'Salvează',titleField:'Titlu',login:'Autentificați-vă pentru a salva cazuri.',error:'A apărut o eroare.',configured:'Supabase nu este configurat.',manual:'Verificare manuală',manualText:'OCR nu este configurat. Confirmați manual faptele; valorile nu sunt inventate.',factKey:'Câmp',factValue:'Valoare',addFact:'Adaugă fapt',generate:'Creează proiect',missing:'Informații lipsă',draft:'Proiect în germană',approve:'Aprobă proiectul',never:'Nu este trimis niciodată automat. Este necesară aprobarea dvs.',safety:'Verificați nume, date, sume și numere de contract. Este asistență de comunicare, nu consultanță juridică.'},
}


export function CaseWorkspace({ locale, initialCaseId, aiEnabled = false }: { locale: Locale; initialCaseId?: string; aiEnabled?: boolean }) {
  const t = copy[locale], w = workspaceCopy[locale]
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [detail, setDetail] = useState<Detail | null>(null)
  const [title, setTitle] = useState('')
  const [fields, setFields] = useState<Fields>(emptyFields)
  const [savedFields, setSavedFields] = useState<Fields | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [approved, setApproved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [fileKey, setFileKey] = useState(0)
  const [reload, setReload] = useState(0)
  const selected = detail?.caseRecord
  const closed = selected?.status === 'ARCHIVED' || selected?.status === 'CLOSED'
  const dirtyFacts = !savedFields || JSON.stringify(fields) !== JSON.stringify(savedFields)

  function acceptDetail(value: Detail) {
    setDetail(value); setTitle(value.caseRecord.title)
    // The API orders facts newest first. Prefer the latest confirmed value per key.
    const next = { ...emptyFields }
    for (const key of Object.keys(next) as (keyof Fields)[]) next[key] = value.facts.find(f => f.key === key)?.value ?? ''
    setFields(next); setSavedFields(next); setDraft(null); setConfirmed(false); setApproved(false); setFile(null); setFileKey(k => k + 1)
  }
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const result = await api<{ cases: CaseRecord[] }>('/api/cases')
        const record = initialCaseId ? await api<Detail>(`/api/cases/${initialCaseId}/detail`) : null
        if (!active) return
        setCases(result.cases)
        if (record) acceptDetail(record)
      } catch (e) { if (active) setError(e instanceof Error ? e.message : w.network) }
      finally { if (active) setLoading(false) }
    }
    void load()
    return () => { active = false }
  }, [initialCaseId, reload, w.network])

  async function run(task: () => Promise<void>) {
    if (busy) return
    setBusy(true); setError(''); setNotice('')
    try { await task() } catch (e) { setError(e instanceof Error ? e.message : w.network) }
    finally { setBusy(false) }
  }
  async function refresh() { const result = await api<{ cases: CaseRecord[] }>('/api/cases'); setCases(result.cases) }
  function reset() {
    setDetail(null); setTitle(''); setFields({ ...emptyFields }); setSavedFields(null); setFile(null); setDraft(null); setConfirmed(false); setApproved(false); setError(''); setNotice(''); setFileKey(k => k + 1)
  }
  async function create() {
    const result = await api<{ case: CaseRecord }>('/api/cases', json({ title: title.trim(), intent: 'free_email', ui_locale: locale, conversation_locale: locale }))
    setDetail({ caseRecord: result.case, facts: [], documents: [], drafts: [] })
    setSavedFields(null); setDraft(null); setConfirmed(false); setApproved(false)
    await refresh(); setNotice(w.saved)
  }
  async function open(id: string) { acceptDetail(await api<Detail>(`/api/cases/${id}/detail`)) }
  async function upload() {
    if (!selected || !file) return
    const form = new FormData(); form.append('file', file)
    await api(`/api/cases/${selected.id}/documents`, { method: 'POST', body: form })
    const value = await api<Detail>(`/api/cases/${selected.id}/detail`)
    setDetail(value); setFile(null); setFileKey(k => k + 1); setDraft(null); setConfirmed(false); setApproved(false); setNotice(w.saved)
  }
  async function saveFacts() {
    if (!selected) return
    const facts = (Object.keys(fields) as (keyof Fields)[]).map(key => ({ key, value: fields[key].trim() }))
    await api(`/api/cases/${selected.id}/workflow`, json({ action: 'confirm-facts', facts }))
    setSavedFields({ ...fields }); setDraft(null); setConfirmed(false); setApproved(false)
    setDetail(await api<Detail>(`/api/cases/${selected.id}/detail`)); setNotice(w.saved)
  }
  async function generate() {
    if (!selected) return
    const result = await api<{ draft: Draft | null; missing: string[] }>(`/api/cases/${selected.id}/workflow`, json({ action: 'generate-draft', outputLocale: locale, documentIds: detail.documents.map(d => d.id) }))
    setConfirmed(false); setApproved(false); setDraft(result.draft)
    if (result.missing?.length) throw new Error(t.missing + ': ' + result.missing.join(', '))
    setDetail(await api<Detail>(`/api/cases/${selected.id}/detail`))
  }
  async function approve() {
    if (!draft || !confirmed) return
    await api(`/api/drafts/${draft.id}/approve`, json({ approvedHash: draft.content_hash }))
    setApproved(true)
  }
  const inputClass = 'mt-2 w-full rounded-lg border bg-background px-3 py-2.5'
  const buttonClass = 'rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50'
  return <section aria-busy={busy || loading} className="space-y-6">
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error === 'Unauthorized' ? <Link href={`/${locale}/login`}>{t.login}</Link> : error}<button onClick={() => { setError(''); setReload(n => n + 1) }} disabled={busy} className="ml-4 underline">{w.retry}</button></div>}
    {notice && <p role="status" className="rounded-lg border bg-secondary p-3">{notice}</p>}
    <fieldset disabled={busy || loading} className="space-y-6 disabled:opacity-80">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{selected ? selected.title : w.newCase}</h2>{selected && <button onClick={reset} className="rounded-lg border px-4 py-2">{w.newCase}</button>}</div>
      <div className="rounded-xl border bg-card p-5"><label className="block text-sm font-medium">{t.titleField}<input required maxLength={200} value={title} onChange={e => setTitle(e.target.value)} className={inputClass} /></label>
        <button disabled={!title.trim() || closed} onClick={() => void run(async () => { if (!selected) await create(); else { const result = await api<{ case: CaseRecord }>(`/api/cases/${selected.id}`, { ...json({ title }), method: 'PATCH' }); setDetail({ ...detail, caseRecord: result.case }); await refresh(); setNotice(w.saved) } })} className={`mt-4 ${buttonClass}`}>{selected ? t.save : t.create}</button>
        {selected && <Link href={`/${locale}/cases/${selected.id}`} className="ml-4 text-sm text-primary underline">{w.open}</Link>}
      </div>
      {selected && !closed && <>
        <section className="rounded-xl border bg-card p-5"><h3 className="font-semibold">{w.documents}</h3><p className="my-2 text-sm text-muted-foreground">{w.limit}</p>
          <input key={fileKey} type="file" accept=".pdf,.jpg,.jpeg,.png" aria-label={w.upload} onChange={e => { const next = e.target.files?.[0]; setFile(null); if (!next) return; if (next.size > 4 * 1024 * 1024 || next.size < 1 || !['application/pdf','image/jpeg','image/png'].includes(next.type)) { setError(w.limit); e.target.value = ''; return }; setError(''); setFile(next) }} className="block w-full text-sm" />
          <button disabled={!file} onClick={() => void run(upload)} className={`my-3 ${buttonClass}`}>{w.upload}</button>
          {detail.documents.map(d => <p key={d.id} className="mt-2 break-all text-sm"><a className="text-primary underline" href={`/api/documents/${d.id}/signed-url?download=1`}>{d.path.split('/').pop()}</a> · {Math.ceil(d.size_bytes / 1024)} KB</p>)}
        </section>
        <section className="rounded-xl border bg-card p-5"><h3 className="mb-3 font-semibold">{w.facts}</h3><p className="mb-4 text-sm">{t.manualText}</p>
          {(Object.keys(fields) as (keyof Fields)[]).map(key => <label key={key} className="mb-4 block text-sm font-medium">{aiEnabled && key !== 'recipient' ? aiCopy[locale][key] : w[key]}<textarea rows={key === 'request' ? 5 : 2} maxLength={4000} required value={fields[key]} onChange={e => { setFields(v => ({ ...v, [key]: e.target.value })); setDraft(null); setApproved(false); setConfirmed(false) }} className={inputClass} /></label>)}
          <div className="flex flex-wrap gap-3"><button disabled={Object.values(fields).some(value => !value.trim())} onClick={() => void run(saveFacts)} className={buttonClass}>{t.save}</button><button disabled={dirtyFacts || Object.values(fields).some(value => !value.trim())} onClick={() => void run(generate)} className={buttonClass}>{t.generate}</button></div>
        </section>
      </>}
      {draft && <section className="rounded-xl border bg-card p-5"><h3 className="text-lg font-semibold">{t.draft} · v{draft.version}</h3><p className="mt-3">{w.recipient}: {draft.recipient}</p><p className="mt-3 font-semibold">{draft.subject_de}</p><pre lang="de" className="my-4 whitespace-pre-wrap break-words rounded-lg bg-muted p-4 font-sans text-base leading-7">{draft.body_de}</pre>
        <p className="my-4 rounded-lg border p-3 text-sm">{draft.translation || w.translationUnavailable}</p>
        {draft.attachments.length > 0 && <div className="my-4"><h4>{w.documents}</h4>{draft.attachments.map(id => typeof id === 'string' ? <a key={id} href={`/api/documents/${id}/signed-url?download=1`} className="block break-all text-sm text-primary underline">{detail?.documents.find(d => d.id === id)?.path.split('/').pop() || id}</a> : null)}</div>}
        <p className="my-3 text-sm">{t.safety} {t.never}</p><label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="mt-1" />{w.confirm}</label><div className="mt-4 flex flex-wrap gap-3"><button disabled={!confirmed || approved || closed || draft.review_status !== 'pass'} onClick={() => void run(approve)} className={buttonClass}>{approved ? w.approved : t.approve}</button><a href={`/api/drafts/${draft.id}/export`} className="rounded-lg border px-4 py-2.5 text-sm">{w.export}</a></div>
      </section>}
      {!!detail?.drafts.length && <section className="rounded-xl border bg-card p-5"><h3 className="mb-3 font-semibold">{w.history}</h3>{detail.drafts.map(item => <button key={item.id} onClick={() => { setDraft(item); setConfirmed(false); setApproved(false) }} className="mb-2 block w-full rounded-lg border p-3 text-left text-sm">v{item.version} · {item.subject_de}</button>)}</section>}
      <section><h2 className="mb-3 text-lg font-semibold">{w.cases}</h2>{loading ? <p role="status">…</p> : cases.length ? <div className="grid gap-3 sm:grid-cols-2">{cases.map(item => <button key={item.id} onClick={() => void run(() => open(item.id))} className="rounded-xl border bg-card p-4 text-left"><span className="block font-medium">{item.title}</span><span className="text-sm text-muted-foreground">{caseStatusLabel(locale, item.status)}</span></button>)}</div> : <p className="rounded-xl border border-dashed p-6">{t.empty}</p>}</section>
    </fieldset>
  </section>
}
