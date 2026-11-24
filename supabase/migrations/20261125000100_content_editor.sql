begin;

create table public.roles (
  name text primary key check (name in ('owner', 'editor')),
  can_publish boolean not null
);
insert into public.roles values ('owner', true), ('editor', false);

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (length(display_name) between 1 and 180),
  role text not null references public.roles (name),
  can_publish boolean not null default false
);

create table public.pages (
  key text primary key check (length(key) <= 180 and key ~ '^/[a-z0-9/~.-]*$'),
  path text not null check (length(path) <= 160 and path ~ '^/[a-z0-9/-]*$'),
  kind text not null check (kind in ('page', 'program', 'publication', 'biography', 'section')),
  seed jsonb not null check (jsonb_typeof(seed) = 'object'),
  built_in boolean not null default false,
  created_at timestamptz not null default now(),
  check (split_part(key, '~', 1) = path)
);
create index pages_path on public.pages (path);

create table public.content_versions (
  id bigint generated always as identity primary key,
  page_key text not null references public.pages (key),
  revision integer not null check (revision > 0),
  body jsonb not null check (jsonb_typeof(body) = 'object' and octet_length(body::text) < 2600000),
  actor uuid references auth.users (id) on delete set null,
  author_name text not null,
  event text not null check (event in ('draft', 'publish', 'restore', 'unpublish')),
  restored_from bigint references public.content_versions (id),
  created_at timestamptz not null default now(),
  unique (page_key, revision),
  unique (page_key, id)
);

create table public.page_sections (
  page_key text primary key references public.pages (key),
  revision integer not null default 0 check (revision >= 0),
  draft_version bigint,
  published_version bigint,
  updated_at timestamptz not null default now(),
  foreign key (page_key, draft_version) references public.content_versions (page_key, id),
  foreign key (page_key, published_version) references public.content_versions (page_key, id)
);

create table public.media_assets (
  id uuid primary key,
  path text not null unique check (path ~ '^[0-9a-f-]+\.(webp|gif)$'),
  title text not null check (length(title) between 1 and 240),
  size integer not null check (size between 1 and 3145728),
  mime text not null check (mime in ('image/webp', 'image/gif')),
  alt text not null default '' check (length(alt) <= 420),
  author text not null default '' check (length(author) <= 220),
  source text not null default '' check (length(source) <= 2048),
  license text not null default '' check (length(license) <= 220),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.published_media_refs (
  page_key text not null references public.pages (key),
  media_id uuid not null references public.media_assets (id),
  primary key (page_key, media_id)
);
create index published_media_refs_media on public.published_media_refs (media_id);

create table public.cms_settings (
  key text primary key check (key in ('editor_notice')),
  value text not null check (length(value) <= 500)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  event text not null,
  subject text not null,
  created_at timestamptz not null default now()
);

alter table public.roles enable row level security;
alter table public.profiles enable row level security;
alter table public.pages enable row level security;
alter table public.page_sections enable row level security;
alter table public.content_versions enable row level security;
alter table public.media_assets enable row level security;
alter table public.published_media_refs enable row level security;
alter table public.cms_settings enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.roles, public.profiles, public.pages, public.page_sections,
  public.content_versions, public.media_assets, public.published_media_refs,
  public.cms_settings, public.audit_logs from public, anon, authenticated;
grant select on public.roles, public.profiles, public.pages, public.page_sections,
  public.content_versions, public.media_assets, public.cms_settings,
  public.audit_logs to authenticated;
grant all on public.roles, public.profiles, public.pages, public.page_sections,
  public.content_versions, public.media_assets, public.published_media_refs,
  public.cms_settings, public.audit_logs to service_role;

create function public.cms_has_role(allowed text[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.user_id = auth.uid() and p.role = any(allowed)
  );
$$;
revoke all on function public.cms_has_role(text[]) from public, anon;
grant execute on function public.cms_has_role(text[]) to authenticated;

create policy profiles_read on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.cms_has_role(array['owner'])));
create policy roles_read on public.roles for select to authenticated
  using ((select public.cms_has_role(array['owner', 'editor'])));
