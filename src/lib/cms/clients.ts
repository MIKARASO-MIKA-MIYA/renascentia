import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { cache } from "react";
import { editingModeCookie } from "../account-preferences";
import { cookieName, supabaseConfig } from "./config";

export const sessionClient = cache(async () => {
  const config = supabaseConfig();
  if (!config) return null;
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookieOptions: {
      name: cookieName,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
    cookies: {
      getAll: () => store.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          // The proxy refreshes cookies before Server Components render.
        }
      },
    },
  });
});

const noSession = { persistSession: false, autoRefreshToken: false };

export function readerClient() {
  const config = supabaseConfig();
  return config
    ? createClient(config.url, config.key, { auth: noSession })
    : null;
}

export function writerClient() {
  const config = supabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return config && key
    ? createClient(config.url, key, { auth: noSession })
    : null;
}

export function writerConfigured() {
  return Boolean(supabaseConfig() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export const getEditor = cache(async () => {
  if (!supabaseConfig()) return null;
  const store = await cookies();
  if (
    !store
      .getAll()
      .some(
        ({ name }) => name === cookieName || name.startsWith(cookieName + "."),
      )
  )
    return null;
  const client = await sessionClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;
  const { data } = await client
    .from("profiles")
    .select("display_name, role, can_publish")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data || (data.role !== "owner" && data.role !== "editor")) return null;
  return {
    id: user.id,
    email: user.email,
    name: data.display_name as string,
    owner: data.role === "owner",
    publish: data.role === "owner" || data.can_publish === true,
    editing: store.get(editingModeCookie)?.value !== "view",
    client,
  };
});
