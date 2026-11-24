import { isDeepStrictEqual } from "node:util";
import type { ReactNode } from "react";
import { cache } from "react";
import { headers } from "next/headers";
import { loadEdit } from "@/app/admin/actions";
import { getEditor, writerConfigured } from "@/lib/cms/clients";
import { publishedEntries, publishedEntry } from "@/lib/cms/data";
import { articleChoices, seedByKey } from "@/lib/cms/registry";
import { previewHeader, supabaseConfig } from "@/lib/cms/config";
import { EditHandle } from "./edit-handle";
import { RichBlocks } from "./rich-blocks";

export const previewDraft = cache(async (key: string) => {
  if (!supabaseConfig() || (await headers()).get(previewHeader) !== key)
    return undefined;
  const draft = await loadEdit(key);
  return draft.ok ? draft.data.body : undefined;
});

export const cmsView = cache(async (key: string) => {
  const body = (await previewDraft(key)) ?? (await publishedEntry(key))?.body;
  const seed = seedByKey.get(key);
  return {
    title: body?.title ?? seed?.seed.title,
    description: body?.description ?? seed?.seed.description,
    fields: { ...seed?.seed.fields, ...body?.fields },
    blocks: body?.blocks ?? [],
    changedBlocks: Boolean(
      body && !isDeepStrictEqual(body.blocks, seed?.seed.blocks),
    ),
  };
});

export async function CmsEdit({
  name,
  inline,
}: {
  name: string;
  inline?: boolean;
}) {
  if (!writerConfigured()) return null;
  const editor = await getEditor();
  if (!editor) return null;
  const builtin = seedByKey.get(name);
  const choices = new Map<string, string>();
  if (name === "/~featured") {
    articleChoices.forEach(({ slug, title }) => choices.set(slug, title));
    for (const { path, kind, body } of await publishedEntries()) {
      if (kind === "publication") choices.set(path.split("/")[2], body.title);
    }
  }
  return (
    <EditHandle
      entryKey={name}
      canPublish={editor.publish}
      owner={editor.owner}
      builtIn={Boolean(builtin)}
      fields={Object.entries(builtin?.fields ?? {})}
      articles={
        name === "/~featured"
          ? [...choices].map(([slug, title]) => ({ slug, title }))
          : []
      }
      inline={inline}
    />
  );
}

export async function CmsRegion({
  name,
  header,
  children,
  replace = false,
  className,
}: {
  name: string;
  header?: ReactNode;
  children?: ReactNode;
  replace?: boolean;
  className?: string;
}) {
  const { changedBlocks, blocks } = await cmsView(name);
  const showEditor = Boolean(writerConfigured() && (await getEditor()));
  const rendered = (
    <>
      {header}
      {(!replace || !changedBlocks) && children}
      {changedBlocks && <RichBlocks blocks={blocks} />}
    </>
  );
  if (!showEditor && !className) return rendered;
  return (
    <div className={["cms-region", className].filter(Boolean).join(" ")}>
      {showEditor && <CmsEdit name={name} />}
      {rendered}
    </div>
  );
}
