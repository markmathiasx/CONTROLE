create extension if not exists pgcrypto;

create table if not exists public.workspace_snapshots (
  workspace_id text primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists workspace_snapshots_updated_at_idx
  on public.workspace_snapshots (updated_at desc);
