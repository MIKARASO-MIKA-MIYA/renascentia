import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.science);

export default function SciencePage() {
  return <ThematicPage section={sections.science} groups={guides.science} />;
}
