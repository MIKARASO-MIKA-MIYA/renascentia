import { notFound } from "next/navigation";
import { loadEdit } from "@/app/admin/actions";
import { getEditor } from "@/lib/cms/clients";
import { publishedEntry } from "@/lib/cms/data";
import { newPathSchema } from "@/lib/cms/schema";
import { pageMetadata } from "@/lib/seo";
import { PageHeading } from "../page-heading";
import { CmsEdit, previewDraft } from "./region";
import { RichBlocks } from "./rich-blocks";

export async function managedMetadata(path: string, kind: string) {
  const entry = newPathSchema.safeParse(path).success
    ? await publishedEntry(path)
    : undefined;
  return entry?.kind === kind
    ? pageMetadata({ ...entry.body, href: path })
    : { robots: { index: false, follow: false } };
}

export async function ManagedPage({
  path,
  kind,
}: {
  path: string;
  kind: string;
}) {
  if (!newPathSchema.safeParse(path).success) notFound();
  const entry = await publishedEntry(path);
  const editor = await getEditor();
  if (entry && entry.kind !== kind) notFound();
  const draft = !entry && editor ? await loadEdit(path) : undefined;
  const document =
    (await previewDraft(path)) ??
    entry?.body ??
    (draft?.ok ? draft.data.body : null);
  if (!document) notFound();
  return (
    <article className="page-container page-spacing cms-region">
      {editor && <CmsEdit name={path} />}
      {!entry && <p className="mb-3 text-sm font-bold text-muted">Черновик</p>}
      <PageHeading title={document.title} description={document.description} />
      <RichBlocks blocks={document.blocks} />
    </article>
  );
}
