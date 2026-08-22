begin;
select plan(17);

insert into auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flow-owner@example.test','x',now(),'{}','{"display_name":"Flow Owner"}',now(),now()),
('00000000-0000-0000-0000-000000000022','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flow-manager@example.test','x',now(),'{}','{"display_name":"Flow Manager"}',now(),now()),
('00000000-0000-0000-0000-000000000023','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flow-member@example.test','x',now(),'{}','{"display_name":"Flow Member"}',now(),now()),
('00000000-0000-0000-0000-000000000024','00000000-0000-0000-0000-000000000000','authenticated','authenticated','flow-outsider@example.test','x',now(),'{}','{"display_name":"Flow Outsider"}',now(),now());

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000021',true);
select set_config('request.jwt.claim.role','authenticated',true);
insert into public.projects (id,owner_id,name) values ('30000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000021','Notifications');
insert into public.project_members (project_id,user_id,role) values ('30000000-0000-0000-0000-000000000021','00000000-0000-0000-0000-000000000022','project_manager');

select isnt(public.create_or_refresh_project_invitation('30000000-0000-0000-0000-000000000021','flow-member@example.test','member',repeat('d',64),now()+interval '7 days'),null::uuid,'REQ-011: owner creates dashboard invitation');
select is((select count(*) from public.project_invitations where project_id='30000000-0000-0000-0000-000000000021'),1::bigint,'invitation is persisted once');
select is(public.create_or_refresh_project_invitation('30000000-0000-0000-0000-000000000021','FLOW-MEMBER@example.test','project_manager',repeat('e',64),now()+interval '7 days'),(select id from public.project_invitations where project_id='30000000-0000-0000-0000-000000000021'),'duplicate invitation refreshes the existing row');
select is((select token_hash from public.project_invitations where project_id='30000000-0000-0000-0000-000000000021'),repeat('e',64),'refreshed invitation replaces old token');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000023',true);
select is((select count(*) from public.list_my_pending_invitations()),1::bigint,'invited account sees dashboard notification');
select is(public.decline_project_invitation((select id from public.list_my_pending_invitations())),'30000000-0000-0000-0000-000000000021'::uuid,'invited account can decline');
select is((select count(*) from public.list_my_pending_invitations()),0::bigint,'declined invitation disappears from dashboard');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000021',true);
select public.create_or_refresh_project_invitation('30000000-0000-0000-0000-000000000021','flow-member@example.test','member',repeat('f',64),now()+interval '7 days');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000023',true);
select is(public.accept_project_invitation_by_id((select id from public.list_my_pending_invitations())),'30000000-0000-0000-0000-000000000021'::uuid,'dashboard invitation can be accepted');
select is((select role from public.project_members where project_id='30000000-0000-0000-0000-000000000021' and user_id='00000000-0000-0000-0000-000000000023'),'member','acceptance creates membership');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000021',true);
select public.create_project_task('40000000-0000-0000-0000-000000000021','30000000-0000-0000-0000-000000000021','À réassigner','', 'medium',null,array['00000000-0000-0000-0000-000000000023']::uuid[]);
select is((select count(*) from public.task_assignees where task_id='40000000-0000-0000-0000-000000000021'),1::bigint,'member starts assigned');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000023',true);
select is(public.leave_project('30000000-0000-0000-0000-000000000021'),'30000000-0000-0000-0000-000000000021'::uuid,'member can leave project');
reset role;
select is((select count(*) from public.project_members where project_id='30000000-0000-0000-0000-000000000021' and user_id='00000000-0000-0000-0000-000000000023'),0::bigint,'departure removes membership');
select is((select count(*) from public.task_assignees where task_id='40000000-0000-0000-0000-000000000021'),0::bigint,'departure automatically frees assignments');

set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000021',true);
select public.set_task_assignees('40000000-0000-0000-0000-000000000021',array['00000000-0000-0000-0000-000000000022']::uuid[]);
select is((select user_id from public.task_assignees where task_id='40000000-0000-0000-0000-000000000021'),'00000000-0000-0000-0000-000000000022'::uuid,'owner reassigns freed task');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000024',true);
select throws_ok($$select public.set_task_assignees('40000000-0000-0000-0000-000000000021',array[]::uuid[])$$,'P0001','ROLE_FORBIDDEN','outsider cannot reassign task');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000021',true);
select throws_ok($$select public.leave_project('30000000-0000-0000-0000-000000000021')$$,'P0001','PROJECT_OWNER_TRANSFER_REQUIRED','owner cannot abandon project');
select is((select count(*) from public.activity_events where project_id='30000000-0000-0000-0000-000000000021' and event_type='member.left'),1::bigint,'member departure is journaled');

select * from finish();
rollback;
