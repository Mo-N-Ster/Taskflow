begin;
select plan(16);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j5-owner@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000052','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j5-manager@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000053','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j5-member@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000054','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j5-other@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000055','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j5-observer@example.test','x',now(),'{}','{}',now(),now());
set local role authenticated; select set_config('request.jwt.claim.role','authenticated',true); select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000051',true);
insert into public.projects(id,owner_id,name) values('30000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000051','Jalon 5');
insert into public.project_members(project_id,user_id,role) values
('30000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000052','project_manager'),
('30000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000053','member'),
('30000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000054','member'),
('30000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000055','observer');
select public.create_project_task('40000000-0000-0000-0000-000000000051','30000000-0000-0000-0000-000000000051','Livrable','','high',null,array['00000000-0000-0000-0000-000000000053']::uuid[]);
select isnt(public.create_task_evaluation('40000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000053',5::smallint,'Excellent'),null::uuid,'REQ-030: owner evaluates assigned member');
select is((select count(*) from public.evaluations),1::bigint,'owner sees evaluation');
select is((select score from public.evaluations),5::smallint,'score is persisted');
select is((select count(*) from public.activity_events where event_type='evaluation.created'),1::bigint,'evaluation is audited');
reset role; select is((select count(*) from public.notifications where user_id='00000000-0000-0000-0000-000000000053'),1::bigint,'evaluated member is notified'); set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000052',true);
select isnt(public.create_task_evaluation('40000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000053',4::smallint,'Solide'),null::uuid,'manager can add historical evaluation');
select is((select count(*) from public.evaluations),2::bigint,'manager sees full history');
select throws_ok($$select public.create_task_evaluation('40000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000054',4::smallint,'Non assigné')$$,'P0001','MEMBER_NOT_ASSIGNED','unassigned member cannot be evaluated');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000053',true);
select is((select count(*) from public.evaluations),2::bigint,'REQ-031: evaluated member sees history');
select throws_ok($$select public.create_task_evaluation('40000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000054',3::smallint,'Interdit')$$,'P0001','ROLE_FORBIDDEN','member cannot evaluate');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000054',true);
select is((select count(*) from public.evaluations),0::bigint,'other member cannot see evaluation');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000055',true);
select is((select count(*) from public.evaluations),0::bigint,'observer cannot see evaluation');
select throws_ok($$insert into public.evaluations(task_id,reviewer_id,member_id,score) values('40000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000055','00000000-0000-0000-0000-000000000053',5)$$,'42501',null,'direct insert is denied');
select throws_ok($$update public.evaluations set score=1$$,'42501',null,'evaluation history is immutable');
select throws_ok($$delete from public.evaluations$$,'42501',null,'evaluation deletion is denied');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000051',true);
select throws_ok($$select public.create_task_evaluation('40000000-0000-0000-0000-000000000051','00000000-0000-0000-0000-000000000053',6::smallint,'Invalide')$$,'P0001','INVALID_EVALUATION','score outside range is rejected');
select * from finish(); rollback;
