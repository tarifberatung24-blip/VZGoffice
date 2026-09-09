import { NextResponse } from 'next/server'
import { addCaseMessage } from '../../../../../lib/repositories/case-detail'
import { locales } from '../../../../../lib/locales'
import type { Locale } from '../../../../../lib/supabase/database'
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) { const { id } = await params; const body = await request.json().catch(() => null) as { locale?: unknown; content?: unknown } | null; const locale = locales.includes(body?.locale as Locale) ? body?.locale as Locale : 'bg'; const result = await addCaseMessage(id, { role:'user', locale, content: typeof body?.content === 'string' ? body.content : '' }); return NextResponse.json(result, { status:'error' in result ? (result.error === 'Unauthorized' ? 401 : 400) : 201 }) }
