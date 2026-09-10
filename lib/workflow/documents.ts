import { createHash, randomUUID } from 'node:crypto'
import { createAdminClient } from '../supabase/admin'
import { getAuthenticatedUser } from '../supabase/auth'
import { matchesDocumentType } from './validation'
import { writeAuditEvent } from '../supabase/audit'

const BUCKET = 'source-documents'
const MAX_BYTES = 4 * 1024 * 1024
const MIME = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const safeName = (name: string) => name.normalize('NFKC').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document'

export async function uploadOwnedDocument(caseId: string, file: File) {
  const { user } = await getAuthenticatedUser(); if (!user) return { error: 'Unauthorized' as const }
  const admin = createAdminClient(); if (!admin) return { error: 'Supabase is not configured' as const }
  if (!MIME.has(file.type)) return { error: 'Unsupported document type' as const }
  if (file.size < 1 || file.size > MAX_BYTES) return { error: 'Document must be between 1 byte and 4 MB' as const }
  const { data: ownedCase } = await admin.from('cases').select('id, status').eq('id', caseId).eq('owner_id', user.id).maybeSingle(); if (!ownedCase) return { error: 'Case not found' as const }
  if (['ARCHIVED', 'CLOSED'].includes(ownedCase.status)) return { error: 'Case is archived' }
  const documentId = randomUUID(); const path = `${user.id}/${caseId}/${documentId}-${safeName(file.name)}`; const bytes = Buffer.from(await file.arrayBuffer()); const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (!matchesDocumentType(bytes, file.type)) return { error: 'File content does not match its type' }
  const uploaded = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false }); if (uploaded.error) return { error: uploaded.error.message }
  const inserted = await admin.from('source_documents').insert({ id: documentId, owner_id: user.id, case_id: caseId, path, mime_type: file.type as 'application/pdf' | 'image/jpeg' | 'image/png', bytes: file.size, sha256, status: 'UPLOADED' }).select('*').single()
  if (inserted.error) { await admin.storage.from(BUCKET).remove([path]); return { error: inserted.error.message } }
  const auditError = await writeAuditEvent(admin, user.id, caseId, 'document_uploaded', { document_id: documentId, mime: file.type, size_bytes: file.size })
  if (auditError) { await admin.from('source_documents').delete().eq('id', documentId).eq('owner_id', user.id); await admin.storage.from(BUCKET).remove([path]); return { error: auditError } }
  return { document: inserted.data, manualReviewRequired: true }
}

export async function signedOwnedDocumentUrl(documentId: string) {
  const { user } = await getAuthenticatedUser(); if (!user) return { error: 'Unauthorized' as const }
  const admin = createAdminClient(); if (!admin) return { error: 'Supabase is not configured' as const }
  const { data: document } = await admin.from('source_documents').select('id, path, case_id').eq('id', documentId).eq('owner_id', user.id).maybeSingle(); if (!document) return { error: 'Document not found' as const }
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(document.path, 300); if (error) return { error: error.message }
  return { url: data.signedUrl, expiresIn: 300 }
}

export async function listOwnedDocuments(caseId: string) {
  const { user } = await getAuthenticatedUser(); if (!user) return { error: 'Unauthorized' as const }
  const admin = createAdminClient(); if (!admin) return { error: 'Supabase is not configured' as const }
  const { data, error } = await admin.from('source_documents').select('id, case_id, path, mime:mime_type, size_bytes:bytes, status, created_at').eq('case_id', caseId).eq('owner_id', user.id).order('created_at', { ascending: false })
  return error ? { error: error.message } : { documents: data ?? [] }
}
