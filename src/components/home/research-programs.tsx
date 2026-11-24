import Link from "next/link";
import { sections } from "@/config/site";
import { programs } from "@/content/programs";
import { ActionArrow } from "../action-arrow";
import { ResearchProgramCard } from "./research-program-card";

export function ProgramGrid() {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {programs.map((program) => (
        <li key={program.slug}>
          <ResearchProgramCard program={program} />
        </li>
      ))}
    </ul>
  );
}

export function ResearchPrograms() {
  return (
    <section
      id="programs"
      className="dark-section"
      aria-labelledby="programs-heading"
    >
      <div className="page-container page-spacing">
        <div className="section-row">
          <h2 id="programs-heading" className="section-title">
            Исследовательские программы
          </h2>
          <Link
            href={sections.research.href}
            className="action-link max-sm:hidden"
          >
            Все программы <ActionArrow />
          </Link>
        </div>
        <ProgramGrid />
        <Link
          href={sections.research.href}
          className="action-link mt-4 border-t border-white/20 pt-4 sm:hidden"
        >
          Все программы <ActionArrow />
        </Link>
      </div>
    </section>
  );
}
