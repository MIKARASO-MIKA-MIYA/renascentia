import Link from "next/link";
import { sections } from "@/config/site";
import { artwork } from "@/content/home";
import { images } from "@/content/images";
import { ActionArrow } from "../action-arrow";
import { ImageCredit } from "../image-credit";
import { ImageViewer } from "../image-viewer";

export function ArtworkOfTheDay({
  inArchive = false,
}: {
  inArchive?: boolean;
}) {
  return (
    <section
      className={`page-container ${inArchive ? "pb-10" : "page-spacing"}`}
      aria-labelledby="artwork-heading"
    >
      <div className="grid items-center gap-7 md:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <h2 id="artwork-heading" className="section-title">
            Произведение дня
          </h2>
          <h3 className="mt-4 text-xl font-extrabold">{artwork.title}</h3>
          <p className="mt-1 text-sm font-semibold text-muted">
            {artwork.artist} · {artwork.date}
          </p>
          <p className="mt-4 max-w-[50ch]">{artwork.description}</p>
          <a
            href={artwork.source}
            className="text-link mt-3 inline-block text-sm"
          >
            Описание в Музеях Ватикана
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
            entries={[{ asset: images.school, label: "Живопись" }]}
          />
          <figcaption className="mt-2 text-xs leading-relaxed text-muted">
            <ImageCredit asset={images.school} />
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
