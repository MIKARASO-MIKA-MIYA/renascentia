begin;

alter table public.content_versions
  drop constraint if exists content_versions_body_check,
  add constraint content_versions_body_check check (jsonb_typeof(body) = 'object');

commit;
