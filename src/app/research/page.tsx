import Link from "next/link";
import { ProgramGrid } from "@/components/home/research-programs";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { overview } from "@/content/research";
import { materialHref } from "@/lib/materials";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.research);

export default function ResearchPage() {
  return (
    <>
      <SectionPage section={sections.research}>
        <Link
          href={materialHref("research", overview.slug)}
          className="text-link mt-4 inline-flex min-h-11 items-center"
        >
          Обзор «Философия эпохи Возрождения»
        </Link>
      </SectionPage>
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
