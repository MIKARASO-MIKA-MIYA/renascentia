import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { cmsSeeds, validNativeFields } from "../src/lib/cms/registry";
import { documentSchema } from "../src/lib/cms/schema";

async function main() {
  const rows = cmsSeeds.map(({ key, path, kind, seed }) => {
    const result = documentSchema.safeParse(seed);
    if (!result.success || !validNativeFields(seed, key))
      throw new Error("Ошибка в исходном материале " + key);
    return { key, path, kind, seed: result.data };
  });
  if (process.argv.includes("--check")) {
    console.log("Проверено исходных записей: " + rows.length);
    return;
  }
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secret)
    throw new Error("Укажите Supabase URL и серверный ключ в .env.local.");
  const client = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  let count = 0;
  for (let index = 0; index < rows.length; index += 15) {
    const { data, error } = await client.rpc("cms_seed", {
      entries: rows.slice(index, index + 15),
    });
    if (error)
      throw new Error("Миграция контента не завершилась: " + error.message);
    count += Number(data);
  }
  console.log(`Исходных записей: ${rows.length}. Новых: ${count}.`);
}

main().catch((error: Error) => {
  console.error(error.message);
  process.exitCode = 1;
});
