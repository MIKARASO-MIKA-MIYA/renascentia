import type { SiteSection } from "@/config/site";
import { ResourceList, type Resource } from "./resource-list";
import { SectionPage } from "./section-page";

export type ResourceGroup = {
  id?: string;
  title: string;
  items: readonly Resource[];
};

export function ThematicPage({
  section,
  groups,
}: {
  section: SiteSection;
  groups: readonly ResourceGroup[];
}) {
  return (
    <SectionPage section={section}>
      {groups.map(({ id, title, items }) => (
        <section id={id} key={title} className="mt-9 max-w-3xl">
          <h2 className="mb-3 text-xl font-extrabold">{title}</h2>
          <ResourceList items={items} />
        </section>
      ))}
    </SectionPage>
  );
}
