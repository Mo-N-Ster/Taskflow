create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 100),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_dates_are_coherent check (
    start_date is null or end_date is null or start_date <= end_date
  )
);

create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  role text not null check (role in ('owner', 'project_manager', 'member', 'observer')),
  joined_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index project_members_user_id_idx on public.project_members (user_id);
create index projects_owner_id_idx on public.projects (owner_id);

create or replace function private.is_project_member(
  checked_project_id uuid,
  checked_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = checked_project_id
      and user_id = checked_user_id
  );
$$;

create or replace function private.has_project_role(
  checked_project_id uuid,
  allowed_roles text[],
  checked_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = checked_project_id
      and user_id = checked_user_id
      and role = any (allowed_roles)
  );
$$;

create or replace function private.can_read_profile(
  checked_user_id uuid,
  viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select checked_user_id = viewer_id
    or exists (
      select 1
      from public.project_members viewer_membership
      join public.project_members checked_membership
        on checked_membership.project_id = viewer_membership.project_id
      where viewer_membership.user_id = viewer_id
        and checked_membership.user_id = checked_user_id
    );
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_display_name text;
begin
  requested_display_name := trim(coalesce(new.raw_user_meta_data ->> 'display_name', ''));

  if requested_display_name = '' then
    requested_display_name := split_part(coalesce(new.email, 'Utilisateur'), '@', 1);
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, left(requested_display_name, 100));

  return new;
end;
$$;

create or replace function private.add_project_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.project_members (project_id, user_id, role)
  values (new.id, new.owner_id, 'owner');

  return new;
end;
$$;

create or replace function private.protect_project_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id <> old.owner_id then
    raise exception 'PROJECT_OWNER_TRANSFER_REQUIRED';
  end if;

  return new;
end;
$$;

create or replace function private.protect_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (
    select 1
    from public.projects
    where id = old.project_id
      and owner_id = old.user_id
  ) and (
    tg_op = 'DELETE'
    or new.project_id <> old.project_id
    or new.user_id <> old.user_id
    or new.role <> 'owner'
  ) then
    raise exception 'PROJECT_OWNER_MEMBERSHIP_REQUIRED';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function private.enforce_owner_role_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role = 'owner' and not exists (
    select 1
    from public.projects
    where id = new.project_id
      and owner_id = new.user_id
  ) then
    raise exception 'PROJECT_OWNER_ROLE_RESERVED';
  end if;

  return new;
end;
$$;

create or replace function private.enforce_project_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null
    and auth.uid() <> old.owner_id
    and (
      new.name is distinct from old.name
      or new.visibility is distinct from old.visibility
      or new.owner_id is distinct from old.owner_id
    )
  then
    raise exception 'ROLE_FORBIDDEN';
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

create trigger auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create trigger project_created_add_owner
after insert on public.projects
for each row execute function private.add_project_owner_membership();

create trigger project_owner_is_immutable
before update of owner_id on public.projects
for each row execute function private.protect_project_owner();

create trigger project_update_permissions_are_enforced
before update on public.projects
for each row execute function private.enforce_project_update_permissions();

create trigger project_owner_membership_is_required
before update or delete on public.project_members
for each row execute function private.protect_owner_membership();

create trigger project_owner_role_is_consistent
before insert or update on public.project_members
for each row execute function private.enforce_owner_role_consistency();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;

create policy profiles_select_authorized
on public.profiles
for select
to authenticated
using (private.can_read_profile(id));

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy projects_select_members
on public.projects
for select
to authenticated
using (private.is_project_member(id));

create policy projects_insert_owner
on public.projects
for insert
to authenticated
with check (owner_id = auth.uid());

create policy projects_update_managers
on public.projects
for update
to authenticated
using (private.has_project_role(id, array['owner', 'project_manager']))
with check (private.has_project_role(id, array['owner', 'project_manager']));

create policy projects_delete_owner
on public.projects
for delete
to authenticated
using (private.has_project_role(id, array['owner']));

create policy project_members_select_members
on public.project_members
for select
to authenticated
using (private.is_project_member(project_id));

create policy project_members_insert_owner
on public.project_members
for insert
to authenticated
with check (private.has_project_role(project_id, array['owner']));

create policy project_members_update_owner
on public.project_members
for update
to authenticated
using (private.has_project_role(project_id, array['owner']))
with check (private.has_project_role(project_id, array['owner']));

create policy project_members_delete_owner_or_self
on public.project_members
for delete
to authenticated
using (
  private.has_project_role(project_id, array['owner'])
  or user_id = auth.uid()
);

grant usage on schema public to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.project_members to authenticated;

revoke all on public.profiles, public.projects, public.project_members from anon;

comment on table public.profiles is 'Profil applicatif minimal lié à Supabase Auth.';
comment on table public.projects is 'Projet isolé par membership ; la visibilité publique est persistée mais non exposée anonymement au Jalon 2.';
comment on table public.project_members is 'Appartenance et rôle d’un utilisateur dans un projet.';
