import { NextResponse } from 'next/server'
import { signedOwnedDocumentUrl } from '../../../../../lib/workflow/documents'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const result = await signedOwnedDocumentUrl(id)
  if ('error' in result) return NextResponse.json(result, { status: result.error === 'Unauthorized' ? 401 : 404 })
  const response = new URL(request.url).searchParams.get('download') === '1'
    ? NextResponse.redirect(result.url)
    : NextResponse.json(result)
  response.headers.set('Cache-Control', 'private, no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
