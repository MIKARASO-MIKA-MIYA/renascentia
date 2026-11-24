import Image from "next/image";
import Link from "next/link";
import { topics } from "@/content/home";
import { images } from "@/content/images";
import { ActionArrow } from "../action-arrow";

export function TopicGrid() {
  return (
    <section
      className="page-container page-spacing"
      aria-labelledby="topics-heading"
    >
      <h2 id="topics-heading" className="section-title mb-6">
        Другие темы эпохи Возрождения
      </h2>
      <ul className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        {topics.map(({ href, title, image }) => {
          const asset = images[image];
          return (
            <li key={href}>
              <Link href={href} className="image-tile topic-tile items-center">
                <Image
                  src={asset.src}
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
  );
}
