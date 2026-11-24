import { AnnouncementBar } from "@/components/home/announcement-bar";
import { ArchiveBanner } from "@/components/home/archive-banner";
import { ArtworkOfTheDay } from "@/components/home/artwork-of-the-day";
import { FeaturedResearch } from "@/components/home/featured-research";
import { FeaturedVideo } from "@/components/home/FeaturedVideo";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { ImageGallery } from "@/components/home/image-gallery";
import { ResearchPrograms } from "@/components/home/research-programs";
import { TopicGrid } from "@/components/home/topic-grid";
import { site } from "@/config/site";
import { heroSlides } from "@/content/home";
import { images } from "@/content/images";
import { featuredVideo } from "@/content/video";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: site.name,
  description: site.description,
  href: "/",
  absoluteTitle: true,
});

export default function HomePage() {
  const [firstSlide, ...remainingSlides] = heroSlides.map((slide) => ({
    ...slide,
    image: images[slide.image],
  }));

  return (
    <>
      <AnnouncementBar />
      <HeroCarousel slides={[firstSlide, ...remainingSlides]} />
      <FeaturedResearch />
      <FeaturedVideo
        video={featuredVideo.video}
        cover={images[featuredVideo.cover]}
      />
      <ResearchPrograms />
      <ArtworkOfTheDay />
      <ImageGallery />
      <ArchiveBanner />
      <TopicGrid />
    </>
  );
}
