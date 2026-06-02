-- =====================================================================
-- my-crm — Supabase schema (Monday.com-style management app)
-- Run this whole file in Supabase → SQL Editor.
-- Hierarchy: workspace (department) -> board (table) -> group -> item (row)
-- with user-defined columns and flexible cell values.
-- =====================================================================

-- ---------- Tables ----------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  org_role    text not null default 'member',  -- 'admin' | 'member'
  created_at  timestamptz not null default now()
);

create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#0073ea',
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  role          text not null default 'editor',  -- 'admin' | 'editor' | 'viewer'
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create table if not exists public.boards (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  name          text not null,
  position      int not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.groups (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  name        text not null,
  color       text not null default '#579bfc',
  position    int not null default 0
);

create table if not exists public.columns (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  name        text not null,
  type        text not null default 'text', -- text|number|status|date|person|checkbox
  settings    jsonb not null default '{}'::jsonb,
  position    int not null default 0
);

create table if not exists public.items (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references public.boards(id) on delete cascade,
  group_id    uuid not null references public.groups(id) on delete cascade,
  name        text not null default '',
  position    int not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.cell_values (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.items(id) on delete cascade,
  column_id   uuid not null references public.columns(id) on delete cascade,
  value       jsonb,
  unique (item_id, column_id)
);

-- ---------- Helper functions (SECURITY DEFINER avoids RLS recursion) --

create or replace function public.is_org_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and org_role = 'admin');
$$;

create or replace function public.is_member(ws uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from workspace_members m
                where m.workspace_id = ws and m.user_id = auth.uid());
$$;

create or replace function public.member_role(ws uuid)
returns text language sql security definer stable set search_path = public as $$
  select role from workspace_members
  where workspace_id = ws and user_id = auth.uid() limit 1;
$$;

create or replace function public.can_view_board(b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from boards bd
    where bd.id = b and (is_member(bd.workspace_id) or is_org_admin()));
$$;

create or replace function public.can_edit_board(b uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from boards bd
    where bd.id = b and (is_org_admin() or member_role(bd.workspace_id) in ('admin','editor')));
$$;

create or replace function public.item_board(i uuid)
returns uuid language sql security definer stable set search_path = public as $$
  select board_id from items where id = i;
$$;

-- ---------- Trigger: create profile on signup (first user = admin) ----

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare admin_count int;
begin
  select count(*) into admin_count from public.profiles where org_role = 'admin';
  insert into public.profiles (id, email, full_name, org_role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    case when admin_count = 0 then 'admin' else 'member' end
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Trigger: workspace creator becomes workspace admin --------

create or replace function public.handle_new_workspace()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is not null then
    insert into public.workspace_members (workspace_id, user_id, role)
    values (new.id, new.created_by, 'admin')
    on conflict (workspace_id, user_id) do nothing;
  end if;
  return new;
end; $$;

drop trigger if exists on_workspace_created on public.workspaces;
create trigger on_workspace_created
  after insert on public.workspaces
  for each row execute function public.handle_new_workspace();

-- ---------- Enable RLS ------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.workspaces        enable row level security;
alter table public.workspace_members enable row level security;
alter table public.boards            enable row level security;
alter table public.groups            enable row level security;
alter table public.columns           enable row level security;
alter table public.items             enable row level security;
alter table public.cell_values       enable row level security;

-- ---------- Policies: profiles ----------------------------------------

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all to authenticated using (is_org_admin()) with check (is_org_admin());

-- ---------- Policies: workspaces --------------------------------------

drop policy if exists ws_select on public.workspaces;
create policy ws_select on public.workspaces
  for select to authenticated using (is_member(id) or is_org_admin());

drop policy if exists ws_insert on public.workspaces;
create policy ws_insert on public.workspaces
  for insert to authenticated with check (is_org_admin() and created_by = auth.uid());

drop policy if exists ws_modify on public.workspaces;
create policy ws_modify on public.workspaces
  for update to authenticated using (is_org_admin() or member_role(id) = 'admin');

drop policy if exists ws_delete on public.workspaces;
create policy ws_delete on public.workspaces
  for delete to authenticated using (is_org_admin() or member_role(id) = 'admin');

-- ---------- Policies: workspace_members -------------------------------

drop policy if exists wm_select on public.workspace_members;
create policy wm_select on public.workspace_members
  for select to authenticated using (is_member(workspace_id) or is_org_admin());

drop policy if exists wm_modify on public.workspace_members;
create policy wm_modify on public.workspace_members
  for all to authenticated
  using (is_org_admin() or member_role(workspace_id) = 'admin')
  with check (is_org_admin() or member_role(workspace_id) = 'admin');

-- ---------- Policies: boards ------------------------------------------

drop policy if exists boards_select on public.boards;
create policy boards_select on public.boards
  for select to authenticated using (is_member(workspace_id) or is_org_admin());

drop policy if exists boards_modify on public.boards;
create policy boards_modify on public.boards
  for all to authenticated
  using (is_org_admin() or member_role(workspace_id) in ('admin','editor'))
  with check (is_org_admin() or member_role(workspace_id) in ('admin','editor'));

-- ---------- Policies: groups / columns / items (scoped by board) ------

drop policy if exists groups_select on public.groups;
create policy groups_select on public.groups
  for select to authenticated using (can_view_board(board_id));
drop policy if exists groups_modify on public.groups;
create policy groups_modify on public.groups
  for all to authenticated using (can_edit_board(board_id)) with check (can_edit_board(board_id));

drop policy if exists columns_select on public.columns;
create policy columns_select on public.columns
  for select to authenticated using (can_view_board(board_id));
drop policy if exists columns_modify on public.columns;
create policy columns_modify on public.columns
  for all to authenticated using (can_edit_board(board_id)) with check (can_edit_board(board_id));

drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select to authenticated using (can_view_board(board_id));
drop policy if exists items_modify on public.items;
create policy items_modify on public.items
  for all to authenticated using (can_edit_board(board_id)) with check (can_edit_board(board_id));

-- ---------- Policies: cell_values (scoped by item's board) ------------

drop policy if exists cells_select on public.cell_values;
create policy cells_select on public.cell_values
  for select to authenticated using (can_view_board(item_board(item_id)));
drop policy if exists cells_modify on public.cell_values;
create policy cells_modify on public.cell_values
  for all to authenticated
  using (can_edit_board(item_board(item_id)))
  with check (can_edit_board(item_board(item_id)));

-- =====================================================================
-- Done. First user to sign up automatically becomes org admin.
-- =====================================================================
