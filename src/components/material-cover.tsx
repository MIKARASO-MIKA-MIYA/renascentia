import Image from "next/image";
import type { ImageAsset } from "@/content/images";
import { ImageCredit } from "./image-credit";

export function MaterialCover({ asset }: { asset: ImageAsset }) {
  return (
    <figure className="mt-8 max-w-4xl">
      <div className="relative aspect-[2.1] overflow-hidden rounded-xs bg-surface">
        <Image
          src={asset.src}
          alt={asset.alt}
          fill
          sizes="(min-width: 1024px) 896px, 92vw"
          className="object-cover"
          style={{ objectPosition: asset.position }}
        />
      </div>
      <figcaption className="mt-2 text-xs text-muted">
        <ImageCredit asset={asset} />
      </figcaption>
    </figure>
  );
}
