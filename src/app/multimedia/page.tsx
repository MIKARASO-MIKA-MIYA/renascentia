import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { ImageGallery } from "@/components/home/image-gallery";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { CmsRegion, cmsView } from "@/components/cms/region";
import { assetWithFields } from "@/lib/cms/registry";
import { videoSource } from "@/lib/cms/schema";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.multimedia);

export default async function MultimediaPage() {
  const [{ fields }, { fields: imageFields }] = await Promise.all([
    cmsView("/~video"),
    cmsView("/sources~images"),
  ]);
  const video = videoSource(fields.url);
  return (
    <>
      <SectionPage section={sections.multimedia} />
      <CmsRegion name="/~video">
        <FeaturedVideo
          video={
            video?.type === "youtube"
              ? {
                  id: video.id,
                  title: fields.headline || "Видео",
                  author: fields.author,
                  description: fields.summary,
                }
              : null
          }
          cover={assetWithFields(images.sanlorenzo, imageFields, fields.cover)}
        />
      </CmsRegion>
      <div className="pt-[var(--page-space)]">
        <ImageGallery inArchive />
      </div>
    </>
  );
}
