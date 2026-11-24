import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.art);

export default function ArtPage() {
  return <ThematicPage section={sections.art} groups={guides.art} />;
}
