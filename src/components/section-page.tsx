import type { ReactNode } from "react";
import type { SiteSection } from "@/config/site";
import { CmsRegion, cmsView } from "./cms/region";
import { PageHeading } from "./page-heading";

export async function SectionPage({
  section,
  children,
  replace,
  after,
}: {
  section: SiteSection;
  children?: ReactNode;
  replace?: boolean;
  after?: ReactNode;
}) {
  const editable = section.href !== "/search";
  const override = editable ? await cmsView(section.href) : null;
  const heading = (
    <PageHeading
      title={override?.title ?? section.title}
      description={override?.description ?? section.description}
    />
  );
  return (
    <div className="page-container page-spacing">
      {editable ? (
        <CmsRegion name={section.href} header={heading} replace={replace}>
          {children}
        </CmsRegion>
      ) : (
        <>
          {heading}
          {children}
        </>
      )}
      {after}
    </div>
  );
}
