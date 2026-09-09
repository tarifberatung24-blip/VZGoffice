import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CaseIntent, CaseStatus, Locale } from '../supabase/database'
import { createClient } from '../supabase/server'

export type CaseRecord = Database['public']['Tables']['cases']['Row']
export type NewCase = Pick<Database['public']['Tables']['cases']['Insert'], 'title' | 'intent' | 'ui_locale' | 'conversation_locale'> & { title: string; intent: CaseIntent; ui_locale: Locale; conversation_locale: Locale }

export interface CaseRepository {
  listMine(limit?: number): Promise<{ data: CaseRecord[] | null; error: string | null }>
  create(input: NewCase): Promise<{ data: CaseRecord | null; error: string | null }>
}

class PreviewCaseRepository implements CaseRepository {
  async listMine() { return { data: [], error: null } }
  async create() { return { data: null, error: 'Supabase is not configured' } }
}

class SupabaseCaseRepository implements CaseRepository {
  constructor(private readonly client: SupabaseClient<Database>, private readonly userId: string) {}

  async listMine(limit = 20) {
    const { data, error } = await this.client.from('cases').select('*').eq('owner_id', this.userId).order('created_at', { ascending: false }).limit(limit)
    return { data, error: error?.message ?? null }
  }

  async create(input: NewCase) {
    const { data, error } = await this.client.from('cases').insert({ ...input, owner_id: this.userId, status: 'NEW' as CaseStatus }).select('*').single()
    return { data, error: error?.message ?? null }
  }
}

export async function createCaseRepository(): Promise<{ repository: CaseRepository; userId: string | null; configured: boolean }> {
  const client = await createClient()
  if (!client) return { repository: new PreviewCaseRepository(), userId: null, configured: false }
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { repository: new PreviewCaseRepository(), userId: null, configured: true }
  return { repository: new SupabaseCaseRepository(client, user.id), userId: user.id, configured: true }
}
