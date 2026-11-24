import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { ImageGallery } from "@/components/home/image-gallery";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { featuredVideo } from "@/content/video";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(sections.multimedia);

export default function MultimediaPage() {
  return (
    <>
      <SectionPage section={sections.multimedia} />
      <FeaturedVideo
        video={featuredVideo.video}
        cover={images[featuredVideo.cover]}
      />
      <div className="pt-[var(--page-space)]">
        <ImageGallery inArchive />
      </div>
    </>
  );
}
