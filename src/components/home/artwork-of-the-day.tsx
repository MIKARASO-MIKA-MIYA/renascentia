import Link from "next/link";
import { sections } from "@/config/site";
import { images } from "@/content/images";
import { assetWithFields } from "@/lib/cms/registry";
import { ActionArrow } from "../action-arrow";
import { CmsRegion, cmsView } from "../cms/region";
import { ImageCredit } from "../image-credit";
import { ImageViewer } from "../image-viewer";

export async function ArtworkOfTheDay({
  inArchive = false,
}: {
  inArchive?: boolean;
}) {
  const [{ fields }, { fields: pictureFields }] = await Promise.all([
    cmsView("/~artwork"),
    cmsView("/sources~images"),
  ]);
  const asset = assetWithFields(images.school, pictureFields, fields.image);
  return (
    <CmsRegion name="/~artwork">
      <section
        className={`page-container ${inArchive ? "pb-10" : "page-spacing"}`}
        aria-labelledby="artwork-heading"
      >
        <div className="grid items-center gap-7 md:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div>
            <h2 id="artwork-heading" className="section-title">
              Произведение дня
            </h2>
            <h3 className="mt-4 text-xl font-extrabold">{fields.headline}</h3>
            <p className="mt-1 text-sm font-semibold text-muted">
              {fields.artist} · {fields.date}
            </p>
            <p className="mt-4 max-w-[50ch]">{fields.summary}</p>
            <a
              href={fields.source}
              className="text-link mt-3 inline-block text-sm"
            >
              {fields.sourceLabel}
            </a>
            {!inArchive && (
              <div className="mt-4">
                <Link href={sections.archive.href} className="action-link">
                  Открыть архив <ActionArrow />
                </Link>
              </div>
            )}
          </div>
          <figure>
            <ImageViewer
              layout="artwork"
              entries={[{ asset, label: "Живопись" }]}
            />
            <figcaption className="mt-2 text-xs leading-relaxed text-muted">
              <ImageCredit asset={asset} />
            </figcaption>
          </figure>
        </div>
      </section>
    </CmsRegion>
  );
}
