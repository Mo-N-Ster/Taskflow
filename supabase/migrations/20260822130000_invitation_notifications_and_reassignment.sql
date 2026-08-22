create or replace function private.current_user_email()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select lower(email) from auth.users where id = auth.uid();
$$;

create or replace function public.create_or_refresh_project_invitation(
  invitation_project_id uuid,
  invitation_email text,
  invitation_role text,
  invitation_token_hash text,
  invitation_expires_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare invitation_id uuid;
declare normalized_email text := lower(trim(invitation_email));
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if not private.has_project_role(invitation_project_id, array['owner']) then raise exception 'ROLE_FORBIDDEN'; end if;
  if normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' or char_length(normalized_email) > 320 then raise exception 'INVALID_EMAIL'; end if;
  if invitation_role not in ('project_manager', 'member', 'observer') then raise exception 'INVALID_ROLE'; end if;
  if char_length(invitation_token_hash) <> 64 or invitation_expires_at <= now() then raise exception 'INVALID_INVITATION'; end if;

  insert into public.project_invitations (project_id, email, role, token_hash, invited_by, expires_at)
  values (invitation_project_id, normalized_email, invitation_role, invitation_token_hash, auth.uid(), invitation_expires_at)
  on conflict (project_id, email) where accepted_at is null and revoked_at is null
  do update set
    role = excluded.role,
    token_hash = excluded.token_hash,
    invited_by = excluded.invited_by,
    expires_at = excluded.expires_at,
    created_at = now()
  returning id into invitation_id;

  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (invitation_project_id, auth.uid(), 'member.invited', jsonb_build_object('invitation_id', invitation_id, 'role', invitation_role));
  return invitation_id;
end;
$$;

create or replace function public.list_my_pending_invitations()
returns table (id uuid, project_id uuid, project_name text, role text, expires_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select invitation.id, invitation.project_id, project.name, invitation.role, invitation.expires_at
  from public.project_invitations invitation
  join public.projects project on project.id = invitation.project_id
  where invitation.email = private.current_user_email()
    and invitation.accepted_at is null
    and invitation.revoked_at is null
    and invitation.expires_at > now()
  order by invitation.created_at desc;
$$;

create or replace function public.accept_project_invitation_by_id(invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare invitation public.project_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into invitation from public.project_invitations where id = invitation_id for update;
  if invitation.id is null then raise exception 'INVITATION_NOT_FOUND'; end if;
  if invitation.accepted_at is not null then raise exception 'INVITATION_ALREADY_ACCEPTED'; end if;
  if invitation.revoked_at is not null then raise exception 'INVITATION_REVOKED'; end if;
  if invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;
  if invitation.email <> private.current_user_email() then raise exception 'INVITATION_EMAIL_MISMATCH'; end if;

  insert into public.project_members (project_id, user_id, role)
  values (invitation.project_id, auth.uid(), invitation.role)
  on conflict (project_id, user_id) do update set role = excluded.role;
  update public.project_invitations set accepted_at = now() where id = invitation.id;
  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (invitation.project_id, auth.uid(), 'member.joined', jsonb_build_object('role', invitation.role));
  return invitation.project_id;
end;
$$;

create or replace function public.decline_project_invitation(invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare invitation public.project_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into invitation from public.project_invitations where id = invitation_id for update;
  if invitation.id is null then raise exception 'INVITATION_NOT_FOUND'; end if;
  if invitation.accepted_at is not null or invitation.revoked_at is not null or invitation.expires_at <= now() then raise exception 'INVITATION_INACTIVE'; end if;
  if invitation.email <> private.current_user_email() then raise exception 'INVITATION_EMAIL_MISMATCH'; end if;
  update public.project_invitations set revoked_at = now() where id = invitation.id;
  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (invitation.project_id, auth.uid(), 'member.invitation_declined', jsonb_build_object('invitation_id', invitation.id));
  return invitation.project_id;
end;
$$;

create or replace function public.decline_project_invitation_by_token(invitation_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare invitation public.project_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into invitation from public.project_invitations where token_hash = invitation_token_hash for update;
  if invitation.id is null then raise exception 'INVITATION_NOT_FOUND'; end if;
  if invitation.accepted_at is not null or invitation.revoked_at is not null or invitation.expires_at <= now() then raise exception 'INVITATION_INACTIVE'; end if;
  if invitation.email <> private.current_user_email() then raise exception 'INVITATION_EMAIL_MISMATCH'; end if;
  update public.project_invitations set revoked_at = now() where id = invitation.id;
  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (invitation.project_id, auth.uid(), 'member.invitation_declined', jsonb_build_object('invitation_id', invitation.id));
  return invitation.project_id;
end;
$$;

create or replace function private.cleanup_departing_member_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.task_assignees assignment
  using public.tasks task
  where assignment.task_id = task.id
    and task.project_id = old.project_id
    and assignment.user_id = old.user_id;
  return old;
end;
$$;

create or replace function private.log_departing_member()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (old.project_id, auth.uid(), case when auth.uid() = old.user_id then 'member.left' else 'member.removed' end, jsonb_build_object('user_id', old.user_id));
  return old;
end;
$$;

create trigger project_member_cleanup_assignments
before delete on public.project_members
for each row execute function private.cleanup_departing_member_assignments();

create trigger project_member_log_departure
after delete on public.project_members
for each row execute function private.log_departing_member();

create or replace function public.leave_project(leave_project_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if private.has_project_role(leave_project_id, array['owner']) then raise exception 'PROJECT_OWNER_TRANSFER_REQUIRED'; end if;
  if not private.is_project_member(leave_project_id) then raise exception 'PROJECT_ACCESS_DENIED'; end if;
  delete from public.project_members where project_id = leave_project_id and user_id = auth.uid();
  return leave_project_id;
end;
$$;

create or replace function public.set_task_assignees(reassigned_task_id uuid, reassigned_user_ids uuid[])
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare checked_project_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select project_id into checked_project_id from public.tasks where id = reassigned_task_id;
  if checked_project_id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not private.has_project_role(checked_project_id, array['owner', 'project_manager']) then raise exception 'ROLE_FORBIDDEN'; end if;

  delete from public.task_assignees where task_id = reassigned_task_id;
  insert into public.task_assignees (task_id, user_id)
  select reassigned_task_id, user_id from (select distinct unnest(reassigned_user_ids) as user_id) selected;
  insert into public.activity_events (project_id, actor_id, event_type, payload)
  values (checked_project_id, auth.uid(), 'task.assignees_changed', jsonb_build_object('task_id', reassigned_task_id, 'assignee_ids', reassigned_user_ids));
  return reassigned_task_id;
end;
$$;

revoke all on function public.create_or_refresh_project_invitation(uuid, text, text, text, timestamptz) from public, anon;
revoke all on function public.list_my_pending_invitations() from public, anon;
revoke all on function public.accept_project_invitation_by_id(uuid) from public, anon;
revoke all on function public.decline_project_invitation(uuid) from public, anon;
revoke all on function public.decline_project_invitation_by_token(text) from public, anon;
revoke all on function public.leave_project(uuid) from public, anon;
revoke all on function public.set_task_assignees(uuid, uuid[]) from public, anon;
grant execute on function public.create_or_refresh_project_invitation(uuid, text, text, text, timestamptz) to authenticated;
grant execute on function public.list_my_pending_invitations() to authenticated;
grant execute on function public.accept_project_invitation_by_id(uuid) to authenticated;
grant execute on function public.decline_project_invitation(uuid) to authenticated;
grant execute on function public.decline_project_invitation_by_token(text) to authenticated;
grant execute on function public.leave_project(uuid) to authenticated;
grant execute on function public.set_task_assignees(uuid, uuid[]) to authenticated;
