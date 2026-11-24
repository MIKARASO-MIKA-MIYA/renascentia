import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { cmsPageMetadata } from "@/lib/seo";

const section = sections.team;
export const generateMetadata = () => cmsPageMetadata(section);

export default function TeamPage() {
  return <SectionPage section={section} />;
}
