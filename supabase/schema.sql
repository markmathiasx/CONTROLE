create extension if not exists pgcrypto;
create extension if not exists citext;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username citext not null unique,
  display_name text not null,
  email citext not null unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id text primary key default ('ws_' || replace(gen_random_uuid()::text, '-', '')),
  slug text not null unique,
  name text not null,
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  is_personal boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  active_workspace_id text references public.workspaces(id) on delete set null,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  onboarding_completed boolean not null default false,
  local_import_decision text check (local_import_decision in ('merged', 'skipped')),
  imported_from_local_at timestamptz,
  last_local_merge_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_snapshots (
  workspace_id text primary key references public.workspaces(id) on delete cascade,
  data jsonb not null,
  version integer not null default 1,
  schema_version integer not null default 3,
  app_version text not null default '0.3.2',
  migration_origin text,
  imported_at timestamptz,
  last_synced_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists workspace_members_user_idx
  on public.workspace_members (user_id);

create index if not exists workspace_members_workspace_idx
  on public.workspace_members (workspace_id);

create index if not exists workspace_snapshots_updated_at_idx
  on public.workspace_snapshots (updated_at desc);

create or replace function public.is_workspace_member(target_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_owner(target_workspace_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_username text;
  next_display_name text;
  next_slug text;
  next_workspace_id text;
begin
  next_username := lower(trim(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))));
  next_display_name := trim(coalesce(new.raw_user_meta_data->>'display_name', next_username));
  next_slug := regexp_replace(next_username, '[^a-z0-9]+', '-', 'g');
  next_slug := trim(both '-' from next_slug) || '-' || substring(new.id::text from 1 for 8);
  next_workspace_id := 'ws_' || replace(gen_random_uuid()::text, '-', '');

  insert into public.profiles (id, username, display_name, email)
  values (new.id, next_username::citext, next_display_name, new.email::citext);

  insert into public.workspaces (id, slug, name, owner_user_id, is_personal)
  values (next_workspace_id, next_slug, next_display_name || ' • pessoal', new.id, true);

  insert into public.workspace_members (workspace_id, user_id, role)
  values (next_workspace_id, new.id, 'owner');

  insert into public.user_settings (user_id, active_workspace_id, theme, onboarding_completed)
  values (new.id, next_workspace_id, 'dark', false);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

drop trigger if exists workspaces_touch_updated_at on public.workspaces;
create trigger workspaces_touch_updated_at
  before update on public.workspaces
  for each row execute procedure public.touch_updated_at();

drop trigger if exists workspace_members_touch_updated_at on public.workspace_members;
create trigger workspace_members_touch_updated_at
  before update on public.workspace_members
  for each row execute procedure public.touch_updated_at();

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute procedure public.touch_updated_at();

drop trigger if exists workspace_snapshots_touch_updated_at on public.workspace_snapshots;
create trigger workspace_snapshots_touch_updated_at
  before update on public.workspace_snapshots
  for each row execute procedure public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.user_settings enable row level security;
alter table public.workspace_snapshots enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
  on public.workspaces
  for select
  using (public.is_workspace_member(id));

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
  on public.workspaces
  for update
  using (public.is_workspace_owner(id))
  with check (public.is_workspace_owner(id));

drop policy if exists "workspaces_insert_owner" on public.workspaces;
create policy "workspaces_insert_owner"
  on public.workspaces
  for insert
  with check (auth.uid() = owner_user_id);

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member"
  on public.workspace_members
  for select
  using (
    user_id = auth.uid()
    or public.is_workspace_owner(workspace_id)
  );

drop policy if exists "workspace_members_insert_owner" on public.workspace_members;
create policy "workspace_members_insert_owner"
  on public.workspace_members
  for insert
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_insert_self_owner" on public.workspace_members;
create policy "workspace_members_insert_self_owner"
  on public.workspace_members
  for insert
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.owner_user_id = auth.uid()
    )
  );

drop policy if exists "workspace_members_update_owner" on public.workspace_members;
create policy "workspace_members_update_owner"
  on public.workspace_members
  for update
  using (public.is_workspace_owner(workspace_id))
  with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_delete_owner" on public.workspace_members;
create policy "workspace_members_delete_owner"
  on public.workspace_members
  for delete
  using (public.is_workspace_owner(workspace_id));

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "workspace_snapshots_select_member" on public.workspace_snapshots;
create policy "workspace_snapshots_select_member"
  on public.workspace_snapshots
  for select
  using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_snapshots_insert_member" on public.workspace_snapshots;
create policy "workspace_snapshots_insert_member"
  on public.workspace_snapshots
  for insert
  with check (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_snapshots_update_member" on public.workspace_snapshots;
create policy "workspace_snapshots_update_member"
  on public.workspace_snapshots
  for update
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));
