create table public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null check (email = lower(trim(email)) and char_length(email) between 3 and 320),
  role text not null check (role in ('project_manager', 'member', 'observer')),
  token_hash text not null unique check (char_length(token_hash) = 64),
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitation_lifecycle_is_valid check (
    expires_at > created_at and not (accepted_at is not null and revoked_at is not null)
  )
);

create unique index project_invitations_active_email_idx
on public.project_invitations (project_id, email)
where accepted_at is null and revoked_at is null;

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'in_review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date date,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_id_idx on public.tasks (project_id, created_at desc);

create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index task_assignees_user_id_idx on public.task_assignees (user_id);

create table public.activity_events (
  id bigint generated always as identity primary key,
  project_id uuid not null references public.projects (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (char_length(event_type) between 1 and 80),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now()
);

create index activity_events_project_created_idx on public.activity_events (project_id, created_at desc);

create or replace function private.is_task_assignee(
  checked_task_id uuid,
  checked_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.task_assignees
    where task_id = checked_task_id and user_id = checked_user_id
  );
$$;

create or replace function private.enforce_task_update_permissions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then return new; end if;

  if private.has_project_role(old.project_id, array['owner', 'project_manager']) then
    return new;
  end if;

  if private.has_project_role(old.project_id, array['member'])
    and private.is_task_assignee(old.id)
    and new.project_id = old.project_id
    and new.title = old.title
    and new.description = old.description
    and new.priority = old.priority
    and new.due_date is not distinct from old.due_date
    and new.created_by = old.created_by
  then
    return new;
  end if;

  raise exception 'ROLE_FORBIDDEN';
end;
$$;

create or replace function private.enforce_assignee_membership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare checked_project_id uuid;
begin
  select project_id into checked_project_id from public.tasks where id = new.task_id;
  if not private.has_project_role(checked_project_id, array['owner', 'project_manager', 'member'], new.user_id) then
    raise exception 'ASSIGNEE_NOT_PROJECT_MEMBER';
  end if;
  return new;
end;
$$;

create or replace function private.log_task_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.activity_events (project_id, actor_id, event_type, payload)
    values (new.project_id, auth.uid(), 'task.created', jsonb_build_object('task_id', new.id));
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    insert into public.activity_events (project_id, actor_id, event_type, payload)
    values (new.project_id, auth.uid(), 'task.status_changed', jsonb_build_object('task_id', new.id, 'from', old.status, 'to', new.status));
  end if;
  return new;
end;
$$;

create or replace function public.accept_project_invitation(invitation_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare invitation public.project_invitations%rowtype;
declare current_email text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select lower(email) into current_email from auth.users where id = auth.uid();

  select * into invitation
  from public.project_invitations
  where token_hash = invitation_token_hash
  for update;

  if invitation.id is null then raise exception 'INVITATION_NOT_FOUND'; end if;
  if invitation.accepted_at is not null then raise exception 'INVITATION_ALREADY_ACCEPTED'; end if;
  if invitation.revoked_at is not null then raise exception 'INVITATION_REVOKED'; end if;
  if invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  if invitation.email <> current_email then raise exception 'INVITATION_EMAIL_MISMATCH'; end if;

  insert into public.project_members (project_id, user_id, role)
  values (invitation.project_id, auth.uid(), invitation.role)
  on conflict (project_id, user_id) do nothing;

  update public.project_invitations set accepted_at = now() where id = invitation.id;
  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (invitation.project_id, auth.uid(), 'member.joined', jsonb_build_object('role', invitation.role));
  return invitation.project_id;
end;
$$;

create or replace function public.create_project_task(
  task_id uuid,
  task_project_id uuid,
  task_title text,
  task_description text,
  task_priority text,
  task_due_date date,
  task_assignee_ids uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.has_project_role(task_project_id, array['owner', 'project_manager']) then
    raise exception 'ROLE_FORBIDDEN';
  end if;

  insert into public.tasks (id, project_id, title, description, priority, due_date, created_by)
  values (task_id, task_project_id, task_title, task_description, task_priority, task_due_date, auth.uid());

  insert into public.task_assignees (task_id, user_id)
  select task_id, user_id from unnest(task_assignee_ids) as user_id;

  return task_id;
end;
$$;

create trigger tasks_set_updated_at before update on public.tasks
for each row execute function private.set_updated_at();
create trigger task_updates_are_authorized before update on public.tasks
for each row execute function private.enforce_task_update_permissions();
create trigger task_assignee_is_project_member before insert or update on public.task_assignees
for each row execute function private.enforce_assignee_membership();
create trigger tasks_log_activity after insert or update on public.tasks
for each row execute function private.log_task_activity();

alter table public.project_invitations enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.activity_events enable row level security;

create policy invitations_select_owner on public.project_invitations for select to authenticated
using (private.has_project_role(project_id, array['owner']));
create policy invitations_insert_owner on public.project_invitations for insert to authenticated
with check (invited_by = auth.uid() and private.has_project_role(project_id, array['owner']));
create policy invitations_update_owner on public.project_invitations for update to authenticated
using (private.has_project_role(project_id, array['owner']))
with check (private.has_project_role(project_id, array['owner']));
create policy invitations_delete_owner on public.project_invitations for delete to authenticated
using (private.has_project_role(project_id, array['owner']));

create policy tasks_select_members on public.tasks for select to authenticated
using (private.is_project_member(project_id));
create policy tasks_insert_managers on public.tasks for insert to authenticated
with check (created_by = auth.uid() and private.has_project_role(project_id, array['owner', 'project_manager']));
create policy tasks_update_authorized on public.tasks for update to authenticated
using (private.has_project_role(project_id, array['owner', 'project_manager']) or (private.has_project_role(project_id, array['member']) and private.is_task_assignee(id)))
with check (private.has_project_role(project_id, array['owner', 'project_manager']) or (private.has_project_role(project_id, array['member']) and private.is_task_assignee(id)));
create policy tasks_delete_managers on public.tasks for delete to authenticated
using (private.has_project_role(project_id, array['owner', 'project_manager']));

create policy task_assignees_select_members on public.task_assignees for select to authenticated
using (exists (select 1 from public.tasks where id = task_id and private.is_project_member(project_id)));
create policy task_assignees_insert_managers on public.task_assignees for insert to authenticated
with check (exists (select 1 from public.tasks where id = task_id and private.has_project_role(project_id, array['owner', 'project_manager'])));
create policy task_assignees_delete_managers on public.task_assignees for delete to authenticated
using (exists (select 1 from public.tasks where id = task_id and private.has_project_role(project_id, array['owner', 'project_manager'])));

create policy activity_events_select_members on public.activity_events for select to authenticated
using (private.is_project_member(project_id));

grant select, insert, update, delete on public.project_invitations to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, delete on public.task_assignees to authenticated;
grant select on public.activity_events to authenticated;
grant execute on function public.accept_project_invitation(text) to authenticated;
grant execute on function public.create_project_task(uuid, uuid, text, text, text, date, uuid[]) to authenticated;
revoke all on public.project_invitations, public.tasks, public.task_assignees, public.activity_events from anon;

comment on table public.project_invitations is 'Invitations email à usage unique et expiration contrôlée.';
comment on table public.tasks is 'Tâches persistantes du Jalon 3, isolées par projet.';
comment on table public.task_assignees is 'Affectations limitées aux membres du projet de la tâche.';
comment on table public.activity_events is 'Journal fonctionnel minimal, alimenté côté base.';
