import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { publishedTag, supabaseConfig } from "./config";
import { documentSchema, type CmsDocument } from "./schema";

export type PublishedEntry = {
  key: string;
  path: string;
  kind: string;
  body: CmsDocument;
  updated_at: string;
};

async function fetchPublished(path: string | null, projectUrl: string) {
  const config = supabaseConfig();
  if (!config) return [];
  const client = createClient(projectUrl, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const entries: PublishedEntry[] = [];
  const pageSize = 100;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .rpc("cms_public", { request_path: path })
      .order("key")
      .range(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!Array.isArray(data)) break;
    for (const entry of data) {
      const result = documentSchema.safeParse(entry.body);
      if (result.success)
        entries.push({ ...entry, body: result.data } as PublishedEntry);
    }
    if (data.length < pageSize) break;
  }
  return entries;
}

const readPublished = unstable_cache(
  async (path: string | null, projectUrl: string) => {
    const entries = await fetchPublished(path, projectUrl);
    // The Next.js Data Cache has a 2 MiB limit per value, unlike PostgreSQL.
    const cacheBytes = Buffer.byteLength(
      JSON.stringify({ body: JSON.stringify(entries) }),
    );
    return cacheBytes < 2 * 1024 * 1024 - 4096 ? entries : null;
  },
  ["cms-public-v2"],
  { tags: [publishedTag], revalidate: 120 },
);

export const publishedEntries = cache(async (path: string | null = null) => {
  const config = supabaseConfig();
  if (!config) return [];
  try {
    return (
      (await readPublished(path, config.url)) ??
      (await fetchPublished(path, config.url))
    );
  } catch (error) {
    console.error("Cannot read published CMS content", error);
    return [];
  }
});

export async function publishedEntry(key: string) {
  return (await publishedEntries(key.split("~")[0])).find(
    (entry) => entry.key === key,
  );
}
