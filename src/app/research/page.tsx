import Link from "next/link";
import { ProgramGrid } from "@/components/home/research-programs";
import { PageHeading } from "@/components/page-heading";
import { sections } from "@/config/site";
import { overview } from "@/content/research";
import { materialHref } from "@/lib/materials";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.research);

export default function ResearchPage() {
  return (
    <>
      <div className="page-container page-spacing">
        <PageHeading
          title={sections.research.title}
          description={sections.research.description}
        />
        <Link
          href={materialHref("research", overview.slug)}
          className="text-link mt-4 inline-flex min-h-11 items-center"
        >
          Обзор «Философия эпохи Возрождения»
        </Link>
      </div>
      <section
        className="dark-section py-8"
        aria-label="Каталог исследовательских программ"
      >
        <div className="page-container">
          <h2 className="sr-only">Каталог исследовательских программ</h2>
          <ProgramGrid />
        </div>
      </section>
    </>
  );
}
