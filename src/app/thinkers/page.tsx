import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { cmsPageMetadata } from "@/lib/seo";
import { publishedEntries } from "@/lib/cms/data";

export const generateMetadata = () => cmsPageMetadata(sections.thinkers);

export default async function ThinkersPage() {
  const biographies = (await publishedEntries())
    .filter(({ kind }) => kind === "biography")
    .map(({ path, body }) => ({
      href: path,
      title: body.title,
      description: body.description,
    }));
  return (
    <ThematicPage
      section={sections.thinkers}
      groups={guides.thinkers}
      after={
        biographies.length
          ? { title: "Биографии", items: biographies }
          : undefined
      }
    />
  );
}
