import Image from "next/image";
import Link from "next/link";
import { images } from "@/content/images";
import type { ResearchProgram } from "@/content/programs";
import { materialHref } from "@/lib/materials";
import { ActionArrow } from "../action-arrow";

export function ResearchProgramCard({ program }: { program: ResearchProgram }) {
  const asset = images[program.imageKey];
  const portrait = asset.height > asset.width;

  return (
    <Link
      href={materialHref("research", program.slug)}
      className={`image-tile program-tile${portrait ? " program-tile-portrait" : ""}`}
    >
      <span className="program-media absolute inset-0 -z-10">
        <Image
          src={asset.src}
          alt=""
          fill
          sizes={`(min-width: 1552px) 350px, (min-width: 1024px) 23vw, (min-width: 640px) 46vw, ${portrait ? "63vw" : "92vw"}`}
          className="tile-image"
          style={{ objectPosition: asset.position }}
        />
      </span>
      <div className="tile-content">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.18em]">
            {program.code}
          </p>
          <h3>{program.title}</h3>
        </div>
        <ActionArrow />
      </div>
    </Link>
  );
}
