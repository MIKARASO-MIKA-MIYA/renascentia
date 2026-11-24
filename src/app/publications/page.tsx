import { MaterialList } from "@/components/material-list";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { listMaterialLinks } from "@/lib/materials";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.publications);

export default function PublicationsPage() {
  return (
    <SectionPage section={sections.publications}>
      <div className="mt-8 max-w-3xl">
        <MaterialList items={listMaterialLinks("publications")} />
      </div>
    </SectionPage>
  );
}
