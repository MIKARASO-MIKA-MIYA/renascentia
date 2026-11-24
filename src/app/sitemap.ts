import type { MetadataRoute } from "next";
import { sections } from "@/config/site";
import { collectionNames, collections, materialHref } from "@/lib/materials";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];

  const sectionPaths = Object.values(sections)
    .filter(({ href }) => href !== sections.search.href)
    .map(({ href }) => href);
  const materialPaths = collectionNames.flatMap((collection) =>
    collections[collection]
      .filter(({ status }) => status === "published")
      .map(({ slug }) => materialHref(collection, slug)),
  );

  return ["/", ...sectionPaths, ...materialPaths].map((path) => ({
    url: new URL(path, siteUrl).href,
  }));
}
