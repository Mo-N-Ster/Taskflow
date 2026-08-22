create or replace function public.accept_project_invitation(invitation_token_hash text)
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
  if invitation.email <> private.current_user_email() then raise exception 'INVITATION_EMAIL_MISMATCH'; end if;
  if invitation.revoked_at is not null then raise exception 'INVITATION_REVOKED'; end if;
  if invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;

  if invitation.accepted_at is null then
    insert into public.project_members (project_id, user_id, role)
    values (invitation.project_id, auth.uid(), invitation.role)
    on conflict (project_id, user_id) do update set role = excluded.role;
    update public.project_invitations set accepted_at = now() where id = invitation.id;
    insert into public.activity_events (project_id, actor_id, event_type, payload)
    values (invitation.project_id, auth.uid(), 'member.joined', jsonb_build_object('role', invitation.role));
  end if;

  return invitation.project_id;
end;
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
  if invitation.email <> private.current_user_email() then raise exception 'INVITATION_EMAIL_MISMATCH'; end if;
  if invitation.revoked_at is not null then raise exception 'INVITATION_REVOKED'; end if;
  if invitation.expires_at <= now() then raise exception 'INVITATION_EXPIRED'; end if;

  if invitation.accepted_at is null then
    insert into public.project_members (project_id, user_id, role)
    values (invitation.project_id, auth.uid(), invitation.role)
    on conflict (project_id, user_id) do update set role = excluded.role;
    update public.project_invitations set accepted_at = now() where id = invitation.id;
    insert into public.activity_events (project_id, actor_id, event_type, payload)
    values (invitation.project_id, auth.uid(), 'member.joined', jsonb_build_object('role', invitation.role));
  end if;

  return invitation.project_id;
end;
$$;

revoke all on function public.accept_project_invitation(text) from public, anon;
revoke all on function public.accept_project_invitation_by_id(uuid) from public, anon;
grant execute on function public.accept_project_invitation(text) to authenticated;
grant execute on function public.accept_project_invitation_by_id(uuid) to authenticated;
