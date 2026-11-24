import type { ReactNode } from "react";
import Link from "next/link";
import type { SiteSection } from "@/config/site";
import type { Material } from "@/content/types";
import { PageHeading } from "./page-heading";

export function MaterialDetail({
  section,
  material,
  context,
  cover,
  children,
}: {
  section: SiteSection;
  material: Material;
  context?: string;
  cover?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <article className="page-container page-spacing">
      <Link
        href={section.href}
        className="text-link inline-flex min-h-11 items-center"
      >
        {section.title}
      </Link>
      <div className="mt-5">
        {context && (
          <p className="mb-3 text-sm font-bold tracking-wide text-muted">
            {context}
          </p>
        )}
        <PageHeading
          title={material.title}
          description={material.description}
        />
        {material.status === "planned" && (
          <p className="mt-4 text-sm font-medium text-muted">В подготовке</p>
        )}
      </div>
      {cover}
      {!!material.body?.length && (
        <div className="mt-8 max-w-[70ch] space-y-4">
          {material.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}
      {children}
    </article>
  );
}
