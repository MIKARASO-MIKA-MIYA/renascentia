"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import sharp, { type Metadata } from "sharp";
import { z } from "zod";
import { getEditor, writerClient } from "@/lib/cms/clients";
import { mediaBucket } from "@/lib/cms/config";
import { maxImageSize, stripControlCharacters } from "@/lib/cms/schema";
import type { CmsResult } from "./actions";

export type MediaItem = {
  id: string;
  title: string;
  mime: string;
  size: number;
  alt: string;
  author: string;
  source: string;
  license: string;
  created_at: string;
};
const fields =
  "id, title, mime, size, alt, author, source, license, created_at";

function realMime(metadata: Metadata) {
  if (metadata.format === "heif" && metadata.compression === "av1")
    return "image/avif";
  if (
    metadata.format &&
    ["jpeg", "png", "webp", "gif"].includes(metadata.format)
  )
    return "image/" + metadata.format;
  return null;
}

export async function uploadImage(
  form: FormData,
): Promise<CmsResult<MediaItem>> {
  const editor = await getEditor();
  if (!editor)
    return { ok: false, message: "Для загрузки нужны права редактора." };
  const client = writerClient();
  if (!client) return { ok: false, message: "Хранилище CMS не настроено." };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > maxImageSize) {
    return {
      ok: false,
      message: "Выберите JPEG, PNG, WebP, AVIF или GIF размером до 3 МБ.",
    };
  }

  let result: Buffer;
  let extension: "webp" | "gif";
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), {
      animated: true,
      limitInputPixels: 25_000_000,
      failOn: "error",
    });
    const metadata = await input.metadata();
    const mime = realMime(metadata);
    if (
      !mime ||
      (file.type && file.type !== mime) ||
      !metadata.width ||
      !metadata.height ||
      metadata.width * metadata.height > 25_000_000 ||
      (metadata.pages ?? 1) > 120
    ) {
      return {
        ok: false,
        message:
          "Формат, размеры или количество кадров изображения недопустимы.",
      };
    }
    extension = mime === "image/gif" ? "gif" : "webp";
    const resized = input.autoOrient().resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    });
    result = await (
      extension === "gif" ? resized.gif() : resized.webp({ quality: 84 })
    ).toBuffer();
  } catch {
    return { ok: false, message: "Файл не удалось прочитать как изображение." };
  }
  if (result.length > maxImageSize)
    return { ok: false, message: "Подготовленное изображение превышает 3 МБ." };
  const id = randomUUID();
  const path = id + "." + extension;
  const mime = "image/" + extension;
  const { error: storageError } = await client.storage
    .from(mediaBucket)
    .upload(path, result, { contentType: mime, upsert: false });
  if (storageError) {
    console.error("CMS image upload failed", storageError.message);
    return { ok: false, message: "Не удалось загрузить файл в медиатеку." };
  }
  const title =
    stripControlCharacters(file.name).trim().slice(0, 240) || "Изображение";
  const { data, error } = await client
    .rpc("cms_add_media", {
      editor_id: editor.id,
      asset_id: id,
      object_path: path,
      file_title: title,
      file_size: result.length,
      file_mime: mime,
    })
    .single();
  if (error) {
    // Remove only the unregistered upload created by this request.
    const { data: registered, error: checkError } = await client
      .from("media_assets")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (!registered && !checkError)
      await client.storage.from(mediaBucket).remove([path]);
    console.error("CMS image registration failed", error.message);
    return {
      ok: false,
      message: "Файл не удалось зарегистрировать в медиатеке.",
    };
  }
  revalidatePath("/admin");
  return { ok: true, data: data as MediaItem };
}

export async function listMedia(
  query = "",
  page = 0,
): Promise<CmsResult<MediaItem[]>> {
  const editor = await getEditor();
  if (!editor) return { ok: false, message: "Медиатека доступна редакторам." };
  const input = z
    .object({
      query: z.string().max(100),
      page: z.number().int().min(0).max(10000),
    })
    .safeParse({ query, page });
  if (!input.success)
    return { ok: false, message: "Проверьте параметры поиска." };
  const request = editor.client
    .from("media_assets")
    .select(fields)
    .order("created_at", { ascending: false })
    .order("id")
    .range(page * 24, page * 24 + 23);
  if (query.trim())
    request.ilike(
      "title",
      "%" +
        query
          .replaceAll("\\", "\\\\")
          .replaceAll("%", "\\%")
          .replaceAll("_", "\\_") +
        "%",
    );
  const { data, error } = await request;
  return error
    ? { ok: false, message: "Не удалось открыть медиатеку." }
    : { ok: true, data: data as MediaItem[] };
}
