# KintexBG integration candidate

## Scope

This change prepares the standalone assistant. It does not modify
`tarifberatung24-blip/finanzbg-original`, merge to main, apply remote SQL,
create accounts, send email, enable paid services or deploy production.

### Available flows

- Email signup/login/recovery via Supabase; per-user preferences.
- Create/open/update a case; private upload; manually confirm source facts.
- Manual German template, or optional Groq German draft + UI-language translation.
- Inspect previous versions, explicitly approve the exact content hash, download TXT.
- Real navigation for cases, documents, drafts, settings and help in six locales.

### Not implemented

OCR, PDF generation/signature, Gmail, n8n execution, reminders, shared login and
cross-project data transfer. Uploading a scanned document does **not** extract its
contents. Users must read it and enter confirmed fields.

## 1. Assistant configuration

Configure the **assistant** Vercel project, not the main KintexBG project:

| Variable | Value/source |
| --- | --- |
| NEXT_PUBLIC_SUPABASE_URL | https://ambhlmdrfsgdbbljjsic.supabase.co |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Public key from that same Supabase project |
| SUPABASE_SERVICE_ROLE_KEY | Server-only service role or secret key from that same project |
| NEXT_PUBLIC_SITE_URL | https://kintex-communication-assistant.vercel.app |

The ref above is recorded by this repository, **not live-verified by this audit**.
Never put a publishable key in the URL variable. Never put the service key in
a NEXT_PUBLIC variable. Rebuild after changing public variables.

Keep the two migrations already in this repository in timestamp order.
The application uses the committed baseline's `mime_type`, `bytes` and
`ARCHIVED` status. SELECT aliases preserve the UI's `mime`/`size_bytes` API.
No migration was applied during this work. If a live database differs, compare
it before changing either code or schema; do not blindly rerun a baseline.

The baseline restricts case writes to title, intent and locale fields. The API
explicitly rejects institution/deadline edits instead of silently losing them.
Case status is not a complete automated workflow state machine yet.

Run this read-only check with the assistant's configured credentials:

```sh
pnpm check:deployment
```

It checks expected project hostname, required columns and the private upload
bucket without printing secrets or customer records. It does not verify RLS or
simulate a real user. A passing response from `/api/health` only confirms the
presence/format of configuration; it is not a database availability guarantee.

## 2. Auth settings

In Supabase Auth, set the Site URL to the assistant's production origin.
Allow its `/auth/callback` URL and the exact trusted preview origins needed
for testing. Signup confirmation and password reset pass a localized internal
destination in the `next` query. Do not allow arbitrary origins or add
the unrelated main-platform database.

Verify email delivery with your configured SMTP service and actual confirmation
and recovery links. Login alone cannot verify confirmation/recovery delivery.
Sign-up/login must not erase an existing profile name or language preferences.

## 3. Optional AI

```dotenv
KINTEX_AI_ENABLED=true
GROQ_API_KEY=<server-only key>
GROQ_MODEL=openai/gpt-oss-20b
```

Use a model supporting Groq strict structured outputs. No AI requests are made
unless explicitly enabled, authenticated, supplied with the required confirmed
facts, and triggered by the user's Create Draft action.

Only the latest recipient, subject and request fields are submitted to Groq,
not source files, signed URLs, user IDs or case IDs. Those fields can still contain
personal information: review provider processing terms, user notice and consent
requirements before enabling real client use. The UI names Groq at the action flow.

The adapter has a 20-second timeout, bounded input/output, response validation,
no automatic retries and no silent fake translation fallback. Missing facts block
approval flow. Provider failures do not insert drafts. The model's statements
are **not** independently fact-checked or legally reviewed: explicit human review
remains necessary.

Configure provider spending limits and application abuse controls before a public
campaign. This change does not implement a transactional per-user AI quota or
promise zero-cost operation. Actual language quality across all six locales must
be checked with test content; mocked adapter tests are not live model evaluation.

## 4. Integration into the main platform

Use a normal navigation link initially:

```tsx
<a href={`https://kintex-communication-assistant.vercel.app/${locale === 'bg' ? 'bg' : 'de'}`}>
  Kommunikationsassistent
</a>
```

The assistant's sidebar returns to the corresponding BG/DE KintexBG page.
The assistant keeps its own sign-in and database. Users registered on the main
platform are **not automatically logged in** here. No tokens travel in URLs.
Do not embed it in an iframe or copy Supabase cookies/keys between projects.
Shared login requires a separately designed and tested identity integration.

## 5. Acceptance before merge/deployment

1. Review the feature branch diff and CI. Run the read-only deployment check.
2. Use a staging Supabase project or explicitly designated test accounts and
   synthetic documents. Do not use customer files.
3. Register accounts A and B, confirm email, log in, reset password, log out,
   and verify session refresh. Check profile preservation after repeated login.
4. As A create a case, upload a genuine PDF/JPG/PNG below 4 MiB, save recipient/
   subject/request, generate, inspect, approve, and download TXT.
5. Reload and reopen the case. Verify documents, facts and versions persist.
   Edit a fact, generate another version and verify the newer value is used.
6. Switch cases: no document IDs, facts, drafts or approval flags may leak
   into the newly selected case. Retry failed requests; buttons must recover.
7. As B attempt A's case/detail/upload/draft/approval/document endpoints.
   Confirm they reveal no A data and cannot change A rows. Also run
   `supabase/tests/baseline_rls.sql` on an appropriate test database.
8. Check malformed requests, fake file signatures, oversized files, expired
   sessions, Groq 429/timeout/invalid output, blocked drafts and repeated approval.
9. Check mobile navigation, each locale switch, document download, settings
   success/error messages and keyboard interaction in a browser.
10. Review privacy/legal notices and provider limits, then approve a deployment
    from the candidate branch. Re-run the flow against the deployment before
    adding the main-platform link or advertising production readiness.

The multipart endpoint limits files to 4 MiB, below Vercel's 4.5 MB request limit.
The database bucket can retain its 10 MiB limit for future direct signed uploads;
the current route does not claim to accept 10 MiB.

## 6. Local HTTP smoke

After building **without credentials**, run:

```sh
pnpm test:runtime
```

The harness starts/stops a local server with server credentials cleared.
This verifies public locale routes, missing-config handling, malformed IDs and
cross-origin-write rejection. It is not an authenticated end-to-end test.

## Sources consulted

- https://supabase.com/docs/guides/auth/server-side/creating-a-client
- https://supabase.com/changelog.md
- https://console.groq.com/docs/structured-outputs
- https://console.groq.com/docs/api-reference
- https://vercel.com/docs/functions/limitations
