-- KintexBG AI Kommunikationsassistent baseline schema.
-- Applied to Supabase project ambhlmdrfsgdbbljjsic as migration 20260909112037.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  locale text not null default 'bg' check (locale in ('bg','de','ru','pl','sr','ro')),
  display_name text check (char_length(display_name) <= 120),
  created_at timestamptz not null default now()
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  intent text not null check (intent in ('explanation','reply','complaint','application','objection','cancellation','document_request','reminder','free_email')),
  ui_locale text not null check (ui_locale in ('bg','de','ru','pl','sr','ro')),
  conversation_locale text not null check (conversation_locale in ('bg','de','ru','pl','sr','ro')),
  status text not null default 'NEW' check (status in ('NEW','IN_PROCESS','NEEDS_USER','DRAFT_READY','AWAITING_APPROVAL','APPROVED','SENT','ARCHIVED')),
  institution text check (char_length(institution) <= 200),
  deadline date,
  created_at timestamptz not null default now(),
  unique (id, owner_id)
);

create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  bytes integer not null check (bytes between 1 and 10485760),
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  status text not null default 'UPLOADED' check (status in ('UPLOADED','OCR_READY','OCR_FAILED','DELETED')),
  created_at timestamptz not null default now(),
  unique (id, case_id, owner_id),
  foreign key (case_id, owner_id) references public.cases(id, owner_id) on delete cascade,
  check (split_part(path, '/', 1) = owner_id::text),
  check (split_part(path, '/', 2) = case_id::text)
);

create table public.document_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  document_id uuid not null,
  page_no integer not null check (page_no > 0),
  text_content text,
  confidence numeric check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (document_id, page_no),
  foreign key (document_id, case_id, owner_id) references public.source_documents(id, case_id, owner_id) on delete cascade
);

create table public.case_messages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  role text not null check (role in ('user','assistant')),
  locale text not null check (locale in ('bg','de','ru','pl','sr','ro')),
  content text not null check (char_length(content) between 1 and 30000),
  created_at timestamptz not null default now(),
  foreign key (case_id, owner_id) references public.cases(id, owner_id) on delete cascade
);

create table public.extracted_facts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  document_id uuid,
  page_no integer,
  key text not null,
  value text not null,
  evidence text,
  source_type text not null check (source_type in ('document','user')),
  confidence numeric check (confidence between 0 and 1),
  critical boolean not null default false,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (case_id, owner_id) references public.cases(id, owner_id) on delete cascade,
  foreign key (document_id, case_id, owner_id) references public.source_documents(id, case_id, owner_id) on delete set null,
  check (source_type <> 'document' or (document_id is not null and page_no is not null and evidence is not null))
);

create table public.correspondence_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  version integer not null check (version > 0),
  subject_de text not null,
  body_de text not null,
  recipient text,
  attachments jsonb not null default '[]'::jsonb check (jsonb_typeof(attachments) = 'array'),
  translation_locale text check (translation_locale in ('bg','de','ru','pl','sr','ro')),
  translation text,
  model text,
  prompt_version text,
  input_facts_hash text check (input_facts_hash is null or input_facts_hash ~ '^[a-f0-9]{64}$'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  review_status text not null default 'pending' check (review_status in ('pending','pass','revise','block')),
  created_at timestamptz not null default now(),
  unique (case_id, version),
  unique (id, owner_id, content_hash),
  foreign key (case_id, owner_id) references public.cases(id, owner_id) on delete cascade
);

create or replace function public.reject_draft_update()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'Draft versions are immutable; insert a new version';
end;
$$;

create trigger correspondence_drafts_reject_update
before update on public.correspondence_drafts
for each row execute function public.reject_draft_update();

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid not null,
  approved_hash text not null check (approved_hash ~ '^[a-f0-9]{64}$'),
  approved_at timestamptz not null default now(),
  unique (draft_id, approved_hash),
  foreign key (draft_id, user_id, approved_hash) references public.correspondence_drafts(id, owner_id, content_hash) on delete cascade
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  case_id uuid not null,
  type text not null check (type in ('reminder','human_review')),
  due_at timestamptz not null,
  status text not null default 'open' check (status in ('open','done','cancelled')),
  idempotency_key uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  foreign key (case_id, owner_id) references public.cases(id, owner_id) on delete cascade
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (case_id, actor_id) references public.cases(id, owner_id) on delete cascade
);

