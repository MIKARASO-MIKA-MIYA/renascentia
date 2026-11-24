"use client";

import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { ImageAsset } from "@/content/images";
import type { FeaturedVideoConfig } from "@/content/video";
import { ActionArrow } from "../action-arrow";

export function FeaturedVideo({
  video,
  cover,
}: {
  video: FeaturedVideoConfig | null;
  cover: ImageAsset;
}) {
  const [started, setStarted] = useState(false);
  const available = video && /^[\w-]{11}$/.test(video.id);

  return (
    <section
      id="featured-video"
      className="dark-section border-b border-white/10"
      aria-labelledby="featured-video-heading"
    >
      <div className="page-container page-spacing grid items-center gap-6 md:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <div>
          <h2 id="featured-video-heading" className="section-title">
            Рекомендуемое видео
          </h2>
          {available && (
            <>
              <h3 className="mt-4 text-xl font-extrabold">{video.title}</h3>
              <p className="mt-1 text-sm text-neutral-300">{video.author}</p>
            </>
          )}
          <p className="mt-4 max-w-[50ch] text-neutral-200">
            {available
              ? video.description
              : "Документальный фильм появится после проверки содержания и разрешения на встраивание."}
          </p>
          {available && (
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              className="action-link mt-3"
            >
              Открыть на YouTube <ActionArrow />
            </a>
          )}
        </div>
        <div className="relative aspect-video overflow-hidden rounded-xs bg-black">
          {available && started ? (
            <iframe
              title={video.title}
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1`}
              className="size-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              allowFullScreen
            />
          ) : (
            <>
              <Image
                src={cover.src}
                alt=""
                fill
                sizes="(min-width: 768px) 57vw, 92vw"
                className="object-cover"
                style={{ objectPosition: cover.position }}
              />
              <div className="absolute inset-0 grid place-items-center bg-black/45">
                {available ? (
                  <button
                    type="button"
                    onClick={() => setStarted(true)}
                    aria-label="Воспроизвести документальный фильм"
                    className="cta"
                  >
                    <Play size={20} aria-hidden="true" /> Смотреть
                  </button>
                ) : (
                  <span className="rounded-xs bg-black/80 px-3 py-2 text-sm font-bold">
                    Видео подбирается
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
