"use server";

import { revalidatePath, updateTag } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  getEditor,
  sessionClient,
  writerClient,
  writerConfigured,
} from "@/lib/cms/clients";
import { cookieName, publishedTag } from "@/lib/cms/config";
import {
  editingModeCookie,
  visitChoiceCookie,
  visitChoiceMaxAge,
} from "@/lib/account-preferences";
import { seedByKey } from "@/lib/cms/registry";
import { normalizeDocument } from "@/lib/cms/normalize-document";
import {
  documentSchema,
  isHttps,
  exceedsDocumentTransport,
  maxDocumentBytes,
  mediaIdFromUrl,
  newPathSchema,
  pageKeySchema,
  type CmsDocument,
} from "@/lib/cms/schema";

const notAllowed = "Для этой операции нужны права редактора.";
const noStorage = "Хранилище CMS не настроено.";
type Failure = { ok: false; message: string; conflict?: boolean };
type Success<T> = { ok: true; data: T };
export type CmsResult<T = null> = Success<T> | Failure;
const failure = (message: string, conflict = false): Failure => ({
  ok: false,
  message,
  conflict,
});
const success = <T>(data: T): Success<T> => ({ ok: true, data });
const revision = z.number().int().min(0).max(2147483646);
const request = z
  .object({
    key: pageKeySchema,
    revision,
    intent: z.enum(["draft", "publish", "restore", "unpublish"]),
    versionId: z.number().int().positive().optional(),
  })
  .strict();

function errorResult(error: { code?: string; message: string }): Failure {
  if (error.code === "40001")
    return failure(
      "Содержимое уже изменено. Скопируйте правки и заново откройте редактор.",
      true,
    );
  if (error.code === "42501")
    return failure("У вас нет разрешения на эту операцию.");
  if (error.code === "23505") return failure("Такой адрес уже используется.");
  if (error.code === "23503")
    return failure("Один из материалов, пользователей или файлов не найден.");
  if (error.code === "P0002") return failure("Запись больше недоступна.");
  if (
    error.code === "23514" &&
    error.message.includes("content_versions_body_check")
  )
    return failure(
      "Хранилище отклонило размер документа. Проверьте, применена ли миграция CMS 0.0.5.",
    );
  console.error("CMS operation failed", error.code, error.message);
  return failure(
    "Операция не завершилась. Проверьте подключение CMS и повторите попытку.",
  );
}

function invalidate(key: string) {
  updateTag(publishedTag);
  revalidatePath(key.split("~")[0]);
  revalidatePath("/publications");
  revalidatePath("/thinkers");
  revalidatePath("/search");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
}

export async function signIn(
  _: CmsResult | null,
  formData: FormData,
): Promise<CmsResult> {
  const input = z
    .object({ email: z.email().max(254), password: z.string().min(1).max(256) })
    .safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!input.success) return failure("Введите корректный адрес и пароль.");
  const client = await sessionClient();
  if (!client || !writerConfigured()) return failure(noStorage);
  const { data, error } = await client.auth.signInWithPassword(input.data);
  if (error || !data.user)
    return failure("Не удалось войти. Проверьте адрес, пароль и доступ к CMS.");
  const { data: profile } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (profile?.role !== "owner" && profile?.role !== "editor") {
    await client.auth.signOut({ scope: "local" });
    return failure("Этому аккаунту не назначена роль редактора.");
  }
  const store = await cookies();
  store.delete(editingModeCookie);
  store.set(visitChoiceCookie, "editor", {
    path: "/",
    sameSite: "lax",
    maxAge: visitChoiceMaxAge,
  });
  redirect("/");
}

export async function signOut() {
  try {
    const client = await sessionClient();
    await client?.auth.signOut({ scope: "local" });
  } catch {
    console.error("Could not revoke the remote session during sign-out");
  }
  const store = await cookies();
  for (const { name } of store.getAll()) {
    if (name === cookieName || name.startsWith(cookieName + "."))
      store.delete(name);
  }
  store.delete(editingModeCookie);
  store.set(visitChoiceCookie, "guest", {
    path: "/",
    sameSite: "lax",
    maxAge: visitChoiceMaxAge,
  });
  redirect("/");
}

