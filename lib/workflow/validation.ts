import type { ConfirmedFact } from './interfaces'

export const isUuid = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export function validateFacts(input: unknown): { facts: ConfirmedFact[] } | { error: string } {
  if (!Array.isArray(input) || input.length < 1 || input.length > 50) return { error: 'Provide between 1 and 50 facts' }
  const facts: ConfirmedFact[] = []
  const seen = new Set<string>()
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || typeof raw.key !== 'string' || typeof raw.value !== 'string') return { error: 'Invalid fact' }
    const key = raw.key.trim(), value = raw.value.trim()
    if (!key || key.length > 120 || !value || value.length > 4000 || seen.has(key)) return { error: 'Invalid or duplicate fact' }
    if (raw.evidence != null && (typeof raw.evidence !== 'string' || raw.evidence.length > 4000)) return { error: 'Invalid evidence' }
    if (raw.page_no != null && (!Number.isSafeInteger(raw.page_no) || raw.page_no < 1)) return { error: 'Invalid page number' }
    seen.add(key)
    facts.push({ key, value, evidence: raw.evidence ?? null, page_no: raw.page_no ?? null })
  }
  return { facts }
}

export function matchesDocumentType(bytes: Uint8Array, mime: string) {
  if (mime === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-'
  if (mime === 'image/png') return [137,80,78,71,13,10,26,10].every((b, i) => bytes[i] === b)
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  return false
}
