import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.philosophy);

export default function PhilosophyPage() {
  return (
    <ThematicPage section={sections.philosophy} groups={guides.philosophy} />
  );
}