create table public.usage_counters (
  user_id uuid not null references auth.users(id) on delete cascade,
  period date not null,
  ai_cases integer not null default 0 check (ai_cases >= 0),
  tokens integer not null default 0 check (tokens >= 0),
  primary key (user_id, period)
);

create index source_documents_owner_id_idx on public.source_documents(owner_id);
create index document_pages_owner_id_idx on public.document_pages(owner_id);
create index case_messages_owner_id_idx on public.case_messages(owner_id);
create index extracted_facts_owner_id_idx on public.extracted_facts(owner_id);
create index approvals_user_id_idx on public.approvals(user_id);
create index tasks_owner_id_idx on public.tasks(owner_id);
create index audit_events_actor_id_idx on public.audit_events(actor_id);
create index document_pages_document_idx on public.document_pages(document_id);
create index case_messages_case_idx on public.case_messages(case_id);
create index extracted_facts_case_idx on public.extracted_facts(case_id);
create index extracted_facts_document_idx on public.extracted_facts(document_id);
create index correspondence_drafts_case_idx on public.correspondence_drafts(case_id);
create index approvals_draft_idx on public.approvals(draft_id);
create index tasks_case_idx on public.tasks(case_id);
create index tasks_due_idx on public.tasks(due_at);
create index audit_events_case_idx on public.audit_events(case_id);

alter table public.profiles enable row level security;
alter table public.cases enable row level security;
alter table public.source_documents enable row level security;
alter table public.document_pages enable row level security;
alter table public.case_messages enable row level security;
alter table public.extracted_facts enable row level security;
alter table public.correspondence_drafts enable row level security;
alter table public.approvals enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_events enable row level security;
alter table public.usage_counters enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select on public.profiles, public.cases, public.source_documents, public.document_pages, public.case_messages, public.extracted_facts, public.correspondence_drafts, public.tasks, public.audit_events, public.usage_counters to authenticated;
grant insert (id, locale, display_name) on public.profiles to authenticated;
grant update (locale, display_name) on public.profiles to authenticated;
grant insert (owner_id, title, intent, ui_locale, conversation_locale) on public.cases to authenticated;
grant update (title, intent, ui_locale, conversation_locale) on public.cases to authenticated;
grant all on all tables in schema public to service_role;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy cases_select_own on public.cases for select to authenticated using ((select auth.uid()) = owner_id);
create policy cases_insert_own on public.cases for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy cases_update_own on public.cases for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy source_documents_select_own on public.source_documents for select to authenticated using ((select auth.uid()) = owner_id);
create policy document_pages_select_own on public.document_pages for select to authenticated using ((select auth.uid()) = owner_id);
create policy case_messages_select_own on public.case_messages for select to authenticated using ((select auth.uid()) = owner_id);
create policy extracted_facts_select_own on public.extracted_facts for select to authenticated using ((select auth.uid()) = owner_id);
create policy correspondence_drafts_select_own on public.correspondence_drafts for select to authenticated using ((select auth.uid()) = owner_id);
create policy tasks_select_own on public.tasks for select to authenticated using ((select auth.uid()) = owner_id);
create policy audit_events_select_own on public.audit_events for select to authenticated using ((select auth.uid()) = actor_id);
create policy usage_counters_select_own on public.usage_counters for select to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('source-documents', 'source-documents', false, 10485760, array['application/pdf','image/jpeg','image/png']),
  ('generated-documents', 'generated-documents', false, 10485760, array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy kintex_documents_read_own on storage.objects
for select to authenticated
using (
  bucket_id in ('source-documents', 'generated-documents')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.cases c
    where c.owner_id = (select auth.uid())
      and c.id::text = (storage.foldername(name))[2]
  )
);
