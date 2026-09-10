import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicConfig } from './lib/supabase/config'

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin')
    if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== request.nextUrl.origin)) {
      return NextResponse.json({ error: 'Cross-origin writes are not allowed' }, { status: 403 })
    }
  }
  let response = NextResponse.next({ request })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  const settings = publicConfig(url, key)
  if (!settings) return response
  try {
    const supabase = createServerClient(settings.url, settings.key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        response.headers.set('Cache-Control', 'private, no-store')
      },
    } })
    await supabase.auth.getUser()
  } catch {
    // Middleware must not take the entire site down when Supabase is not configured correctly.
    return response
  }
  return response
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
