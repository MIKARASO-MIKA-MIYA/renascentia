import Link from "next/link";
import { MaterialCover } from "@/components/material-cover";
import { MaterialDetail } from "@/components/material-detail";
import { ResourceList } from "@/components/resource-list";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { publications } from "@/content/publications";
import { research } from "@/content/research";
import { getMaterial, materialHref } from "@/lib/materials";
import { materialMetadata } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return research.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/research/[slug]">) {
  const { slug } = await params;
  return materialMetadata("research", getMaterial(research, slug));
}

export default async function ResearchDetailPage({
  params,
}: PageProps<"/research/[slug]">) {
  const { slug } = await params;
  const material = getMaterial(research, slug);
  const program = "code" in material ? material : undefined;
  const related = publications
    .filter((item) => item.researchSlug === slug)
    .map((item) => ({
      title: item.title,
      description: item.description,
      href: materialHref("publications", item.slug),
    }));

  return (
    <MaterialDetail
      section={sections.research}
      material={material}
      context={program?.code}
      cover={program && <MaterialCover asset={images[program.imageKey]} />}
    >
      {program && (
        <section className="mt-8 max-w-[70ch]">
          <h2 className="mb-3 text-xl font-extrabold">Вопросы программы</h2>
          <ul className="list-disc space-y-2 pl-5">
            {program.questions.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      )}
      {related.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-extrabold">Материалы по теме</h2>
          <ResourceList items={related} />
        </section>
      ) : (
        <Link
          href={sections.sources.href}
          className="text-link mt-8 inline-block"
        >
          Источники для исследования
        </Link>
      )}
    </MaterialDetail>
  );
}
