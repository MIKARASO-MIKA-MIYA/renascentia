import Image from "next/image";
import Link from "next/link";
import { topics } from "@/content/home";
import { images } from "@/content/images";
import { ActionArrow } from "../action-arrow";
import { CmsRegion, cmsView } from "../cms/region";
import { assetWithFields } from "@/lib/cms/registry";

export async function TopicGrid() {
  const [{ fields }, { fields: pictureFields }] = await Promise.all([
    cmsView("/~topics"),
    cmsView("/sources~images"),
  ]);
  return (
    <CmsRegion name="/~topics">
      <section
        className="page-container page-spacing"
        aria-labelledby="topics-heading"
      >
        <h2 id="topics-heading" className="section-title mb-6">
          Другие темы эпохи Возрождения
        </h2>
        <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map(({ image }, index) => {
            const href = fields[index + ".href"];
            const title = fields[index + ".title"];
            const asset = assetWithFields(
              images[image],
              pictureFields,
              fields[index + ".image"],
            );
            return (
              <li key={index}>
                <Link
                  href={href}
                  className="image-tile topic-tile items-center"
                >
                  <Image
                    src={asset.src}
                    unoptimized={!asset.src.startsWith("/images/")}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 23vw, (min-width: 640px) 46vw, 92vw"
                    className="tile-image"
                    style={{ objectPosition: asset.position }}
                  />
                  <span className="tile-content items-center font-extrabold">
                    {title} <ActionArrow />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </CmsRegion>
  );
}
