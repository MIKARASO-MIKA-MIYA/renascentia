"use client";

import { ArrowLeft, ArrowRight, Maximize, X } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { ImageAsset } from "@/content/images";
import { ImageCredit } from "./image-credit";

export type ViewerEntry = { asset: ImageAsset; label: string };

export function ImageViewer({
  entries,
  layout = "gallery",
}: {
  entries: readonly ViewerEntry[];
  layout?: "gallery" | "artwork";
}) {
  const [position, setPosition] = useState(0);
  const viewer = useRef<HTMLDialogElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const selected = entries[position];
  if (!selected) return null;

  function step(offset: number) {
    setPosition(
      (current) => (current + offset + entries.length) % entries.length,
    );
  }

  function open(index: number) {
    setPosition(index);
    viewer.current?.showModal();
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await surface.current?.requestFullscreen();
    } catch {
      // The modal remains available when the browser declines full screen.
    }
  }

  function close() {
    if (document.fullscreenElement === surface.current)
      void document.exitFullscreen().catch(() => undefined);
    viewer.current?.close();
  }

  return (
    <>
      <div
        className={
          layout === "artwork"
            ? undefined
            : "grid grid-cols-2 items-start gap-x-3 gap-y-5 sm:grid-cols-3 lg:grid-cols-6"
        }
      >
        {entries.map(({ asset, label }, index) => (
          <button
            key={asset.src}
            type="button"
            onClick={() => open(index)}
            className="group block w-full min-w-0 cursor-zoom-in text-left"
            aria-label={`Открыть изображение. ${asset.title}`}
          >
            <span
              className={`relative block w-full overflow-hidden rounded-xs bg-surface ${layout === "artwork" ? "aspect-[1.85]" : "aspect-[1.6]"}`}
            >
              <Image
                unoptimized={!asset.src.startsWith("/images/")}
                src={asset.src}
                fill
                alt=""
                sizes={
                  layout === "artwork"
                    ? "(min-width: 768px) 57vw, 92vw"
                    : "(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw"
                }
                className="object-cover transition-transform duration-200 group-hover:scale-[1.035]"
                style={{ objectPosition: asset.position }}
              />
              {layout === "artwork" && (
                <span className="absolute right-2 bottom-2 grid size-10 place-items-center rounded-xs bg-black/80 text-white">
                  <Maximize size={18} aria-hidden="true" />
                </span>
              )}
            </span>
            {layout === "gallery" && (
              <>
                <span className="mt-2 block text-xs leading-tight text-muted">
                  {label}
                </span>
                <span className="mt-1 block text-sm font-extrabold leading-snug group-hover:underline">
                  {asset.title}
                </span>
              </>
            )}
          </button>
        ))}
      </div>
      <dialog
        ref={viewer}
        className="viewer-dialog"
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (entries.length < 2) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            step(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <div
          ref={surface}
          className="max-h-full overflow-y-auto bg-[#121214] px-4 py-4 sm:px-6"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2
              id={titleId}
              className="text-lg font-extrabold leading-snug sm:text-xl"
            >
              {selected.asset.title}
            </h2>
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                className="hero-control"
                aria-label="Переключить полноэкранный режим"
                onClick={() => {
                  void toggleFullscreen();
                }}
              >
                <Maximize size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="hero-control"
                aria-label="Закрыть просмотр"
                onClick={close}
                autoFocus
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
          </div>
          <Image
            unoptimized={!selected.asset.src.startsWith("/images/")}
            src={selected.asset.src}
            alt={selected.asset.alt}
            width={selected.asset.width}
            height={selected.asset.height}
            sizes="(min-width: 1200px) 1160px, 95vw"
            className="mx-auto max-h-[66dvh] w-full object-contain"
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm leading-snug text-neutral-300">
              <ImageCredit asset={selected.asset} />
            </p>
            {entries.length > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="hero-control"
                  aria-label="Предыдущее изображение"
                  onClick={() => step(-1)}
                >
                  <ArrowLeft size={17} aria-hidden="true" />
                </button>
                <span
                  className="min-w-12 text-center text-sm"
                  aria-live="polite"
                >
                  {position + 1} / {entries.length}
                </span>
                <button
                  type="button"
                  className="hero-control"
                  aria-label="Следующее изображение"
                  onClick={() => step(1)}
                >
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
