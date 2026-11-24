import type { ReactNode } from "react";
import type { SiteSection } from "@/config/site";
import { PageHeading } from "./page-heading";

export function SectionPage({
  section,
  children,
}: {
  section: SiteSection;
  children?: ReactNode;
}) {
  return (
    <div className="page-container page-spacing">
      <PageHeading title={section.title} description={section.description} />
      {children}
    </div>
  );
}
