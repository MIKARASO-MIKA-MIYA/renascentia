import type { Metadata } from "next";
import { site } from "@/config/site";
import type { Material } from "@/content/types";
import { materialHref, type Collection } from "./materials";
import { publishedEntry } from "./cms/data";

const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
const configuredUrl =
  process.env.SITE_URL?.trim() ||
  (vercelDomain ? `https://${vercelDomain}` : "");

export const siteUrl = configuredUrl ? new URL(configuredUrl) : undefined;

if (siteUrl && !["http:", "https:"].includes(siteUrl.protocol)) {
  throw new Error("SITE_URL must use http or https.");
}

type PageMetadata = {
  title: string;
  description: string;
  href: string;
  indexable?: boolean;
  absoluteTitle?: boolean;
};

export function pageMetadata({
  title,
  description,
  href,
  indexable = true,
  absoluteTitle = false,
}: PageMetadata): Metadata {
  const url = siteUrl ? new URL(href, siteUrl) : undefined;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: url && indexable ? { canonical: url } : undefined,
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: site.locale,
      title,
      description,
      url,
    },
  };
}

export async function cmsPageMetadata(input: PageMetadata): Promise<Metadata> {
  const entry = await publishedEntry(input.href);
  return pageMetadata(
    entry
      ? {
          ...input,
          title: entry.body.title,
          description: entry.body.description,
          indexable:
            input.indexable === false && entry.kind !== "publication"
              ? false
              : true,
        }
      : input,
  );
}

export function materialMetadata(
  collection: Collection,
  material: Material,
): Promise<Metadata> {
  return cmsPageMetadata({
    title: material.title,
    description: material.description,
    href: materialHref(collection, material.slug),
    indexable: material.status === "published",
  });
}
