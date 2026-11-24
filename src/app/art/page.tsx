import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.art);

export default function ArtPage() {
  return <ThematicPage section={sections.art} groups={guides.art} />;
}
