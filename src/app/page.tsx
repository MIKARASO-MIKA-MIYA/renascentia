import { AnnouncementBar } from "@/components/home/announcement-bar";
import { ArchiveBanner } from "@/components/home/archive-banner";
import { ArtworkOfTheDay } from "@/components/home/artwork-of-the-day";
import { FeaturedResearch } from "@/components/home/featured-research";
import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ImageGallery } from "@/components/home/image-gallery";
import { ResearchPrograms } from "@/components/home/research-programs";
import { TopicGrid } from "@/components/home/topic-grid";
import { CmsRegion, cmsView } from "@/components/cms/region";
import { site } from "@/config/site";
import { images } from "@/content/images";
import { assetWithFields } from "@/lib/cms/registry";
import { videoSource } from "@/lib/cms/schema";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () =>
  cmsPageMetadata({
    title: site.name,
    description: site.description,
    href: "/",
    absoluteTitle: true,
  });

export default async function HomePage() {
  const [{ fields: hero }, { fields: pictureFields }, { fields: videoFields }] =
    await Promise.all([
      cmsView("/~hero"),
      cmsView("/sources~images"),
      cmsView("/~video"),
    ]);
  const [firstSlide, ...remainingSlides] = Array.from(
    { length: 6 },
    (_, index) => ({
      title: hero[index + ".title"],
      description: hero[index + ".description"],
      action: hero[index + ".action"],
      href: hero[index + ".href"],
      image: assetWithFields(
        images.florence,
        pictureFields,
        hero[index + ".image"],
      ),
    }),
  ).filter(({ title }) => Boolean(title));
  const video = videoSource(videoFields.url ?? "");

  return (
    <>
      <AnnouncementBar />
      <CmsRegion name="/~hero">
        <HeroCarousel slides={[firstSlide, ...remainingSlides]} />
      </CmsRegion>
      <FeaturedResearch />
      <CmsRegion name="/~video">
        <FeaturedVideo
          video={
            video?.type === "youtube"
              ? {
                  id: video.id,
                  title: videoFields.headline || "Видео",
                  author: videoFields.author,
                  description: videoFields.summary,
                }
              : null
          }
          cover={assetWithFields(
            images.sanlorenzo,
            pictureFields,
            videoFields.cover,
          )}
        />
      </CmsRegion>
      <ResearchPrograms />
      <ArtworkOfTheDay />
      <ImageGallery />
      <ArchiveBanner />
      <TopicGrid />
      <CmsRegion name="/" className="page-container" />
    </>
  );
}