export async function setEditingMode(mode: "edit" | "view") {
  if ((mode !== "edit" && mode !== "view") || !(await getEditor())) return;
  const store = await cookies();
  if (mode === "edit") store.delete(editingModeCookie);
  else
    store.set(editingModeCookie, "view", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
}

export async function viewSite() {
  await setEditingMode("view");
  redirect("/");
}

export type EditState = {
  body: CmsDocument;
  revision: number;
  published: boolean;
};

export async function loadEdit(key: string): Promise<CmsResult<EditState>> {
  if (!pageKeySchema.safeParse(key).success)
    return failure("Неизвестный материал.");
  const editor = await getEditor();
  if (!editor) return failure(notAllowed);
  if (!writerConfigured()) return failure(noStorage);
  const { data: head, error } = await editor.client
    .from("page_sections")
    .select("revision, draft_version, published_version")
    .eq("page_key", key)
    .maybeSingle();
  if (error) return errorResult(error);
  if (head?.draft_version) {
    const { data, error: versionError } = await editor.client
      .from("content_versions")
      .select("body")
      .eq("id", head.draft_version)
      .eq("page_key", key)
      .single();
    if (versionError) return errorResult(versionError);
    const result = documentSchema.safeParse(data.body);
    return result.success
      ? success({
          body: result.data,
          revision: head.revision,
          published: Boolean(head.published_version),
        })
      : failure("Сохранённая версия имеет неподдерживаемый формат.");
  }
  const seed = seedByKey.get(key);
  return seed
    ? success({
        body: seed.seed,
        revision: head?.revision ?? 0,
        published: seed.kind !== "section",
      })
    : failure("Материал не найден.");
}

function cmsMediaIds(body: CmsDocument) {
  return [
    ...new Set(
      [
        ...Object.values(body.fields),
        ...body.blocks.flatMap(
          ({ images }) => images?.map(({ url }) => url) ?? [],
        ),
      ]
        .map(mediaIdFromUrl)
        .filter((value): value is string => value !== null),
    ),
  ];
}

export async function writeEntry(
  input: unknown,
  content: FormData,
): Promise<CmsResult<number>> {
  const parsed = request.safeParse(input);
  if (!parsed.success) return failure("Некорректный запрос сохранения.");
  const { key, intent, versionId } = parsed.data;
  const editor = await getEditor();
  if (
    !editor ||
    ((intent === "publish" || intent === "unpublish") && !editor.publish) ||
    (intent === "restore" && !editor.owner)
  )
    return failure("У вас нет разрешения на эту операцию.");
  const writer = writerClient();
  if (!writer) return failure(noStorage);
  const seed = seedByKey.get(key);
  let body: CmsDocument | undefined;
  if (intent === "restore") {
    if (!versionId) return failure("Укажите версию для восстановления.");
  } else if (intent === "unpublish") {
    if (seed)
      return failure(
        "Для встроенного материала доступна публикация следующей версии.",
      );
  } else {
    const bodyJson = content instanceof FormData ? content.get("body") : null;
    if (typeof bodyJson !== "string" || !bodyJson)
      return failure("Документ · содержимое отсутствует.");
    if (exceedsDocumentTransport(bodyJson))
      return failure(
        "Документ · размер превышает 4 МБ, которые сервер может принять за один запрос.",
      );
    let input: unknown;
    try {
      input = JSON.parse(bodyJson);
    } catch {
      return failure("Документ · повреждён формат JSON.");
    }
    const result = normalizeDocument(input, {
      title: seed?.seed.title,
      fields: seed?.fields,
    });
    if (!result.ok) return failure(result.field + " · " + result.message + ".");
    body = result.body;
  }
  if (seed && parsed.data.revision === 0) {
    const { error } = await writer.rpc("cms_seed", {
      entries: [
        { key: seed.key, path: seed.path, kind: seed.kind, seed: seed.seed },
      ],
    });
    if (error) return errorResult(error);
  }
  const { data, error } = await writer.rpc("cms_write", {
    editor_id: editor.id,
    entry_key: key,
    expected_revision: parsed.data.revision,
    intent,
    proposed: body,
    version_id: versionId,
    media_ids: body && intent === "publish" ? cmsMediaIds(body) : [],
  });
  if (error) return errorResult(error);
  if (intent === "publish" || intent === "unpublish") invalidate(key);
  else revalidatePath("/admin");
  return success(data as number);
}

export async function createEntry(
  _: CmsResult | null,
  form: FormData,
): Promise<CmsResult> {
  const editor = await getEditor();
  if (!editor) return failure(notAllowed);
  const writer = writerClient();
  if (!writer) return failure(noStorage);
  const path = newPathSchema.safeParse(form.get("path"));
  const body = documentSchema.safeParse({
    format: 1,
    title: form.get("title"),
    description: form.get("description") ?? "",
    fields: {},
    blocks: [],
  });
  if (!path.success || !body.success)
    return failure(
      "Проверьте заголовок и адрес вида /publications/primer, /thinkers/primer или /pages/primer.",
    );
  if (seedByKey.has(path.data)) return failure("Такой адрес уже используется.");
  const { error } = await writer.rpc("cms_create", {
    editor_id: editor.id,
    new_path: path.data,
    proposed: body.data,
  });
  if (error) return errorResult(error);
  redirect("/admin?edit=" + encodeURIComponent(path.data));
}

export type VersionInfo = {
  id: number;
  revision: number;
  author_name: string;
  event: string;
  created_at: string;
  restored_from: number | null;
};

export async function loadHistory(
  key: string,
  before?: number,
): Promise<CmsResult<VersionInfo[]>> {
  if (
    !pageKeySchema.safeParse(key).success ||
    (before !== undefined && !revision.safeParse(before).success)
  )
    return failure("Неизвестный материал.");
  const editor = await getEditor();
  if (!editor) return failure(notAllowed);
  const query = editor.client
    .from("content_versions")
    .select("id, revision, author_name, event, created_at, restored_from")
    .eq("page_key", key)
    .order("revision", { ascending: false })
    .limit(30);
  if (before) query.lt("revision", before);
  const { data, error } = await query;
  return error ? errorResult(error) : success(data as VersionInfo[]);
}

export async function loadVersion(
  key: string,
  versionId: number,
): Promise<CmsResult<CmsDocument>> {
  if (
    !pageKeySchema.safeParse(key).success ||
    !z.number().int().positive().safeParse(versionId).success
  )
    return failure("Некорректная версия.");
  const editor = await getEditor();
  if (!editor) return failure(notAllowed);
  const { data, error } = await editor.client
    .from("content_versions")
    .select("body")
    .eq("page_key", key)
    .eq("id", versionId)
    .single();
  if (error) return errorResult(error);
  const result = documentSchema.safeParse(data.body);
  return result.success
    ? success(result.data)
    : failure("Неподдерживаемый формат версии.");
}

export async function changeEditor(
  _: CmsResult | null,
  form: FormData,
): Promise<CmsResult> {
  const editor = await getEditor();
  if (!editor?.owner)
    return failure("Управление редакторами доступно владельцу.");
  const writer = writerClient();
  if (!writer) return failure(noStorage);
  const input = z
    .object({
      id: z.uuid(),
      name: z.string().trim().max(180),
      operation: z.enum(["save", "remove"]),
      publish: z.boolean(),
    })
    .safeParse({
      id: form.get("id"),
      name: form.get("name") ?? "",
      operation: form.get("operation") ?? "save",
      publish: form.get("publish") === "on",
    });
  if (!input.success || (input.data.operation === "save" && !input.data.name))
    return failure("Укажите UUID аккаунта Supabase Auth и имя редактора.");
  const { id, name, operation, publish } = input.data;
  const { error } = await writer.rpc("cms_set_editor", {
    owner_id: editor.id,
    target_id: id,
    new_name: name,
    may_publish: publish,
    remove_editor: operation === "remove",
  });
  if (error) return errorResult(error);
  revalidatePath("/admin");
  return success(null);
}

export async function saveNotice(
  _: CmsResult | null,
  form: FormData,
): Promise<CmsResult> {
  const editor = await getEditor();
  if (!editor?.owner) return failure("Настройки доступны владельцу.");
  const writer = writerClient();
  if (!writer) return failure(noStorage);
  const value = z.string().max(500).safeParse(form.get("notice"));
  if (!value.success)
    return failure("Заметка должна содержать не более 500 символов.");
  const { error } = await writer.rpc("cms_set_notice", {
    owner_id: editor.id,
    notice: value.data,
  });
  if (error) return errorResult(error);
  revalidatePath("/admin");
  return success(null);
}

const mediaFields = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(240),
  alt: z.string().max(420),
  author: z.string().max(220),
  source: z
    .string()
    .max(2048)
    .refine((value) => !value || isHttps(value)),
  license: z.string().max(220),
});

