-- Create API schema and roles
create schema if not exists api;

-- Roles
create role anon nologin;
create role web_anon nologin;
create role authenticator noinherit login password 'postgres';
grant anon to authenticator;

-- Tables
create table if not exists api.people (
  id serial primary key,
  name text not null,
  age int
);

create table if not exists api.tasks (
  id serial primary key,
  title text not null,
  done boolean default false,
  owner_id int references api.people(id)
);

-- Basic RLS
alter table api.people enable row level security;
alter table api.tasks enable row level security;

create policy anon_select_people on api.people for select to anon using (true);
create policy anon_select_tasks on api.tasks for select to anon using (true);

-- Grant anon usage
grant usage on schema api to anon;
grant select, insert, update, delete on all tables in schema api to anon;
grant usage, select on all sequences in schema api to anon;

-- Permissive RLS for writes in dev
create policy anon_insert_people on api.people for insert to anon with check (true);
create policy anon_update_people on api.people for update to anon using (true) with check (true);
create policy anon_delete_people on api.people for delete to anon using (true);

create policy anon_insert_tasks on api.tasks for insert to anon with check (true);
create policy anon_update_tasks on api.tasks for update to anon using (true) with check (true);
create policy anon_delete_tasks on api.tasks for delete to anon using (true);

-- RPC example
create or replace function api.add_them(a int, b int)
returns int language sql stable as $$
  select a + b;
$$;

comment on table api.people is 'People directory';
comment on column api.people.name is 'Full name';
comment on table api.tasks is 'Tasks';
comment on function api.add_them is 'Adds two numbers';
