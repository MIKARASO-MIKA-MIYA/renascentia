import type { MetadataRoute } from "next";
import { sections } from "@/config/site";
import { collectionNames, collections, materialHref } from "@/lib/materials";
import { siteUrl } from "@/lib/seo";
import { publishedEntries } from "@/lib/cms/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!siteUrl) return [];

  const sectionPaths = Object.values(sections)
    .filter(({ href }) => href !== sections.search.href)
    .map(({ href }) => href);
  const materialPaths = collectionNames.flatMap((collection) =>
    collections[collection]
      .filter(({ status }) => status === "published")
      .map(({ slug }) => materialHref(collection, slug)),
  );

  const cmsPaths = (await publishedEntries())
    .filter(({ path, key }) => path === key)
    .map(({ path }) => path);
  return [
    ...new Set(["/", ...sectionPaths, ...materialPaths, ...cmsPaths]),
  ].map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}
