# Repository audit — 2026-09-10

Source baseline: `dcf8a59`. Candidate branch: `fix/kintex-integration-readiness`.
This is a code audit, not an assertion about the live database or deployment.

| Finding | Change |
| --- | --- |
| Home navigation had no destinations; fake upload/clarify/draft state | Replaced with shared navigation and authenticated persisted workflow |
| Frontend disconnected from dashboard/detail | Added reopen/edit entry points and real document/draft collections |
| SQL uses mime_type/bytes, code wrote mime/size_bytes | Correct writes and SELECT aliases, regression checks |
| Case insert supplied status and other ungranted columns | Use the baseline's permitted columns and DB default status |
| Archive wrote CLOSED, not accepted by baseline | Use ARCHIVED and map legacy statuses for display |
| Profile upsert could update an ungranted id column | Separate insert/update with duplicate-insert recovery |
| Login/callback could overwrite name/preferences | Preserve existing profile; only explicit settings update changes fields |
| Refreshed cookies not passed to Server Components | Refresh both request and response cookies via Next proxy |
| Backslash redirect could leave origin | Strict local-path validation with regressions |
| Busy state stuck after network failure | Timeouts, catch/finally, retry UI and real error boundary |
| Stale document/fact/draft/approval state after case switch | Clear state and load persisted detail on open |
| Unknown required fact names blocked manual drafting | Explicit recipient, subject and request inputs |
| Fake foreign translation echoed German | Null translation in manual mode; historical fake translations hidden |
| No real model call | Optional opt-in Groq adapter with mocked contract tests |
| Unvalidated evidence/page values could throw | Bounded runtime validation |
| Attachments not verified against case | Owner+case check before privileged generation |
| Version races and repeat approval could fail | Unique-conflict version retry; idempotent approval |
| Document download link returned JSON | Explicit signed redirect with no-store and no-referrer |
| Claimed 10 MB multipart uploads exceed host limit | Enforce 4 MiB in UI/server and verify file magic bytes |
| Settings form discarded server errors | Success/error/pending feedback |
| Missing protection for local env variants | Ignore .env.* except the example; no keys committed |
| Minimal existing tests missed these issues | Regression, mocked workflow/provider tests and local HTTP smoke |

## Verification boundaries

- Unit/mocked tests do not contact Supabase or Groq.
- Static schema checks compare the repository migration, not the live DB.
- The deployment checker deliberately fails when credentials are missing.
- A production build and public-route checks do not prove Auth/RLS/storage
  integration, multilingual model accuracy or production readiness.
- No remote migrations, production deployment, shared login or main-platform
  changes were performed.

Remaining work is explicitly listed in [integration.md](integration.md).

## Executed checks

- 17 Node tests passed (including existing test-file suites, regression cases,
  mocked ownership/version/approval behavior, and mocked Groq responses).
- Route-file smoke, TypeScript and production build passed.
- Local HTTP smoke passed: 24 locale pages plus invalid-locale, missing-config
  health, invalid workflow ID and cross-origin-write checks.
- Read-only deployment check could not run: no local application credentials.
- Supabase connector returned reauthentication required. Live schema/RLS/storage
  and real authenticated end-to-end behavior therefore remain unverified.