export async function updateMedia(
  _: CmsResult | null,
  form: FormData,
): Promise<CmsResult> {
  const editor = await getEditor();
  if (!editor) return failure(notAllowed);
  const writer = writerClient();
  if (!writer) return failure(noStorage);
  const input = mediaFields.safeParse(Object.fromEntries(form));
  if (!input.success)
    return failure("Проверьте название, подпись и ссылку на источник.");
  const { id, ...metadata } = input.data;
  const { error } = await writer.rpc("cms_update_media", {
    editor_id: editor.id,
    asset_id: id,
    fields: metadata,
  });
  if (error) return errorResult(error);
  revalidatePath("/admin");
  return success(null);
}

const backupSchema = z
  .object({
    format: z.literal(1),
    kind: z.literal("renascentia-backup"),
    entries: z
      .array(
        z.object({ key: pageKeySchema, revision, body: z.unknown() }).strict(),
      )
      .min(1),
  })
  .strict();

export async function importBackup(
  _: CmsResult<number> | null,
  form: FormData,
): Promise<CmsResult<number>> {
  const editor = await getEditor();
  if (!editor?.owner) return failure("Импорт доступен владельцу.");
  const writer = writerClient();
  if (!writer) return failure(noStorage);
  const file = form.get("backup");
  if (
    !(file instanceof File) ||
    file.size > maxDocumentBytes ||
    form.get("confirm") !== "on"
  )
    return failure("Выберите JSON меньше 4 МБ и подтвердите восстановление.");
  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    return failure("Неверный формат JSON.");
  }
  const parsed = backupSchema.safeParse(raw);
  if (
    !parsed.success ||
    new Set(parsed.data.entries.map(({ key }) => key)).size !==
      parsed.data.entries.length
  ) {
    return failure("Файл не соответствует формату резервной копии.");
  }
  const entries: { key: string; body: CmsDocument }[] = [];
  for (const { key, body } of parsed.data.entries) {
    const seed = seedByKey.get(key);
    if (!seed && !newPathSchema.safeParse(key).success)
      return failure("Недопустимый адрес материала " + key + ".");
    const result = normalizeDocument(body, {
      title: seed?.seed.title,
      fields: seed?.fields,
    });
    if (!result.ok)
      return failure(key + " · " + result.field + " · " + result.message + ".");
    entries.push({ key, body: result.body });
  }
  const keys = entries.map(({ key }) => key);
  const heads = new Map<string, number>();
  for (let start = 0; start < keys.length; start += 50) {
    const { data, error } = await editor.client
      .from("page_sections")
      .select("page_key, revision")
      .in("page_key", keys.slice(start, start + 50));
    if (error) return errorResult(error);
    data?.forEach((head) => heads.set(head.page_key, head.revision));
  }
  const { data, error } = await writer.rpc("cms_import", {
    owner_id: editor.id,
    entries: entries.map(({ key, body }) => ({
      key,
      body,
      expected: heads.get(key) ?? 0,
      seed: !heads.has(key) ? seedByKey.get(key) : undefined,
    })),
  });
  if (error) return errorResult(error);
  revalidatePath("/admin");
  return success(data as number);
}
