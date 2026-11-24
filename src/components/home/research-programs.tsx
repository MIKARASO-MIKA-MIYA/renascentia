import Link from "next/link";
import { sections } from "@/config/site";
import { programs } from "@/content/programs";
import { images } from "@/content/images";
import { assetWithFields } from "@/lib/cms/registry";
import { publishedEntries } from "@/lib/cms/data";
import { ActionArrow } from "../action-arrow";
import { ResearchProgramCard } from "./research-program-card";
import { CmsRegion, cmsView } from "../cms/region";

export async function ProgramGrid({ home = false }: { home?: boolean }) {
  const [edits, { fields: pictureFields }, { fields: fields }] =
    await Promise.all([
      publishedEntries(),
      cmsView("/sources~images"),
      home ? cmsView("/~programs") : { fields: {} as Record<string, string> },
    ]);
  const titles = new Map(edits.map(({ key, body }) => [key, body]));
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {programs.map((program) => {
        const edited = titles.get("/research/" + program.slug);
        const title =
          fields[program.slug + ".title"] || edited?.title || program.title;
        const asset = assetWithFields(
          images[program.imageKey],
          pictureFields,
          fields[program.slug + ".image"] || edited?.fields.cover,
        );
        return (
          <li key={program.slug}>
            <ResearchProgramCard
              program={program}
              title={title}
              asset={asset}
            />
          </li>
        );
      })}
    </ul>
  );
}

export async function ResearchPrograms() {
  const { fields } = await cmsView("/~programs");
  return (
    <CmsRegion name="/~programs">
      <section
        id="programs"
        className="dark-section"
        aria-labelledby="programs-heading"
      >
        <div className="page-container page-spacing">
          <div className="section-row">
            <h2 id="programs-heading" className="section-title">
              {fields.headline}
            </h2>
            <Link
              href={sections.research.href}
              className="action-link max-sm:hidden"
            >
              Все программы <ActionArrow />
            </Link>
          </div>
          <ProgramGrid home />
          <Link
            href={sections.research.href}
            className="action-link mt-4 border-t border-white/20 pt-4 sm:hidden"
          >
            Все программы <ActionArrow />
          </Link>
        </div>
      </section>
    </CmsRegion>
  );
}
