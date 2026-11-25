import { Download } from "lucide-react";
import Image from "next/image";
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
      <section
        id="presentations"
        aria-labelledby="presentations-heading"
        className="page-container pb-[var(--page-space)]"
      >
        <h2 id="presentations-heading" className="section-title mb-6">
          Презентации
        </h2>
        <article className="grid items-center gap-6 border-y border-border py-5 sm:grid-cols-[minmax(0,18rem)_1fr]">
          <Image
            src="/materials/renaissance-presentation.webp"
            alt=""
            width={640}
            height={360}
            sizes="(min-width: 640px) 288px, 92vw"
            className="w-full rounded-xs"
          />
          <div>
            <h3 className="text-xl font-extrabold">
              <span lang="kk">Қайта өрлеу</span> (Эпоха Возрождения)
            </h3>
            <p className="mt-1 text-sm text-muted">
              13 слайдов · русский и казахский
            </p>
            <p className="mt-3 max-w-[60ch]">
              Учебная презентация о гуманизме, искусстве и науке Возрождения, а
              также об идеях Томаса Мора и Джордано Бруно.
            </p>
            <a
              href="/materials/renaissance-presentation.pptx"
              download="Қайта өрлеу.pptx"
              className="cta mt-4"
            >
              <Download size={18} aria-hidden="true" />
              Скачать PPTX
            </a>
          </div>
        </article>
      </section>
    </>
  );
}
