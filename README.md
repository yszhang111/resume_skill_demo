# Skill-Driven Resume Analyzer Demo

A TypeScript strict, Next.js App Router demo that treats skills as executable capability units.

## Features

- Skill orchestration pipeline:
  - JD Fetch Skill (URL extraction)
  - JD Parsing Skill (bundle-driven)
  - Skill Matching Skill (bundle-driven)
  - Gap Analysis Skill (bundle-driven)
  - Bullet Generation Skill (bundle-driven)
- API-only database access (Supabase Postgres)
- History replay and detail pages
- No auth/login flow

## Project structure

- `app/`
  - `page.tsx`
  - `history/page.tsx`
  - `history/[id]/page.tsx`
  - `api/extract-jd/route.ts`
  - `api/analyze/route.ts`
  - `api/history/route.ts`
  - `api/history/[id]/route.ts`
- `lib/`
  - `llm/openai.ts`
  - `skills/`
  - `orchestrator.ts`
  - `skillTaxonomy.ts`
  - `supabase/server.ts`
  - `types.ts`
- `supabase.sql`
- `DATABASE_SETUP.md`

## Quick start

1. Install dependencies:

```bash
pnpm install
```

2. Create env file:

```bash
cp .env.example .env.local
```

3. Fill `.env.local`:

```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TIMEOUT_MS=30000
NEXT_PUBLIC_ANALYZE_TIMEOUT_MS=90000
JD_FETCH_TIMEOUT_MS=15000
```

4. Run SQL in Supabase SQL editor:

- Execute `supabase.sql`

5. Start app:

```bash
pnpm dev
```

Open `http://localhost:3000`.

## API

- `POST /api/analyze`
  - body: `{ "jdText": "...", "jdUrl": "https://..." }`
  - runs LLM-driven skill orchestrator, persists to DB, returns result
- `POST /api/extract-jd`
  - body: `{ "url": "https://..." }`
  - fetches page and extracts JD text
- `GET /api/history?limit=20`
  - returns recent analysis list
- `GET /api/history/:id`
  - returns full stored analysis result

## Validation rule from prompt

If `lib/skills` is removed, analysis flow fails (required by design).

## LLM behavior

- `OPENAI_API_KEY` is required. Without it, `/api/analyze` fails.
- `/api/analyze` uses a single OpenAI call to generate a shared analysis bundle.
- The 4 skills then consume that bundle locally (no repeated LLM round-trips).
- If your network cannot access `api.openai.com`, set `OPENAI_BASE_URL` to a reachable OpenAI-compatible endpoint.
- If browser shows timeout, increase `NEXT_PUBLIC_ANALYZE_TIMEOUT_MS` and restart dev server.
- If JD URL extraction is slow, increase `JD_FETCH_TIMEOUT_MS`.
