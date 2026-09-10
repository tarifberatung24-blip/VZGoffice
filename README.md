# KintexBG AI Kommunikationsassistent

Standalone multilingual correspondence assistant. Status: integration candidate; production acceptance still required.

UI and conversation locales: bg, de, ru, pl, sr, ro. Official correspondence: German.

Development uses feature branches and reviewed pull requests. No automatic email sending. No customer data or credentials belong in this repository.

## Run and verify

Node 24 and pnpm 11.19.0:

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
pnpm start
```

Use `.env.example` as the configuration reference; keep real values in ignored
`.env.local` or Vercel environment settings. Set both Production and Preview
deliberately; public values are embedded at build time.

- Real authenticated cases, confirmed facts, document storage, immutable draft
  versions, hash-bound approval, TXT export and six-language navigation.
- Optional Groq drafting and translation, explicitly enabled on the server.
- Without Groq: labelled manual template mode; enter German subject/request.
- No OCR, automatic sending, Gmail connection, PDF signature or shared KintexBG SSO.

See [integration and acceptance checklist](docs/integration.md) and
[audit findings](docs/repository-audit.md). A passing build is not proof that
production Auth, Storage or RLS are configured.
