-- Rollback smoke test for baseline ownership and server-only boundaries.
-- Run against a non-production database or through Supabase SQL editor while developing.

begin;

insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111','authenticated','authenticated','rls-a@example.test','', now(), now(), now()),
  ('22222222-2222-4222-8222-222222222222','authenticated','authenticated','rls-b@example.test','', now(), now(), now());

insert into public.profiles(id, locale, display_name)
values
  ('11111111-1111-4111-8111-111111111111','bg','A'),
  ('22222222-2222-4222-8222-222222222222','de','B');

insert into public.cases(id, owner_id, title, intent, ui_locale, conversation_locale)
values
  ('aaaaaaaa-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','A case','reply','bg','bg'),
  ('bbbbbbbb-0000-4000-8000-000000000001','22222222-2222-4222-8222-222222222222','B case','reply','de','de');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

do $$
declare
  visible_cases integer;
  updated_profiles integer;
  blocked boolean := false;
begin
  select count(*) into visible_cases from public.cases;
  if visible_cases <> 1 then
    raise exception 'expected user A to see 1 case, got %', visible_cases;
  end if;

  update public.profiles set display_name = 'A OK'
  where id = '11111111-1111-4111-8111-111111111111';
  get diagnostics updated_profiles = row_count;
  if updated_profiles <> 1 then
    raise exception 'expected user A to update own profile, got %', updated_profiles;
  end if;

  update public.profiles set display_name = 'B BAD'
  where id = '22222222-2222-4222-8222-222222222222';
  get diagnostics updated_profiles = row_count;
  if updated_profiles <> 0 then
    raise exception 'expected user A not to update B profile, got %', updated_profiles;
  end if;

  begin
    insert into public.case_messages(owner_id, case_id, role, locale, content)
    values ('11111111-1111-4111-8111-111111111111','aaaaaaaa-0000-4000-8000-000000000001','user','bg','blocked');
  exception
    when insufficient_privilege then
      blocked := true;
  end;

  if blocked is not true then
    raise exception 'expected authenticated client insert into case_messages to be blocked';
  end if;
end $$;

reset role;
rollback;

select 'PASS: RLS owner isolation and server-only write block verified' as result;
