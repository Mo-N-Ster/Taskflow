begin;

select plan(18);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner-a@example.test',
    'synthetic-not-a-real-password',
    now(),
    '{}',
    '{"display_name":"Owner A"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner-b@example.test',
    'synthetic-not-a-real-password',
    now(),
    '{}',
    '{"display_name":"Owner B"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'observer@example.test',
    'synthetic-not-a-real-password',
    now(),
    '{}',
    '{"display_name":"Observer"}',
    now(),
    now()
  );

select is(
  (select count(*) from public.profiles where id in (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
  )),
  3::bigint,
  'REQ-002: a profile is created for every auth user'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

insert into public.projects (id, owner_id, name, visibility)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Projet A',
  'private'
);

select is(
  (select count(*) from public.projects),
  1::bigint,
  'REQ-010: an authenticated user can create and read their project'
);

select is(
  (select role from public.project_members where project_id = '10000000-0000-0000-0000-000000000001'),
  'owner',
  'REQ-010: project creation creates the owner membership'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

insert into public.projects (id, owner_id, name, visibility)
values (
  '20000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002',
  'Projet B',
  'private'
);

select is(
  (select count(*) from public.projects where id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'SEC-04: owner B cannot read project A'
);

select is(
  (select count(*) from public.project_members where project_id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'SEC-04: owner B cannot read memberships from project A'
);

select is(
  (select count(*) from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  0::bigint,
  'SEC-04: owner B cannot read an unrelated profile'
);

select throws_ok(
  $$
    insert into public.project_members (project_id, user_id, role)
    values (
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      'member'
    )
  $$,
  '42501',
  null,
  'SEC-06: an outsider cannot add themselves to a project'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

insert into public.project_members (project_id, user_id, role)
values (
  '10000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000003',
  'observer'
);

select is(
  (select count(*) from public.project_members where project_id = '10000000-0000-0000-0000-000000000001'),
  2::bigint,
  'REQ-011: an owner can add a project member with a role'
);

select throws_ok(
  $$
    update public.project_members
    set role = 'owner'
    where project_id = '10000000-0000-0000-0000-000000000001'
      and user_id = '00000000-0000-0000-0000-000000000003'
  $$,
  'P0001',
  'PROJECT_OWNER_ROLE_RESERVED',
  'SEC-06: the owner role cannot be assigned without ownership transfer'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);

select is(
  (select count(*) from public.projects where id = '10000000-0000-0000-0000-000000000001'),
  1::bigint,
  'REQ-012: an observer can read their project'
);

select is(
  (select count(*) from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  1::bigint,
  'REQ-002: members of the same project can read each other profiles'
);

update public.projects
set name = 'Modification interdite'
where id = '10000000-0000-0000-0000-000000000001';

reset role;

select is(
  (select name from public.projects where id = '10000000-0000-0000-0000-000000000001'),
  'Projet A',
  'REQ-012: an observer cannot update a project'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

select throws_ok(
  $$
    delete from public.project_members
    where project_id = '10000000-0000-0000-0000-000000000001'
      and user_id = '00000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'PROJECT_OWNER_MEMBERSHIP_REQUIRED',
  'REQ-013: an owner cannot leave without transferring ownership'
);

select throws_ok(
  $$
    update public.projects
    set owner_id = '00000000-0000-0000-0000-000000000003'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'PROJECT_OWNER_TRANSFER_REQUIRED',
  'REQ-013: ownership cannot be changed without a transfer workflow'
);

update public.project_members
set role = 'project_manager'
where project_id = '10000000-0000-0000-0000-000000000001'
  and user_id = '00000000-0000-0000-0000-000000000003';

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);

update public.projects
set description = 'Mise à jour opérationnelle'
where id = '10000000-0000-0000-0000-000000000001';

select is(
  (select description from public.projects where id = '10000000-0000-0000-0000-000000000001'),
  'Mise à jour opérationnelle',
  'REQ-010: a project manager can update project operational fields'
);

select throws_ok(
  $$
    update public.projects
    set visibility = 'public'
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  'P0001',
  'ROLE_FORBIDDEN',
  'SEC-06: a project manager cannot change project visibility'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

delete from public.project_members
where project_id = '10000000-0000-0000-0000-000000000001'
  and user_id = '00000000-0000-0000-0000-000000000003';

select is(
  (select count(*) from public.project_members where user_id = '00000000-0000-0000-0000-000000000003'),
  0::bigint,
  'REQ-013: an owner can revoke a non-owner membership'
);

select is(
  (select count(*) from public.projects where id = '20000000-0000-0000-0000-000000000002'),
  0::bigint,
  'SEC-04: owner A cannot read project B'
);

select * from finish();

rollback;
