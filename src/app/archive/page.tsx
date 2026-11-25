import { Download } from "lucide-react";
import { ArtworkOfTheDay } from "@/components/home/artwork-of-the-day";
import { ImageGallery } from "@/components/home/image-gallery";
import { PresentationViewer } from "@/components/presentation-viewer";
import { SectionPage } from "@/components/section-page";
import { sections } from "@/config/site";
import { cmsPageMetadata } from "@/lib/seo";

export const generateMetadata = () => cmsPageMetadata(sections.archive);

const presentationTitle = "Қайта өрлеу";

const slides = [
  "Қайта өрлеу",
  "Эпоха Возрождения простыми словами",
  "Что было до Возрождения и что изменилось",
  "Гуманизм",
  "Где началось Возрождение",
  "Как изменились искусство и знания",
  "Томас Мор",
  "Утопия",
  "Қызықты деректер",
  "Джордано Бруно",
  "Батыл гипотеза және қайғылы тағдыр",
  "Қорытынды",
  "Назарыңызға көп рақмет",
].map((title, index) => ({
  src: `/materials/renaissance-slides/slide-${String(index + 1).padStart(2, "0")}.webp`,
  title,
}));

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
        <article className="grid items-start gap-6 border-y border-border py-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <h3 className="text-xl font-extrabold">
              <span lang="kk">{presentationTitle}</span> (Эпоха Возрождения)
            </h3>
            <p className="mt-1 text-sm text-muted">
              {slides.length} слайдов · русский и казахский
            </p>
            <p className="mt-3 max-w-[60ch]">
              Учебная презентация о гуманизме, искусстве и науке Возрождения, а
              также об идеях Томаса Мора и Джордано Бруно.
            </p>
            <a
              href="/materials/renaissance-presentation.pptx"
              download="Қайта өрлеу.pptx"
              className="action-link text-link mt-3"
            >
              <Download size={18} aria-hidden="true" />
              Скачать PPTX
            </a>
          </div>
          <div className="lg:order-first">
            <PresentationViewer title={presentationTitle} slides={slides} />
          </div>
        </article>
      </section>
    </>
  );
}
