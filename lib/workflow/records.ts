import { createAdminClient } from '../supabase/admin'
import { getAuthenticatedUser } from '../supabase/auth'
import { DeterministicDraftGenerator, DeterministicSafetyReviewer } from './deterministic'
import type { ConfirmedFact } from './interfaces'
import type { Locale } from '../supabase/database'
import { groqConfig } from './provider'
import { generateGroqDraft } from './groq'

async function context(caseId: string) {
  const { user } = await getAuthenticatedUser()
  if (!user) return { error: 'Unauthorized' as const }
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase is not configured' as const }
  const { data: owned, error } = await admin.from('cases').select('*').eq('id', caseId).eq('owner_id', user.id).maybeSingle()
  if (error) return { error: 'Unable to load case' }
  if (!owned) return { error: 'Case not found' as const }
  return { user, admin, owned }
}
export async function confirmFacts(caseId: string, facts: ConfirmedFact[], documentId?: string) {
  const ctx = await context(caseId)
  if ('error' in ctx) return ctx
  if (['ARCHIVED', 'CLOSED'].includes(ctx.owned.status)) return { error: 'Case is archived' }
  if (documentId) {
    const document = await ctx.admin.from('source_documents').select('id').eq('id', documentId).eq('case_id', caseId).eq('owner_id', ctx.user.id).maybeSingle()
    if (document.error || !document.data) return { error: 'Document not found in this case' }
  }
  const valid = facts.filter(f => f.key.trim() && f.value.trim()).map(f => ({
    owner_id: ctx.user.id, case_id: caseId, document_id: documentId ?? null,
    page_no: f.page_no ?? null, key: f.key.trim().slice(0, 120), value: f.value.trim().slice(0, 4000),
    evidence: f.evidence?.trim().slice(0, 4000) || null, source_type: 'user' as const,
    confidence: 1, critical: true, confirmed_at: new Date().toISOString(),
  }))
  if (!valid.length) return { error: 'At least one confirmed fact is required' as const }
  const { data, error } = await ctx.admin.from('extracted_facts').insert(valid).select('*')
  return error ? { error: 'Unable to save confirmed facts' } : { facts: data }
}
export async function generateDraft(caseId: string, outputLocale: Locale, documentIds: string[]) {
  const ctx = await context(caseId)
  if ('error' in ctx) return ctx
  if (['ARCHIVED', 'CLOSED'].includes(ctx.owned.status)) return { error: 'Case is archived' }
  if (documentIds.length) {
    const documents = await ctx.admin.from('source_documents').select('id').eq('case_id', caseId).eq('owner_id', ctx.user.id).in('id', documentIds)
    if (documents.error || documents.data?.length !== documentIds.length) return { error: 'Attachments must belong to this case' }
  }
  const { data: facts, error } = await ctx.admin.from('extracted_facts').select('key, value, evidence, page_no').eq('case_id', caseId).eq('owner_id', ctx.user.id).not('confirmed_at', 'is', null).order('created_at', { ascending: true }).order('id', { ascending: true })
  if (error) return { error: 'Unable to load confirmed facts' }
  const input = { caseRecord: ctx.owned, facts: facts ?? [], outputLocale, documentIds }
  let draft = await new DeterministicDraftGenerator().generate(input)
  const provider = groqConfig()
  if (process.env.KINTEX_AI_ENABLED === 'true' && !provider) return { error: 'AI provider is not configured' }
  if (provider) {
    try { draft = await generateGroqDraft(input, draft, provider) }
    catch { return { error: 'AI generation failed or quota was reached. No draft was saved. Try again later.' } }
  }
  const review = await new DeterministicSafetyReviewer().review({ draft, facts: facts ?? [] })
  if (review.status === 'block') return { missing: review.missing, draft: null }
  // The database's (case_id, version) unique constraint arbitrates concurrent writers.
  for (let attempt = 0; attempt < 3; attempt++) {
    const previous = await ctx.admin.from('correspondence_drafts').select('version').eq('case_id', caseId).eq('owner_id', ctx.user.id).order('version', { ascending: false }).limit(1)
    if (previous.error) return { error: 'Unable to load draft versions' }
    const version = (previous.data?.[0]?.version ?? 0) + 1
    const inserted = await ctx.admin.from('correspondence_drafts').insert({
      owner_id: ctx.user.id, case_id: caseId, version, subject_de: draft.subject_de, body_de: draft.body_de,
      recipient: draft.recipient || null, attachments: draft.attachments, translation: draft.translation,
      translation_locale: draft.translation_locale, model: provider?.model ?? 'manual-template-v2', prompt_version: provider ? 'groq-confirmed-v1' : 'manual-v2',
      input_facts_hash: draft.inputFactsHash, content_hash: draft.contentHash, review_status: 'pass',
    }).select('*').single()
    if (inserted.error?.code === '23505') continue
    return inserted.error ? { error: 'Unable to save draft' } : { draft: inserted.data, missing: [] }
  }
  return { error: 'Another draft is being saved. Please retry.' }
}
export async function approveDraft(draftId: string, approvedHash: string) {
  const { user } = await getAuthenticatedUser()
  if (!user) return { error: 'Unauthorized' as const }
  const admin = createAdminClient()
  if (!admin) return { error: 'Supabase is not configured' as const }
  const { data: draft } = await admin.from('correspondence_drafts').select('id, owner_id, case_id, content_hash, review_status').eq('id', draftId).eq('owner_id', user.id).maybeSingle()
  if (!draft) return { error: 'Draft not found' as const }
  if (draft.review_status !== 'pass') return { error: 'Draft has not passed review' }
  if (draft.content_hash !== approvedHash) return { error: 'Draft content changed; approval rejected' as const }
  const owned = await admin.from('cases').select('status').eq('id', draft.case_id).eq('owner_id', user.id).maybeSingle()
  if (!owned.data || ['ARCHIVED', 'CLOSED'].includes(owned.data.status)) return { error: 'Case is archived or unavailable' }
  const result = await admin.from('approvals').insert({ draft_id: draft.id, user_id: user.id, approved_hash: approvedHash }).select('*').single()
  if (result.error?.code === '23505') {
    const existing = await admin.from('approvals').select('*').eq('draft_id', draftId).eq('user_id', user.id).eq('approved_hash', approvedHash).single()
    return existing.error ? { error: 'Unable to confirm approval' } : { approval: existing.data }
  }
  return result.error ? { error: 'Unable to save approval' } : { approval: result.data }
}
export async function listDrafts(caseId: string) {
  const ctx = await context(caseId)
  if ('error' in ctx) return ctx
  const { data, error } = await ctx.admin.from('correspondence_drafts').select('*').eq('case_id', caseId).eq('owner_id', ctx.user.id).order('version', { ascending: false })
  return error ? { error: 'Unable to load drafts' } : { drafts: data ?? [] }
}
