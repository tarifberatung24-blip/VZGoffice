import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../supabase/database'

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_BYTES = 4 * 1024 * 1024

export interface SourceDocumentRepository {
  upload(input: { caseId: string; file: File }): Promise<{ path: string | null; error: string | null }>
}

export function createSourceDocumentRepository(_client: SupabaseClient<Database>, _userId: string): SourceDocumentRepository {
  return {
    async upload({ caseId, file }) {
      if (!ALLOWED_MIME.has(file.type)) return { path: null, error: 'Unsupported document type' }
      if (file.size < 1 || file.size > MAX_BYTES) return { path: null, error: 'Document must be between 1 byte and 4 MB' }
      // All uploads go through the ownership-checked server, which also writes
      // document metadata and audit records. Browser Storage writes are denied.
      try {
        const form = new FormData(); form.append('file', file)
        const response = await fetch(`/api/cases/${encodeURIComponent(caseId)}/documents`, { method: 'POST', body: form, signal: AbortSignal.timeout(30000) })
        const result = await response.json()
        if (!response.ok) return { path: null, error: result.error || 'Upload failed' }
        return { path: result.document.path, error: null }
      } catch { return { path: null, error: 'Upload failed. Please retry.' } }
    },
  }
}
