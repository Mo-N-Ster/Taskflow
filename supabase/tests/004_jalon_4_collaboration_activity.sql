begin;
select plan(12);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at) values
('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j4-owner@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j4-member@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000043','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j4-observer@example.test','x',now(),'{}','{}',now(),now()),
('00000000-0000-0000-0000-000000000044','00000000-0000-0000-0000-000000000000','authenticated','authenticated','j4-outsider@example.test','x',now(),'{}','{}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000041',true);
insert into public.projects(id,owner_id,name) values('30000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000041','Jalon 4');
insert into public.project_members(project_id,user_id,role) values
('30000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000042','member'),
('30000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000043','observer');
select public.create_project_task('40000000-0000-0000-0000-000000000041','30000000-0000-0000-0000-000000000041','Discussion','','medium',null,array[]::uuid[]);
select isnt(public.add_task_comment('40000000-0000-0000-0000-000000000041','Premier commentaire'),null::uuid,'REQ-023: owner comments');
select is((select count(*) from public.comments),1::bigint,'comment is persisted once');
select is((select count(*) from public.activity_events where event_type='comment.created'),1::bigint,'comment activity is recorded');
select is((select count(*) from public.notifications),2::bigint,'other project members are notified');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000042',true);
select is((select count(*) from public.comments),1::bigint,'member reads project comments');
select is((select count(*) from public.notifications),1::bigint,'member sees only own notification');
select is(public.mark_notification_read((select id from public.notifications)),(select id from public.notifications),'member marks own notification read');
select isnt((select read_at from public.notifications),null::timestamptz,'notification has read timestamp');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000043',true);
select throws_ok($$select public.add_task_comment('40000000-0000-0000-0000-000000000041','Interdit')$$,'P0001','ROLE_FORBIDDEN','observer cannot comment');
select is((select count(*) from public.comments),1::bigint,'observer can read comments');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000044',true);
select is((select count(*) from public.comments),0::bigint,'outsider cannot read comments');
select is((select count(*) from public.notifications),0::bigint,'outsider cannot read notifications');
select * from finish();
rollback;
