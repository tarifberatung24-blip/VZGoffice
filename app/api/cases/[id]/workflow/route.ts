import { NextResponse } from 'next/server'
import { confirmFacts, generateDraft } from '../../../../../lib/workflow/records'
import { isLocale } from '../../../../../lib/cases/validation'
import { isUuid, validateFacts } from '../../../../../lib/workflow/validation'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 })
  const body = await request.json().catch(() => null)
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  let result
  if (body.action === 'confirm-facts') {
    const checked = validateFacts(body.facts)
    if ('error' in checked) return NextResponse.json(checked, { status: 400 })
    if (body.documentId && !isUuid(body.documentId)) return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
    result = await confirmFacts(id, checked.facts, body.documentId || undefined)
  } else if (body.action === 'generate-draft') {
    const ids = body.documentIds ?? []
    if (!isLocale(body.outputLocale ?? 'de') || !Array.isArray(ids) || ids.length > 20 || !ids.every(isUuid)) return NextResponse.json({ error: 'Invalid draft options' }, { status: 400 })
    result = await generateDraft(id, body.outputLocale ?? 'de', [...new Set<string>(ids)])
  } else return NextResponse.json({ error: 'Unknown workflow action' }, { status: 400 })
  const status = 'error' in result ? result.error === 'Unauthorized' ? 401 : result.error === 'Supabase is not configured' ? 503 : 400 : 201
  return NextResponse.json(result, { status })
}
