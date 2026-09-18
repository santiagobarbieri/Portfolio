begin;
create schema if not exists private;
revoke all on schema private from public;
create table if not exists private.content_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
revoke all on private.content_admins from public, anon, authenticated;

create or replace function public.is_content_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from private.content_admins where user_id = auth.uid());
$$;
revoke all on function public.is_content_admin() from public;
grant execute on function public.is_content_admin() to anon, authenticated;

-- Payloads preserve the existing catalogs without exposing unrelated/private data.
create table if not exists public.content_items (
  kind text not null check (kind in ('collection','poster','product')),
  id text not null check (id ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  published boolean not null default false,
  sort_order integer not null default 0 check (sort_order between 0 and 1000000),
  updated_at timestamptz not null default now(),
  primary key (kind, id),
  check (payload->>'id' is not null and payload->>'id' = id),
  check (jsonb_typeof(payload->'title') = 'string' and length(payload->>'title') between 1 and 200),
  check (octet_length(payload::text) <= 32768)
);
alter table public.content_items enable row level security;
revoke all on public.content_items from public, anon, authenticated;
grant select on public.content_items to anon;
grant select, insert, update, delete on public.content_items to authenticated;
drop policy if exists content_read on public.content_items;
create policy content_read on public.content_items for select to anon, authenticated
  using (published or public.is_content_admin());
drop policy if exists content_write on public.content_items;
create policy content_write on public.content_items for all to authenticated
  using (public.is_content_admin()) with check (public.is_content_admin());

create or replace function private.stamp_content() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists content_timestamp on public.content_items;
create trigger content_timestamp before update on public.content_items
  for each row execute function private.stamp_content();

-- Public preview images only. No paid files or confidential drafts in this bucket.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portfolio-media','portfolio-media',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true, file_size_limit=2097152,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists portfolio_media_insert on storage.objects;
create policy portfolio_media_insert on storage.objects for insert to authenticated
with check (bucket_id='portfolio-media' and public.is_content_admin());
drop policy if exists portfolio_media_admin_read on storage.objects;
create policy portfolio_media_admin_read on storage.objects for select to authenticated
using (bucket_id='portfolio-media' and public.is_content_admin());
drop policy if exists portfolio_media_delete on storage.objects;
create policy portfolio_media_delete on storage.objects for delete to authenticated
using (bucket_id='portfolio-media' and public.is_content_admin());
commit;
-- Grant the first admin manually, AFTER creating their Auth user:
-- insert into private.content_admins(user_id) values ('UUID-FROM-AUTH-USERS');
