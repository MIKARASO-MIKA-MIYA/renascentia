import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/content/articles";
import { images } from "@/content/images";
import { materialHref } from "@/lib/materials";
import { readingTime } from "@/lib/reading-time";

export function PublicationCard({
  article,
  variant,
}: {
  article: Article;
  variant: "feature" | "compact" | "menu";
}) {
  const image = images[article.imageKey];
  const href = materialHref("publications", article.slug);
  const metadata = `${article.category} · ${readingTime(article.body)}`;

  if (variant === "feature") {
    return (
      <Link href={href} className="image-tile editorial-tile">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 46vw, (min-width: 640px) 46vw, 92vw"
          className="tile-image"
          style={{ objectPosition: image.position }}
        />
        <div className="tile-content">
          <div>
            <p className="mb-2 text-xs font-bold tracking-wider uppercase text-white/90">
              {metadata}
            </p>
            <h3>{article.title}</h3>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={href} className="group flex min-w-0 items-start gap-3">
        <span className="relative mt-0.5 block size-14 shrink-0 overflow-hidden rounded-full bg-surface sm:size-16">
          <Image
            src={image.src}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
            style={{ objectPosition: image.position }}
          />
        </span>
        <span className="min-w-0">
          <span className="mb-1 block text-[0.72rem] font-semibold leading-tight text-muted">
            {metadata}
          </span>
          <span className="block font-extrabold leading-snug wrap-break-word group-hover:underline">
            {article.title}
          </span>
        </span>
      </Link>
    );
  }

  return (
    <Link href={href} className="group block min-w-0">
      <div className="relative aspect-[1.85] overflow-hidden rounded-xs bg-panel">
        <Image
          src={image.src}
          alt=""
          fill
          sizes="(min-width: 1024px) 23vw, (min-width: 640px) 30vw, 92vw"
          className="object-cover"
          style={{ objectPosition: image.position }}
        />
      </div>
      <p className="mt-2 text-xs font-semibold leading-tight text-neutral-300">
        {metadata}
      </p>
      <p className="mt-1 font-extrabold leading-snug group-hover:underline">
        {article.title}
      </p>
    </Link>
  );
}
