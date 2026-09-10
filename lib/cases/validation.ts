import type { CaseIntent, CaseStatus, Locale } from '../supabase/database'

export const caseIntents: CaseIntent[] = ['explanation','reply','complaint','application','objection','cancellation','document_request','reminder','free_email']
export const caseStatuses: CaseStatus[] = ['NEW','UPLOADED','EXTRACTING','NEEDS_INFO','DRAFTING','NEEDS_CONFIRMATION','APPROVED','EXPORTED','SENT','WAITING_REPLY','ACTION_REQUIRED','CLOSED','FAILED_RETRYABLE','FAILED_FINAL','HUMAN_REVIEW']
export const locales: Locale[] = ['bg','de','ru','pl','sr','ro']

export function isLocale(value: unknown): value is Locale { return typeof value === 'string' && locales.includes(value as Locale) }
export function isCaseIntent(value: unknown): value is CaseIntent { return typeof value === 'string' && caseIntents.includes(value as CaseIntent) }
export function isCaseStatus(value: unknown): value is CaseStatus { return typeof value === 'string' && caseStatuses.includes(value as CaseStatus) }

export function sanitizeCaseCreate(input: Record<string, unknown>) {
  if (typeof input.title !== 'string' || input.title.trim().length < 1 || input.title.length > 200) return { error: 'Invalid title' as const }
  if (!isCaseIntent(input.intent) || !isLocale(input.ui_locale) || !isLocale(input.conversation_locale)) return { error: 'Invalid case fields' as const }
  if (input.institution != null || input.deadline != null) return { error: 'Institution and deadline are not editable in this baseline' as const }
  return { value: { title: input.title.trim(), intent: input.intent, ui_locale: input.ui_locale, conversation_locale: input.conversation_locale } }
}

export function sanitizeCaseUpdate(input: Record<string, unknown>) {
  const value: Record<string, unknown> = {}
  if ('title' in input) { if (typeof input.title !== 'string' || input.title.trim().length < 1 || input.title.length > 200) return { error: 'Invalid title' as const }; value.title = input.title.trim() }
  if ('intent' in input) { if (!isCaseIntent(input.intent)) return { error: 'Invalid intent' as const }; value.intent = input.intent }
  if ('ui_locale' in input) { if (!isLocale(input.ui_locale)) return { error: 'Invalid UI locale' as const }; value.ui_locale = input.ui_locale }
  if ('conversation_locale' in input) { if (!isLocale(input.conversation_locale)) return { error: 'Invalid conversation locale' as const }; value.conversation_locale = input.conversation_locale }
  if ('institution' in input || 'deadline' in input) return { error: 'Institution and deadline are not editable in this baseline' as const }
  return { value }
}
