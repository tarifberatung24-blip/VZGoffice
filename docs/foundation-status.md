# Foundation Status

> Historical snapshot from 2026-09-09. The lists below are not the current
> application status. See [repository-audit.md](repository-audit.md) and
> [integration.md](integration.md) for the integration candidate and remaining gates.

## Supabase

Project: kintex-assistant-eu  
Project ref: ambhlmdrfsgdbbljjsic  
Organization: TARIFBERATER24  
Region: eu-central-1 (Frankfurt)  
PostgreSQL: 17.6.1.166

This project is separate from the existing Supabase project `supabase-sky-mountain` (`sophzmteuemggqlstebw`), which was not touched.

## Baseline Implemented

The first database baseline contains:

- User profile rows linked to Supabase Auth users.
- Case ownership and multilingual UI/conversation locale fields.
- Source document metadata with owner/case path checks.
- OCR page text storage.
- Conversation messages.
- Extracted facts with document evidence rules.
- Immutable German correspondence draft versions.
- Hash-bound approvals.
- Reminder and human-review tasks.
- Audit events.
- Usage counters.
- Private Storage buckets for source and generated documents.

RLS is enabled on every public table. Browser clients can read their own rows and can only write the small set of fields needed for profiles and case setup. Server-generated tables remain server-write only.

## Verification

Completed on 2026-09-09:

- Supabase security advisor: no lints.
- RLS smoke test: passed.
- Performance advisor: only new/unused index informational lints, expected before real traffic.

## Not Implemented Yet

- Application UI.
- Signup/login screens and production auth settings.
- Edge Functions or backend APIs.
- OCR pipeline.
- AI draft generation.
- Email sending.
- Vercel deployment.
- Provider secrets such as Groq/OpenAI keys.

Any new production registration, paid action, provider secret, or deploy target should be approved before creation.
