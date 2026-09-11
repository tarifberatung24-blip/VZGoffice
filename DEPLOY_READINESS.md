# Coolify deployment readiness

## Target

Target runtime: Hetzner Cloud + Coolify. Production deployment is not performed by this document. Vercel is not used.

## Required runtime environment variable names

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
GROQ_API_KEY
AI_DAILY_LIMIT
AI_MONTHLY_LIMIT
BUILD_SHA
```

Secret values must be entered directly by the owner in Coolify. No values belong in GitHub, this file, chat, or committed `.env` files. The previously shared Groq key is compromised and must be revoked; use a newly generated key.

## Build/start commands

```text
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

## Health check

```text
GET /api/health
```

The endpoint does not call Groq. It reports `status`, `build_sha`, Supabase connectivity, provider configuration, and `ai_reachable: not_checked` without returning secrets.

## Staging blockers

The application has no confirmed public-ready legal text for Impressum, Datenschutzerklärung, AGB, or the AI disclaimer in the current repository. A private staging deployment may be used for technical smoke tests with a visible NOT_READY legal status. Public launch remains blocked until the owner supplies and approves the applicable legal text.

## Verified locally before deployment

TypeScript, tests, ESLint, production build, and `git diff --check` must be run on the final commit. Real Coolify deployment, TLS/domain, rollback, and external smoke tests remain pending until the Hetzner account and server exist.
