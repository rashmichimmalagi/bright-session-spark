
-- ============ TABLES ============

create type public.session_status as enum ('upcoming','live','closed');

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  date date not null,
  time time not null,
  venue text not null,
  hosted_by text,
  resource_person text,
  description text,
  volunteer_count integer not null default 0,
  volunteer_names text[] not null default '{}',
  max_capacity integer not null default 100,
  status public.session_status not null default 'upcoming',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  marked_by uuid references auth.users(id) on delete set null,
  marked_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index attendance_session_idx on public.attendance(session_id);
create index attendance_student_idx on public.attendance(student_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_name text,
  deadline_at timestamptz,
  allow_resubmit boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index assignments_session_idx on public.assignments(session_id);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  file_url text,
  file_name text,
  links text[] not null default '{}',
  reviewed boolean not null default false,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);
create index submissions_assignment_idx on public.submissions(assignment_id);
create index submissions_student_idx on public.submissions(student_id);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  title text not null,
  file_url text,
  file_name text,
  link_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index resources_session_idx on public.resources(session_id);

create table public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id)
);
create index summaries_session_idx on public.session_summaries(session_id);

create table public.qr_tokens_used (
  token text primary key,
  session_id uuid references public.sessions(id) on delete cascade,
  used_at timestamptz not null default now()
);

-- ============ updated_at triggers ============
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger sessions_touch before update on public.sessions
  for each row execute function public.touch_updated_at();
create trigger submissions_touch before update on public.submissions
  for each row execute function public.touch_updated_at();
create trigger summaries_touch before update on public.session_summaries
  for each row execute function public.touch_updated_at();

-- ============ RLS ============
alter table public.sessions enable row level security;
alter table public.attendance enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.resources enable row level security;
alter table public.session_summaries enable row level security;
alter table public.qr_tokens_used enable row level security;

-- sessions: everyone signed in can read, only admins write
create policy sessions_select_all on public.sessions for select to authenticated using (true);
create policy sessions_admin_insert on public.sessions for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy sessions_admin_update on public.sessions for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy sessions_admin_delete on public.sessions for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- attendance: everyone signed in can read; admins insert/update/delete; students can insert their own
create policy attendance_select_all on public.attendance for select to authenticated using (true);
create policy attendance_admin_write on public.attendance for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy attendance_self_insert on public.attendance for insert to authenticated with check (auth.uid() = student_id);
create policy attendance_admin_update on public.attendance for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy attendance_admin_delete on public.attendance for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- assignments: read all; admin write
create policy assignments_select_all on public.assignments for select to authenticated using (true);
create policy assignments_admin_insert on public.assignments for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy assignments_admin_update on public.assignments for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy assignments_admin_delete on public.assignments for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- submissions: students see own; admins see all; students write own
create policy submissions_self_select on public.submissions for select to authenticated using (auth.uid() = student_id);
create policy submissions_admin_select on public.submissions for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy submissions_self_insert on public.submissions for insert to authenticated with check (auth.uid() = student_id);
create policy submissions_self_update on public.submissions for update to authenticated using (auth.uid() = student_id);
create policy submissions_admin_update on public.submissions for update to authenticated using (public.has_role(auth.uid(),'admin'));

-- resources: read all; admin write
create policy resources_select_all on public.resources for select to authenticated using (true);
create policy resources_admin_insert on public.resources for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy resources_admin_update on public.resources for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy resources_admin_delete on public.resources for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- summaries: students write own + see own; admins see all
create policy summaries_self_select on public.session_summaries for select to authenticated using (auth.uid() = student_id);
create policy summaries_admin_select on public.session_summaries for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy summaries_self_insert on public.session_summaries for insert to authenticated with check (auth.uid() = student_id);
create policy summaries_self_update on public.session_summaries for update to authenticated using (auth.uid() = student_id);

-- qr_tokens_used: read+write for any authenticated user (anti-replay log)
create policy qr_tokens_select_all on public.qr_tokens_used for select to authenticated using (true);
create policy qr_tokens_insert_all on public.qr_tokens_used for insert to authenticated with check (true);

-- Allow students/anyone authenticated to view approved profiles (for student lists)
create policy profiles_authenticated_read_approved on public.profiles for select to authenticated using (status = 'approved');

-- ============ realtime ============
alter publication supabase_realtime add table public.sessions;
alter publication supabase_realtime add table public.attendance;
alter publication supabase_realtime add table public.assignments;
alter publication supabase_realtime add table public.submissions;
alter publication supabase_realtime add table public.resources;
alter publication supabase_realtime add table public.session_summaries;
alter publication supabase_realtime add table public.profiles;

alter table public.sessions replica identity full;
alter table public.attendance replica identity full;
alter table public.assignments replica identity full;
alter table public.submissions replica identity full;
alter table public.resources replica identity full;
alter table public.session_summaries replica identity full;
alter table public.profiles replica identity full;

-- ============ STORAGE BUCKETS ============
insert into storage.buckets (id, name, public) values
  ('assignments','assignments', false),
  ('submissions','submissions', false),
  ('resources','resources', false)
on conflict (id) do nothing;

-- Storage policies
create policy "assignments_admin_all" on storage.objects for all to authenticated
  using (bucket_id = 'assignments' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'assignments' and public.has_role(auth.uid(),'admin'));
create policy "assignments_read" on storage.objects for select to authenticated
  using (bucket_id = 'assignments');

create policy "submissions_self_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "submissions_self_update" on storage.objects for update to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "submissions_self_read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "submissions_admin_read" on storage.objects for select to authenticated
  using (bucket_id = 'submissions' and public.has_role(auth.uid(),'admin'));

create policy "resources_admin_all" on storage.objects for all to authenticated
  using (bucket_id = 'resources' and public.has_role(auth.uid(),'admin'))
  with check (bucket_id = 'resources' and public.has_role(auth.uid(),'admin'));
create policy "resources_read" on storage.objects for select to authenticated
  using (bucket_id = 'resources');
