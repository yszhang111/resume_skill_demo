# Skill-Driven Resume Analyzer Demo

A TypeScript strict, Next.js App Router demo that treats skills as executable capability units.

## Features

- Skill orchestration pipeline:
  - JD Parsing Skill (LLM-driven)
  - Skill Matching Skill (LLM-driven)
  - Gap Analysis Skill (LLM-driven)
  - Bullet Generation Skill (LLM-driven)
- API-only database access (Supabase Postgres)
- History replay and detail pages
- No auth/login flow

## Project structure

- `app/`
  - `page.tsx`
  - `history/page.tsx`
  - `history/[id]/page.tsx`
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
  - body: `{ "jdText": "..." }`
  - runs LLM-driven skill orchestrator, persists to DB, returns result
- `GET /api/history?limit=20`
  - returns recent analysis list
- `GET /api/history/:id`
  - returns full stored analysis result

## Validation rule from prompt

If `lib/skills` is removed, analysis flow fails (required by design).

## LLM behavior

- `OPENAI_API_KEY` is required. Without it, `/api/analyze` fails.
- All 4 core skills call OpenAI and return structured JSON.
- If your network cannot access `api.openai.com`, set `OPENAI_BASE_URL` to a reachable OpenAI-compatible endpoint.
