import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.renaissance);

export default function RenaissancePage() {
  return (
    <ThematicPage section={sections.renaissance} groups={guides.renaissance} />
  );
}
