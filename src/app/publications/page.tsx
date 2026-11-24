import { MaterialList } from "@/components/material-list";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { listMaterialLinks } from "@/lib/materials";
import { cmsPageMetadata } from "@/lib/seo";
import { publishedEntries } from "@/lib/cms/data";

export const generateMetadata = () => cmsPageMetadata(sections.publications);

export default async function PublicationsPage() {
  const edited = new Map(
    (await publishedEntries())
      .filter(({ kind }) => kind === "publication")
      .map((entry) => [entry.key, entry]),
  );
  const materials = listMaterialLinks("publications").map((item) => {
    const update = edited.get(item.href);
    if (!update) return item;
    edited.delete(item.href);
    return {
      ...item,
      title: update.body.title,
      description: update.body.description,
      status: "published" as const,
    };
  });
  const created = [...edited.values()].map(({ path, body }) => ({
    href: path,
    title: body.title,
    description: body.description,
    status: "published" as const,
  }));
  return (
    <SectionPage section={sections.publications}>
      <div className="mt-8 max-w-3xl">
        <MaterialList items={[...created, ...materials]} />
      </div>
    </SectionPage>
  );
}
