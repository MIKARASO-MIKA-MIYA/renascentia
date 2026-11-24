import { notFound } from "next/navigation";
import { publications } from "@/content/publications";
import { research } from "@/content/research";
import type { Material } from "@/content/types";

export const collections = { research, publications };
export type Collection = keyof typeof collections;
export const collectionNames = Object.keys(collections) as Collection[];

export type MaterialLink = Pick<
  Material,
  "title" | "description" | "status"
> & {
  href: string;
  category?: string;
  code?: string;
};

export function materialHref(collection: Collection, slug: string) {
  return `/${collection}/${encodeURIComponent(slug)}`;
}

export function listMaterialLinks(collection: Collection): MaterialLink[] {
  return collections[collection].map((entry) => ({
    href: materialHref(collection, entry.slug),
    title: entry.title,
    description: entry.description,
    status: entry.status,
    code: "code" in entry ? entry.code : undefined,
  }));
}

export function getMaterial<T extends Material>(
  entries: readonly T[],
  slug: string,
): T {
  const entry = entries.find((entry) => entry.slug === slug);
  if (!entry) notFound();
  return entry;
}
