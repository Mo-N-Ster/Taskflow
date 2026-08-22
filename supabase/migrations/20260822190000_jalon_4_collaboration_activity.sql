create table public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete restrict,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index comments_task_created_idx on public.comments(task_id, created_at);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 1 and 80),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications(user_id, created_at desc) where read_at is null;

create or replace function public.add_task_comment(comment_task_id uuid, comment_body text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare checked_project_id uuid;
declare created_comment_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(trim(comment_body)) not between 1 and 5000 then raise exception 'INVALID_COMMENT'; end if;
  select project_id into checked_project_id from public.tasks where id = comment_task_id;
  if checked_project_id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not private.has_project_role(checked_project_id, array['owner','project_manager','member']) then raise exception 'ROLE_FORBIDDEN'; end if;

  insert into public.comments(task_id, author_id, body)
  values (comment_task_id, auth.uid(), trim(comment_body)) returning id into created_comment_id;
  insert into public.activity_events(project_id, actor_id, event_type, payload)
  values (checked_project_id, auth.uid(), 'comment.created', jsonb_build_object('task_id', comment_task_id, 'comment_id', created_comment_id));
  insert into public.notifications(user_id, project_id, task_id, event_type)
  select member.user_id, checked_project_id, comment_task_id, 'comment.created'
  from public.project_members member
  where member.project_id = checked_project_id and member.user_id <> auth.uid();
  return created_comment_id;
end;
$$;

create or replace function public.mark_notification_read(notification_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.notifications set read_at = coalesce(read_at, now()) where id = notification_id and user_id = auth.uid();
  if not found then raise exception 'NOTIFICATION_NOT_FOUND'; end if;
  return notification_id;
end;
$$;

alter table public.comments enable row level security;
alter table public.notifications enable row level security;
create policy comments_select_members on public.comments for select to authenticated
using (exists(select 1 from public.tasks where id=task_id and private.is_project_member(project_id)));
create policy notifications_select_own on public.notifications for select to authenticated using (user_id=auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select on public.comments, public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant execute on function public.add_task_comment(uuid,text) to authenticated;
grant execute on function public.mark_notification_read(bigint) to authenticated;
revoke all on public.comments, public.notifications from anon;
revoke all on function public.add_task_comment(uuid,text), public.mark_notification_read(bigint) from public, anon;
grant execute on function public.add_task_comment(uuid,text), public.mark_notification_read(bigint) to authenticated;

comment on table public.comments is 'Commentaires immuables et contextualisés d’une tâche.';
comment on table public.notifications is 'Notifications in-app privées, sans copie du contenu métier.';
