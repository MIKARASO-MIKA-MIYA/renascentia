import { ArtworkOfTheDay } from "@/components/home/artwork-of-the-day";
import { ImageGallery } from "@/components/home/image-gallery";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.archive);

export default function ArchivePage() {
  return (
    <>
      <SectionPage section={sections.archive} />
      <ArtworkOfTheDay inArchive />
      <ImageGallery inArchive />
    </>
  );
}
