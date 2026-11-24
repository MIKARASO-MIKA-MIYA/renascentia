import { ThematicPage } from "@/components/thematic-page";
import { sections } from "@/config/site";
import { guides } from "@/content/section-guides";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.education);

export default function EducationPage() {
  return (
    <ThematicPage section={sections.education} groups={guides.education} />
  );
}
