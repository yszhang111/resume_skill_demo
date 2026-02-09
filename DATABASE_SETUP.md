# Database Setup Guide (Supabase)

This file is a step-by-step setup tutorial for the project database.

## 1. Create Supabase project

1. Open Supabase dashboard.
2. Create a new project.
3. Wait until Postgres is ready.

## 2. Get required credentials

In `Project Settings -> API`, copy:

- `Project URL` -> use as `SUPABASE_URL`
- `service_role` key -> use as `SUPABASE_SERVICE_ROLE_KEY`

Note: use `service_role` key only on server side. This project uses it only in `app/api/**`.

Also prepare:

- OpenAI API key -> use as `OPENAI_API_KEY`

## 3. Create local env

Create `.env.local` in project root:

```bash
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_TIMEOUT_MS=30000
```

You can also run:

```bash
cp .env.example .env.local
```

Then replace placeholder values.

`OPENAI_API_KEY` is required in this version because all skills are LLM-driven.

## 4. Initialize DB schema

1. Open Supabase `SQL Editor`.
2. Copy all SQL from `/Users/zhangyangshuo1/resume_skill_demo/supabase.sql`.
3. Run the SQL.

Schema created:

- table `public.analyses`
  - `id uuid primary key`
  - `jd_text text`
  - `result_json jsonb`
  - `score int`
  - `created_at timestamptz`

## 5. Verify table write permissions

Since this project has no auth and all writes are server-side:

- Frontend never connects to Supabase directly.
- API routes use `SUPABASE_SERVICE_ROLE_KEY`.

No RLS setup is required for this demo because requests are not sent from browser to Supabase.

## 6. Run app and test end-to-end

```bash
pnpm install
pnpm dev
```

Then:

1. Open `http://localhost:3000`
2. Paste a JD text
3. Click `Run Skill Analysis`
4. Confirm a new record appears in `History`

## 7. Troubleshooting

- Error: `Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY`
  - Check `.env.local` exists and keys are valid.
  - Restart dev server after editing env.
- Error: `Missing OPENAI_API_KEY`
  - Check `OPENAI_API_KEY` is set in `.env.local`.
  - Check the key has available quota/model access.
- Error detail contains `OpenAI network request failed` / `fetch failed`
  - Your machine cannot reach current `OPENAI_BASE_URL`.
  - Try setting `OPENAI_BASE_URL` to a reachable OpenAI-compatible endpoint in your network.
- Error from `/api/analyze` insert:
  - Confirm `supabase.sql` has been executed.
  - Confirm table name is `analyses` in `public` schema.
- Empty history:
  - Ensure `/api/analyze` succeeded at least once.

## 8. Production safety notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` only in server environment.
- Never expose service role key in client code.
- Keep DB access inside `app/api/**` only (already enforced in this project).
