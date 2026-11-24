import Link from "next/link";
import { MaterialCover } from "@/components/material-cover";
import { MaterialDetail } from "@/components/material-detail";
import { ResourceList } from "@/components/resource-list";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { isArticle, publications } from "@/content/publications";
import { research } from "@/content/research";
import { getMaterial, materialHref } from "@/lib/materials";
import { readingTime } from "@/lib/reading-time";
import { materialMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return publications.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/publications/[slug]">) {
  const { slug } = await params;
  return materialMetadata("publications", getMaterial(publications, slug));
}

export default async function PublicationDetailPage({
  params,
}: PageProps<"/publications/[slug]">) {
  const { slug } = await params;
  const material = getMaterial(publications, slug);
  const article = isArticle(material) ? material : undefined;
  const relatedResearch = material.researchSlug
    ? getMaterial(research, material.researchSlug)
    : undefined;

  return (
    <MaterialDetail
      section={sections.publications}
      material={material}
      context={
        article
          ? `${article.category} · ${readingTime(article.body)}`
          : undefined
      }
      cover={article && <MaterialCover asset={images[article.imageKey]} />}
    >
      {article && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-extrabold">Источники статьи</h2>
          <ResourceList items={article.sources} />
        </section>
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
