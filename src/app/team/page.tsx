import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

const section = sections.team;
export const metadata = pageMetadata(section);

export default function TeamPage() {
  return <SectionPage section={section} />;
}
