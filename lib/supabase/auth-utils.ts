export function safeNextPath(value: string | null, fallback = '/bg') {
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value) || value.includes('://')) return fallback
  try {
    const parsed = new URL(value, 'https://kintex.invalid')
    if (parsed.origin !== 'https://kintex.invalid') return fallback
  } catch { return fallback }
  return value
}
