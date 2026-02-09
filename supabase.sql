create extension if not exists "pgcrypto";

create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  jd_text text not null,
  result_json jsonb not null,
  score int not null check (score >= 0 and score <= 100),
  created_at timestamptz not null default now()
);

create index if not exists analyses_created_at_idx on public.analyses (created_at desc);
create index if not exists analyses_score_idx on public.analyses (score);
