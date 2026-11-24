import { z } from "zod";
import { getEditor, readerClient, writerClient } from "@/lib/cms/clients";
import { mediaBucket } from "@/lib/cms/config";

export async function GET(
  _: Request,
  { params }: RouteContext<"/cms/media/[id]">,
) {
  const { id } = await params;
  const reader = readerClient();
  const writer = writerClient();
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const missing = () => new Response(null, { status: 404, headers });
  if (!z.uuid().safeParse(id).success || !reader || !writer) return missing();

  const { data: publicPath } = await reader.rpc("cms_public_media", {
    asset_id: id,
  });
  let path = typeof publicPath === "string" ? publicPath : undefined;
  if (!path) {
    const editor = await getEditor();
    if (!editor) return missing();
    const { data } = await editor.client
      .from("media_assets")
      .select("path")
      .eq("id", id)
      .maybeSingle();
    path = data?.path;
  }
  if (!path) return missing();
  const { data } = await writer.storage
    .from(mediaBucket)
    .createSignedUrl(path, 90);
  if (!data) return missing();
  return new Response(null, {
    status: 307,
    headers: {
      ...headers,
      Location: data.signedUrl,
      "Referrer-Policy": "no-referrer",
    },
  });
}
