begin;
select plan(19);

insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
('00000000-0000-0000-0000-000000000011','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j3-owner@example.test','x',now(),'{}','{"display_name":"J3 Owner"}',now(),now()),
('00000000-0000-0000-0000-000000000012','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j3-manager@example.test','x',now(),'{}','{"display_name":"J3 Manager"}',now(),now()),
('00000000-0000-0000-0000-000000000013','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j3-member@example.test','x',now(),'{}','{"display_name":"J3 Member"}',now(),now()),
('00000000-0000-0000-0000-000000000014','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j3-observer@example.test','x',now(),'{}','{"display_name":"J3 Observer"}',now(),now()),
('00000000-0000-0000-0000-000000000015','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j3-outsider@example.test','x',now(),'{}','{"display_name":"J3 Outsider"}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
select set_config('request.jwt.claim.role','authenticated',true);
insert into public.projects (id,owner_id,name) values ('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000011','Jalon 3');
insert into public.project_members (project_id,user_id,role) values
('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000012','project_manager'),
('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000013','member'),
('30000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000014','observer');

insert into public.project_invitations (project_id,email,role,token_hash,invited_by,expires_at)
values ('30000000-0000-0000-0000-000000000001','j3-outsider@example.test','member',repeat('a',64),'00000000-0000-0000-0000-000000000011',now()+interval '7 days');
select is((select count(*) from public.project_invitations),1::bigint,'REQ-011: owner creates an expiring invitation');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
select throws_ok($$insert into public.project_invitations (project_id,email,role,token_hash,invited_by,expires_at) values ('30000000-0000-0000-0000-000000000001','other@example.test','member',repeat('b',64),'00000000-0000-0000-0000-000000000012',now()+interval '7 days')$$,'42501',null,'SEC-06: manager cannot invite');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000015',true);
select set_config('request.jwt.claim.email','j3-outsider@example.test',true);
select is(public.accept_project_invitation(repeat('a',64)),'30000000-0000-0000-0000-000000000001'::uuid,'REQ-011: matching authenticated user accepts invitation');
select is((select role from public.project_members where project_id='30000000-0000-0000-0000-000000000001' and user_id='00000000-0000-0000-0000-000000000015'),'member','REQ-011: acceptance creates requested membership');
select is(public.accept_project_invitation(repeat('a',64)),'30000000-0000-0000-0000-000000000001'::uuid,'SEC-19: repeated acceptance is idempotent');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
insert into public.tasks (id,project_id,title,description,priority,due_date,created_by) values ('40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Tâche sécurisée','Vertical slice','high',current_date+7,'00000000-0000-0000-0000-000000000011');
select is((select status from public.tasks where id='40000000-0000-0000-0000-000000000001'),'todo','REQ-020: owner creates a persistent task');
insert into public.task_assignees values ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000013',now());
select is((select count(*) from public.task_assignees where task_id='40000000-0000-0000-0000-000000000001'),1::bigint,'REQ-021: owner assigns a project member');
select throws_ok($$insert into public.task_assignees values ('40000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000014',now())$$,'P0001','ASSIGNEE_NOT_PROJECT_MEMBER','REQ-021: assignment rejects read-only observers');
select is((select count(*) from public.activity_events where event_type='task.created'),1::bigint,'REQ-022: task creation is journaled');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000013',true);
update public.tasks set status='in_progress' where id='40000000-0000-0000-0000-000000000001';
select is((select status from public.tasks where id='40000000-0000-0000-0000-000000000001'),'in_progress','REQ-022: assigned member changes status');
select throws_ok($$update public.tasks set title='Interdit' where id='40000000-0000-0000-0000-000000000001'$$,'P0001','ROLE_FORBIDDEN','SEC-06: member cannot edit protected task fields');
select is((select count(*) from public.activity_events where event_type='task.status_changed'),1::bigint,'REQ-022: status change is journaled');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000014',true);
select is((select count(*) from public.tasks where id='40000000-0000-0000-0000-000000000001'),1::bigint,'REQ-012: observer reads tasks');
update public.tasks set status='done' where id='40000000-0000-0000-0000-000000000001';
reset role;
select is((select status from public.tasks where id='40000000-0000-0000-0000-000000000001'),'in_progress','REQ-012: observer cannot mutate tasks');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000012',true);
insert into public.tasks (id,project_id,title,created_by) values ('40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Tâche manager','00000000-0000-0000-0000-000000000012');
select is((select count(*) from public.tasks),2::bigint,'REQ-020: project manager creates tasks');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000015',true);
select is((select count(*) from public.tasks),2::bigint,'REQ-011: accepted member reads project tasks');
update public.tasks set status='done' where id='40000000-0000-0000-0000-000000000002';
reset role;
select is((select status from public.tasks where id='40000000-0000-0000-0000-000000000002'),'todo','SEC-06: unassigned member cannot update a task');

reset role;
insert into public.project_invitations (project_id,email,role,token_hash,invited_by,created_at,expires_at) values ('30000000-0000-0000-0000-000000000001','j3-outsider@example.test','member',repeat('c',64),'00000000-0000-0000-0000-000000000011',now()-interval '2 days',now()-interval '1 day');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000015',true);
select set_config('request.jwt.claim.email','expired@example.test',true);
select throws_ok($$select public.accept_project_invitation(repeat('c',64))$$,'P0001','INVITATION_EXPIRED','SEC-19: expired invitation is rejected');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000011',true);
select is((select round(100.0*count(*) filter(where status='done')/count(*)) from public.tasks),0::numeric,'REQ-024: progress derives consistently from done tasks');
select * from finish();
rollback;
