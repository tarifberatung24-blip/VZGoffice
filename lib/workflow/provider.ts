import 'server-only'

export function groqConfig() {
  if (process.env.KINTEX_AI_ENABLED !== 'true') return null
  const apiKey = process.env.GROQ_API_KEY?.trim(), model = process.env.GROQ_MODEL?.trim()
  return apiKey && model ? { apiKey, model } : null
}
