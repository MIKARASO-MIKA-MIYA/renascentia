import Link from "next/link";
import { MaterialCover } from "@/components/material-cover";
import { MaterialDetail } from "@/components/material-detail";
import { CmsRegion, cmsView } from "@/components/cms/region";
import { ManagedPage, managedMetadata } from "@/components/cms/managed-page";
import { ResourceList } from "@/components/resource-list";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { isArticle, publications } from "@/content/publications";
import { research } from "@/content/research";
import { getMaterial, materialHref } from "@/lib/materials";
import { readingTime } from "@/lib/reading-time";
import { materialMetadata } from "@/lib/seo";
import { assetWithFields } from "@/lib/cms/registry";
import { publishedEntry } from "@/lib/cms/data";
import { plainText } from "@/lib/cms/schema";

export function generateStaticParams() {
  return publications.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/publications/[slug]">) {
  const { slug } = await params;
  const material = publications.find((item) => item.slug === slug);
  return material
    ? materialMetadata("publications", material)
    : managedMetadata("/publications/" + slug, "publication");
}

export default async function PublicationDetailPage({
  params,
}: PageProps<"/publications/[slug]">) {
  const { slug } = await params;
  const key = "/publications/" + slug;
  const material = publications.find((item) => item.slug === slug);
  if (!material) return <ManagedPage path={key} kind="publication" />;
  const [{ fields, changedBlocks, blocks }, { fields: imageFields }, edited] =
    await Promise.all([
      cmsView(key),
      cmsView("/sources~images"),
      publishedEntry(key),
    ]);
  const article = isArticle(material) ? material : undefined;
  const relatedResearch = material.researchSlug
    ? getMaterial(research, material.researchSlug)
    : undefined;

  return (
    <MaterialDetail
      section={sections.publications}
      material={
        edited && material.status === "planned"
          ? { ...material, status: "published" }
          : material
      }
      context={
        article
          ? `${fields.category ?? article.category} · ${readingTime(changedBlocks ? blocks.map(({ doc }) => plainText(doc)) : article.body)}`
          : undefined
      }
      cover={
        article && (
          <MaterialCover
            asset={assetWithFields(
              images[article.imageKey],
              imageFields,
              fields.cover,
            )}
          />
        )
      }
    >
      {article && (
        <CmsRegion name={key + "~sources"} replace>
          <section className="mt-8">
            <h2 className="mb-3 text-xl font-extrabold">Источники статьи</h2>
            <ResourceList items={article.sources} />
          </section>
        </CmsRegion>
      )}
      {relatedResearch && (
        <section className="mt-8">
          <h2 className="mb-2 text-xl font-extrabold">
            Связанное исследование
          </h2>
          <Link
            href={materialHref("research", relatedResearch.slug)}
            className="text-link"
          >
            {relatedResearch.title}
          </Link>
        </section>
      )}
    </MaterialDetail>
  );
}
