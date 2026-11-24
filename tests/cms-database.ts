import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

export const ownerId = "10000000-0000-4000-8000-000000000001";
export const editorId = "10000000-0000-4000-8000-000000000002";
export const strangerId = "10000000-0000-4000-8000-000000000003";
export const imageId = "20000000-0000-4000-8000-000000000001";

export async function testDatabase() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    grant usage on schema auth to anon, authenticated, service_role;
    create schema storage;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit integer, allowed_mime_types text[]);
    create table storage.objects (bucket_id text not null, name text not null);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to anon, authenticated, service_role;
    create policy broad_test_policy on storage.objects for all using (true) with check (true);
    insert into auth.users values ('${ownerId}'), ('${editorId}'), ('${strangerId}');
  `);
  await db.exec(
    await readFile(
      "supabase/migrations/20261125000100_content_editor.sql",
      "utf8",
    ),
  );
  await db.exec(`
    insert into public.profiles (user_id, display_name, role)
    values ('${ownerId}', 'Owner', 'owner'), ('${editorId}', 'Editor', 'editor');
  `);
  return db;
}

export async function asRole<T>(
  db: PGlite,
  role: "anon" | "authenticated" | "service_role",
  user: string,
  operation: (query: Pick<PGlite, "query">) => Promise<T>,
) {
  return db.transaction(async (transaction) => {
    await transaction.exec("set local role " + role);
    await transaction.query(
      "select set_config('request.jwt.claim.sub', $1, true)",
      [user],
    );
    return operation(transaction);
  });
}
