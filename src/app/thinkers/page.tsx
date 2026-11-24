import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.thinkers);

export default function ThinkersPage() {
  return <ThematicPage section={sections.thinkers} groups={guides.thinkers} />;
}
