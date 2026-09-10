import { NextResponse } from 'next/server'
import { uploadOwnedDocument } from '../../../../../lib/workflow/documents'
import { isUuid } from '../../../../../lib/workflow/validation'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!isUuid(id)) return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 })
  if (Number(request.headers.get('content-length')) > 4 * 1024 * 1024 + 65536) return NextResponse.json({ error: 'Maximum upload size is 4 MB' }, { status: 413 })
  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'File is required' }, { status: 400 })
  const result = await uploadOwnedDocument(id, file)
  return NextResponse.json(result, { status: 'error' in result ? result.error === 'Unauthorized' ? 401 : 400 : 201 })
}