create policy pages_read on public.pages for select to authenticated
  using ((select public.cms_has_role(array['owner', 'editor'])));
create policy sections_read on public.page_sections for select to authenticated
  using ((select public.cms_has_role(array['owner', 'editor'])));
create policy versions_read on public.content_versions for select to authenticated
  using ((select public.cms_has_role(array['owner', 'editor'])));
create policy media_read on public.media_assets for select to authenticated
  using ((select public.cms_has_role(array['owner', 'editor'])));
create policy settings_read on public.cms_settings for select to authenticated
  using ((select public.cms_has_role(array['owner', 'editor'])));
create policy audit_read on public.audit_logs for select to authenticated
  using ((select public.cms_has_role(array['owner'])));

create function public.cms_public(request_path text default null)
returns table (key text, path text, kind text, body jsonb, updated_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.key, p.path, p.kind, v.body, v.created_at
  from public.pages p
  join public.page_sections s on s.page_key = p.key
  join public.content_versions v on v.id = s.published_version and v.page_key = p.key
  where request_path is null or p.path = request_path
  order by p.key;
$$;
revoke all on function public.cms_public(text) from public;
grant execute on function public.cms_public(text) to anon, authenticated, service_role;

create function public.cms_public_media(asset_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select m.path from public.media_assets m
  where m.id = asset_id and exists (
    select 1 from public.published_media_refs r where r.media_id = m.id
  );
$$;
revoke all on function public.cms_public_media(uuid) from public;
grant execute on function public.cms_public_media(uuid) to anon, authenticated, service_role;

create function public.cms_dashboard()
returns table (key text, path text, kind text, title text, revision integer, has_draft boolean, has_public boolean)
language sql stable set search_path = ''
as $$
  select p.key, p.path, p.kind, coalesce(v.body ->> 'title', p.seed ->> 'title'),
    s.revision, s.draft_version is distinct from s.published_version,
    p.built_in or s.published_version is not null
  from public.pages p
  join public.page_sections s on s.page_key = p.key
  left join public.content_versions v on v.id = s.draft_version
  order by p.key;
$$;
revoke all on function public.cms_dashboard() from public, anon;
grant execute on function public.cms_dashboard() to authenticated;

create function public.cms_export()
returns table (key text, revision integer, body jsonb)
language sql stable set search_path = ''
as $$
  select p.key, s.revision, coalesce(v.body, p.seed)
  from public.pages p
  join public.page_sections s on s.page_key = p.key
  left join public.content_versions v on v.id = s.draft_version
  where (select public.cms_has_role(array['owner']))
  order by p.key;
$$;
revoke all on function public.cms_export() from public, anon;
grant execute on function public.cms_export() to authenticated;

create function public.cms_seed(entries jsonb)
returns integer
language plpgsql set search_path = ''
as $$
declare inserted integer;
begin
  with imported as (
    insert into public.pages (key, path, kind, seed, built_in)
    select entry.key, entry.path, entry.kind, entry.seed, true
    from jsonb_to_recordset(entries) as entry(key text, path text, kind text, seed jsonb)
    on conflict (key) do nothing
    returning key
  )
  insert into public.page_sections (page_key) select key from imported;
  get diagnostics inserted = row_count;
  return inserted;
end;
$$;
revoke all on function public.cms_seed(jsonb) from public, anon, authenticated;
grant execute on function public.cms_seed(jsonb) to service_role;

create function public.cms_write(
  editor_id uuid, entry_key text, expected_revision integer, intent text,
  proposed jsonb default null, version_id bigint default null,
  media_ids uuid[] default array[]::uuid[]
)
returns integer
language plpgsql set search_path = ''
as $$
declare
  editor public.profiles;
  current_head public.page_sections;
  written_id bigint;
  next_revision integer;
begin
  select * into editor from public.profiles where user_id = editor_id for share;
  if not found then raise exception using errcode = '42501', message = 'cms_forbidden'; end if;
  if intent not in ('draft', 'publish', 'restore', 'unpublish') or intent is null then
    raise exception using errcode = '22023', message = 'cms_invalid_intent';
  end if;
  if (intent in ('publish', 'unpublish') and not (editor.role = 'owner' or editor.can_publish))
    or (intent = 'restore' and editor.role <> 'owner') then
    raise exception using errcode = '42501', message = 'cms_forbidden';
  end if;
  select * into current_head from public.page_sections where page_key = entry_key for update;
  if not found then raise exception using errcode = 'P0002', message = 'cms_not_found'; end if;
  if current_head.revision is distinct from expected_revision then
    raise exception using errcode = '40001', message = 'cms_conflict';
  end if;
  if intent = 'restore' then
    select body into proposed from public.content_versions where id = version_id and page_key = entry_key;
    if not found then raise exception using errcode = 'P0002', message = 'cms_not_found'; end if;
  end if;
  if intent = 'unpublish' then
    if exists (select 1 from public.pages where key = entry_key and built_in)
      or current_head.published_version is null then
      raise exception using errcode = '22023', message = 'cms_cannot_unpublish';
    end if;
    select body into proposed from public.content_versions where id = current_head.draft_version;
  end if;
  next_revision := current_head.revision + 1;
  insert into public.content_versions (page_key, revision, body, actor, author_name, event, restored_from)
  values (entry_key, next_revision, proposed, editor_id, editor.display_name, intent,
    case when intent = 'restore' then version_id end)
  returning id into written_id;
  update public.page_sections
  set revision = next_revision, draft_version = written_id,
      published_version = case when intent = 'publish' then written_id when intent = 'unpublish' then null else published_version end,
      updated_at = now()
  where page_key = entry_key;
  if intent in ('publish', 'unpublish') then
    delete from public.published_media_refs where page_key = entry_key;
  end if;
  if intent = 'publish' then
    insert into public.published_media_refs (page_key, media_id)
    select distinct entry_key, unnest(media_ids);
  end if;
  insert into public.audit_logs (actor, event, subject) values (editor_id, intent, entry_key);
  return next_revision;
end;
$$;
revoke all on function public.cms_write(uuid, text, integer, text, jsonb, bigint, uuid[]) from public, anon, authenticated;
grant execute on function public.cms_write(uuid, text, integer, text, jsonb, bigint, uuid[]) to service_role;

create function public.cms_create(editor_id uuid, new_path text, proposed jsonb)
returns integer
language plpgsql set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where user_id = editor_id) then
    raise exception using errcode = '42501', message = 'cms_forbidden';
  end if;
  if length(new_path) > 100 or new_path !~ '^/(publications|pages|thinkers)/[a-z0-9]+(-[a-z0-9]+)*$' then
    raise exception using errcode = '22023', message = 'cms_invalid_path';
  end if;
  insert into public.pages (key, path, kind, seed)
  values (new_path, new_path, case split_part(new_path, '/', 2)
    when 'publications' then 'publication' when 'thinkers' then 'biography' else 'page' end, proposed);
  insert into public.page_sections (page_key) values (new_path);
  return public.cms_write(editor_id, new_path, 0, 'draft', proposed);
end;
$$;
revoke all on function public.cms_create(uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.cms_create(uuid, text, jsonb) to service_role;

create function public.cms_set_editor(owner_id uuid, target_id uuid, new_name text, may_publish boolean, remove_editor boolean)
returns void
language plpgsql set search_path = ''
as $$
begin
  -- Serialize role changes so concurrent requests cannot replace an owner profile.
  perform pg_advisory_xact_lock(472063495);
  if not exists (select 1 from public.profiles where user_id = owner_id and role = 'owner') then
    raise exception using errcode = '42501', message = 'cms_forbidden';
  end if;
  if exists (select 1 from public.profiles where user_id = target_id and role = 'owner') then
    raise exception using errcode = '42501', message = 'cms_owner_immutable';
  end if;
  if remove_editor then
    delete from public.profiles where user_id = target_id and role = 'editor';
  else
    insert into public.profiles (user_id, display_name, role, can_publish)
    values (target_id, new_name, 'editor', may_publish)
    on conflict (user_id) do update set display_name = excluded.display_name, can_publish = excluded.can_publish
    where profiles.role = 'editor';
  end if;
  insert into public.audit_logs (actor, event, subject)
  values (owner_id, case when remove_editor then 'remove_editor' else 'save_editor' end, target_id::text);
end;
$$;
revoke all on function public.cms_set_editor(uuid, uuid, text, boolean, boolean) from public, anon, authenticated;
grant execute on function public.cms_set_editor(uuid, uuid, text, boolean, boolean) to service_role;

create function public.cms_set_notice(owner_id uuid, notice text)
returns void
language plpgsql set search_path = ''
as $$
begin
  perform from public.profiles where user_id = owner_id and role = 'owner' for share;
  if not found then raise exception using errcode = '42501', message = 'cms_forbidden'; end if;
  insert into public.cms_settings values ('editor_notice', notice)
  on conflict (key) do update set value = excluded.value;
  insert into public.audit_logs (actor, event, subject) values (owner_id, 'notice', 'editor_notice');
end;
$$;
revoke all on function public.cms_set_notice(uuid, text) from public, anon, authenticated;
grant execute on function public.cms_set_notice(uuid, text) to service_role;

create function public.cms_update_media(editor_id uuid, asset_id uuid, fields jsonb)
returns void
language plpgsql set search_path = ''
as $$
begin
  perform from public.profiles where user_id = editor_id for share;
  if not found then raise exception using errcode = '42501', message = 'cms_forbidden'; end if;
  update public.media_assets set title = fields->>'title', alt = fields->>'alt',
    author = fields->>'author', source = fields->>'source', license = fields->>'license'
  where id = asset_id;
  if not found then raise exception using errcode = 'P0002', message = 'cms_not_found'; end if;
  insert into public.audit_logs (actor, event, subject) values (editor_id, 'media_update', asset_id::text);
end;
$$;
revoke all on function public.cms_update_media(uuid, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.cms_update_media(uuid, uuid, jsonb) to service_role;

create function public.cms_add_media(editor_id uuid, asset_id uuid, object_path text, file_title text, file_size integer, file_mime text)
returns setof public.media_assets
language plpgsql set search_path = ''
as $$
begin
  perform from public.profiles where user_id = editor_id for share;
  if not found then raise exception using errcode = '42501', message = 'cms_forbidden'; end if;
  insert into public.audit_logs (actor, event, subject) values (editor_id, 'media_upload', asset_id::text);
  return query insert into public.media_assets (id, path, title, size, mime, uploaded_by)
    values (asset_id, object_path, file_title, file_size, file_mime, editor_id) returning *;
end;
$$;
revoke all on function public.cms_add_media(uuid, uuid, text, text, integer, text) from public, anon, authenticated;
grant execute on function public.cms_add_media(uuid, uuid, text, text, integer, text) to service_role;

create function public.cms_import(owner_id uuid, entries jsonb)
returns integer
language plpgsql set search_path = ''
as $$
declare entry record;
begin
  perform from public.profiles where user_id = owner_id and role = 'owner' for share;
  if not found then raise exception using errcode = '42501', message = 'cms_forbidden'; end if;
  for entry in select * from jsonb_to_recordset(entries)
    as item(key text, body jsonb, expected integer, seed jsonb) order by item.key
  loop
    if entry.seed is not null then
      perform public.cms_seed(jsonb_build_array(entry.seed));
    end if;
    if not exists (select 1 from public.pages where key = entry.key) and entry.expected = 0 then
      perform public.cms_create(owner_id, entry.key, entry.body);
    else
      perform public.cms_write(owner_id, entry.key, entry.expected, 'draft', entry.body);
    end if;
  end loop;
  insert into public.audit_logs (actor, event, subject) values (owner_id, 'import', jsonb_array_length(entries)::text);
  return jsonb_array_length(entries);
end;
$$;
revoke all on function public.cms_import(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.cms_import(uuid, jsonb) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cms-images', 'cms-images', false, 3145728, array['image/webp','image/gif']);
-- This private bucket is accessed only from the server with service_role.
-- Restrictive policies continue to deny access if another bucket uses broad policies.
create policy cms_storage_anon_block on storage.objects as restrictive for all to anon, authenticated
  using (bucket_id <> 'cms-images')
  with check (bucket_id <> 'cms-images');

commit;
