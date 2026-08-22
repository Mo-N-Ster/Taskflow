create table public.evaluations (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete restrict,
  member_id uuid not null references public.profiles(id) on delete restrict,
  score smallint not null check (score between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 2000),
  created_at timestamptz not null default now(),
  check (reviewer_id <> member_id)
);
create index evaluations_task_created_idx on public.evaluations(task_id, created_at desc);
create index evaluations_member_created_idx on public.evaluations(member_id, created_at desc);

create or replace function public.create_task_evaluation(evaluation_task_id uuid, evaluation_member_id uuid, evaluation_score smallint, evaluation_comment text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare checked_project_id uuid; declare created_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select project_id into checked_project_id from public.tasks where id=evaluation_task_id;
  if checked_project_id is null then raise exception 'TASK_NOT_FOUND'; end if;
  if not private.has_project_role(checked_project_id,array['owner','project_manager']) then raise exception 'ROLE_FORBIDDEN'; end if;
  if evaluation_member_id=auth.uid() then raise exception 'SELF_EVALUATION_FORBIDDEN'; end if;
  if evaluation_score not between 1 and 5 or char_length(evaluation_comment)>2000 then raise exception 'INVALID_EVALUATION'; end if;
  if not exists(select 1 from public.task_assignees where task_id=evaluation_task_id and user_id=evaluation_member_id) then raise exception 'MEMBER_NOT_ASSIGNED'; end if;
  insert into public.evaluations(task_id,reviewer_id,member_id,score,comment)
  values(evaluation_task_id,auth.uid(),evaluation_member_id,evaluation_score,trim(evaluation_comment)) returning id into created_id;
  insert into public.activity_events(project_id,actor_id,event_type,payload)
  values(checked_project_id,auth.uid(),'evaluation.created',jsonb_build_object('task_id',evaluation_task_id,'evaluation_id',created_id,'member_id',evaluation_member_id));
  insert into public.notifications(user_id,project_id,task_id,event_type) values(evaluation_member_id,checked_project_id,evaluation_task_id,'evaluation.created');
  return created_id;
end; $$;

alter table public.evaluations enable row level security;
create policy evaluations_select_authorized on public.evaluations for select to authenticated using (
  member_id=auth.uid() or exists(select 1 from public.tasks where id=task_id and private.has_project_role(project_id,array['owner','project_manager']))
);
grant select on public.evaluations to authenticated;
revoke all on public.evaluations from anon;
revoke all on function public.create_task_evaluation(uuid,uuid,smallint,text) from public,anon;
grant execute on function public.create_task_evaluation(uuid,uuid,smallint,text) to authenticated;
comment on table public.evaluations is 'Évaluations humaines immuables, visibles par l’évalué et les responsables autorisés.';
