import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CmsRegion, cmsView } from "../cms/region";

export async function ArchiveBanner() {
  const { fields } = await cmsView("/~archive");
  return (
    <CmsRegion name="/~archive">
      <section
        className="archive-banner [--focus-color:var(--color-masthead-focus)]"
        aria-labelledby="archive-banner-title"
      >
        <Image
          src={fields.image}
          unoptimized={!fields.image.startsWith("/images/")}
          alt=""
          fill
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        <div className="page-container page-spacing">
          <div className="max-w-[52ch]">
            <h2 id="archive-banner-title" className="section-title">
              {fields.headline}
            </h2>
            <p className="mt-4 max-w-[43ch] text-white/95">{fields.summary}</p>
            <Link href={fields.href} className="cta mt-6">
              {fields.button} <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </CmsRegion>
  );
}
