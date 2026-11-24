import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sections } from "@/config/site";
import { images } from "@/content/images";

export function ArchiveBanner() {
  return (
    <section
      className="archive-banner [--focus-color:var(--color-masthead-focus)]"
      aria-labelledby="archive-banner-title"
    >
      <Image
        src={images.map.src}
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div className="page-container page-spacing">
        <div className="max-w-[52ch]">
          <h2 id="archive-banner-title" className="section-title">
            Откройте эпоху, которая изменила мир
          </h2>
          <p className="mt-4 max-w-[43ch] text-white/95">
            Исследуйте идеи великих мыслителей, исторические документы и
            философские труды, сформировавшие новое мировоззрение европейского
            общества.
          </p>
          <Link href={sections.archive.href} className="cta mt-6">
            Перейти в исторический архив{" "}
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
