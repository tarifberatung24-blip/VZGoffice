// Pure validation shared by browser, server and deployment checks. Never log keys.
export function publicConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) return null
  try {
    const parsed = new URL(url.trim())
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') return null
    const trimmed = key.trim()
    if (!trimmed.startsWith('sb_publishable_')) {
      const payload = JSON.parse(atob(trimmed.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
      if (payload.role !== 'anon') return null
    }
    return { url: parsed.origin, key: trimmed }
  } catch { return null }
}
