import { loadEdit } from "../actions";
import { getEditor } from "@/lib/cms/clients";
import { documentSchema, pageKeySchema } from "@/lib/cms/schema";
import { toMarkdown } from "@/lib/cms/markdown";
import { cmsSeeds } from "@/lib/cms/registry";

export async function GET(request: Request) {
  const editor = await getEditor();
  const privateHeaders = {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (!editor?.owner)
    return new Response(null, { status: 403, headers: privateHeaders });
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const format = searchParams.get("format");
  let results = cmsSeeds.map(({ key, seed }) => ({
    key,
    revision: 0,
    body: seed,
  }));
  if (key !== null) {
    if (!pageKeySchema.safeParse(key).success)
      return new Response(null, { status: 400, headers: privateHeaders });
    const result = await loadEdit(key);
    if (!result.ok)
      return new Response(null, { status: 404, headers: privateHeaders });
    if (format === "markdown") {
      if (!/^\/publications\/[a-z0-9-]+$/.test(key))
        return new Response(null, { status: 400, headers: privateHeaders });
      return new Response(toMarkdown(result.data.body), {
        headers: {
          ...privateHeaders,
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="' + key.split("/").at(-1) + '.md"',
        },
      });
    }
    results = [{ key, revision: result.data.revision, body: result.data.body }];
  } else {
    const entries = new Map(results.map((result) => [result.key, result]));
    for (let from = 0; ; from += 100) {
      const { data, error } = await editor.client
        .rpc("cms_export")
        .range(from, from + 99);
      if (error || !Array.isArray(data))
        return new Response(null, { status: 503, headers: privateHeaders });
      for (const item of data) {
        const parsed = documentSchema.safeParse(item.body);
        if (!parsed.success)
          return new Response(null, { status: 409, headers: privateHeaders });
        entries.set(item.key, {
          key: item.key,
          revision: item.revision,
          body: parsed.data,
        });
      }
      if (data.length < 100) break;
    }
    results = [...entries.values()];
  }
  return new Response(
    JSON.stringify(
      { format: 1, kind: "renascentia-backup", entries: results },
      null,
      2,
    ),
    {
      headers: {
        ...privateHeaders,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="renascentia-content.json"',
      },
    },
  );
}
